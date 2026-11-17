import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import { secretKey, publishableKey } from "../_shared/keys.ts";
import { assertUploadSize, detectMime, sha256Hex } from "../_shared/content-validation.mjs";

const url = Deno.env.get("SUPABASE_URL")!;
const adminKey = secretKey();
const publicKey = publishableKey();
const admin = adminKey ? createClient(url, adminKey) : null;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

async function callerId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (!auth || !publicKey) return null;
  try {
    const caller = createClient(url, publicKey, { global: { headers: { Authorization: auth } } });
    const { data, error } = await caller.auth.getUser();
    return error || !data?.user ? null : data.user.id;
  } catch {
    return null;
  }
}

function safeName(value: unknown): string {
  if (typeof value !== "string" || !value.trim() || value.length > 255) {
    throw new Error("invalid_filename");
  }
  const cleaned = value.replace(/[^A-Za-z0-9._-]+/g, "_");
  if (!cleaned || cleaned === "." || cleaned === "..") throw new Error("invalid_filename");
  return cleaned;
}

function parseOwnedPath(value: unknown, userId: string): { path: string; folder: string; objectName: string } {
  if (typeof value !== "string" || !value || value.length > 1024) throw new Error("invalid_path");
  const parts = value.split("/");
  if (parts[0] !== userId) throw new Error("path_not_owned");
  if (
    parts.length < 2 ||
    parts.some((part) =>
      !part || part === "." || part === ".." || part.length > 255 ||
      part.includes("\\") || /[\u0000-\u001f\u007f]/.test(part)
    )
  ) throw new Error("invalid_path");

  const objectName = parts[parts.length - 1];
  const folder = parts.slice(0, -1).join("/");
  return { path: value, folder, objectName };
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const userId = await callerId(req);
  if (!userId) return json({ error: "not_authenticated" }, 401);
  if (!admin) return json({ error: "server_not_configured" }, 503);

  try {
    const body = await req.json();
    if (body?.bucket !== "uploads") return json({ error: "unsupported_bucket" }, 400);

    const filename = safeName(body?.filename);
    const ownedPath = parseOwnedPath(body?.path, userId);
    const { path, folder, objectName } = ownedPath;
    const storage = admin.storage.from("uploads");

    // Storage.list() is scoped to one folder. Resolve the actual parent folder
    // so valid nested object paths do not fail or accidentally match a sibling.
    const { data: objects, error: listError } = await storage.list(folder, {
      limit: 100,
      search: objectName,
    });
    if (listError) throw listError;
    const object = (objects || []).find((entry) => entry.name === objectName && entry.id);
    if (!object) return json({ error: "object_not_found" }, 404);

    // Never trust client-supplied size or MIME. Download the private object,
    // enforce the same 50 MiB limit as the bucket, identify its byte signature,
    // and calculate SHA-256 before registering metadata.
    const { data: objectBlob, error: downloadError } = await storage.download(path);
    if (downloadError || !objectBlob) throw downloadError || new Error("object_download_failed");

    let sizeBytes: number;
    try {
      sizeBytes = assertUploadSize(objectBlob.size);
    } catch (error) {
      if (error instanceof RangeError && error.message === "upload_too_large") {
        return json({ error: "upload_too_large" }, 413);
      }
      throw error;
    }

    const bytes = new Uint8Array(await objectBlob.arrayBuffer());
    if (bytes.byteLength !== sizeBytes) throw new Error("object_size_mismatch");
    const mimeType = detectMime(bytes);
    const checksum = await sha256Hex(bytes);
    const declaredMime = object.metadata?.mimetype;
    const declaredMimeType = typeof declaredMime === "string" && declaredMime.length <= 255
      ? declaredMime
      : null;
    const signatureState = mimeType === "application/octet-stream"
      ? "UNRECOGNIZED_BINARY"
      : "SIGNATURE_IDENTIFIED";

    const { data: existing, error: existingError } = await admin
      .from("storage_files")
      .select("id,storage_path,owner_id,checksum")
      .eq("storage_path", path)
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) {
      if (existing.checksum && existing.checksum !== checksum) {
        return json({ error: "path_content_conflict" }, 409);
      }
      return json({
        ok: true,
        duplicate: true,
        content_id: "storage_files:" + existing.id,
        file: existing,
        checksum,
        detected_mime_type: mimeType,
        signature_state: signatureState,
        scan_state: "UNAVAILABLE",
        review_state: "PENDING_REVIEW",
      });
    }

    const { data: file, error: insertError } = await admin
      .from("storage_files")
      .insert({
        owner_id: userId,
        folder: userId,
        filename,
        storage_path: path,
        mime_type: mimeType,
        extension: filename.includes(".") ? filename.split(".").pop() : null,
        size_bytes: sizeBytes,
        checksum,
        visibility: "private",
      })
      .select("id,owner_id,folder,filename,storage_path,mime_type,extension,size_bytes,checksum,visibility,created_at")
      .single();
    if (insertError) throw insertError;

    const { error: eventError } = await admin.from("omega_platform_events").insert({
      // event_id is NOT NULL with no default live (20261002073936).
      event_id: crypto.randomUUID(),
      event_type: "evidence_recorded",
      route: "/content",
      actor_user_id: userId,
      metadata: {
        schema_version: "1",
        event_name: "content_asset_registered",
        content_id: "storage_files:" + file.id,
        storage_path: path,
        review_state: "PENDING_REVIEW",
        rights_state: "UNVERIFIED",
        publication_state: "UNVERIFIED",
        entitlement_state: "UNVERIFIED",
        scan_state: "UNAVAILABLE",
        size_bytes: sizeBytes,
        detected_mime_type: mimeType,
        declared_mime_type: declaredMimeType,
        signature_state: signatureState,
        sha256: checksum,
      },
    });

    if (eventError) {
      // Registration is not complete until its audit event exists. Compensate
      // both writes and the already-uploaded object; report partial rollback in
      // server logs without leaking provider/database errors to the caller.
      const rollback = await admin.from("storage_files").delete().eq("id", file.id).eq("owner_id", userId);
      const objectRollback = await storage.remove([path]);
      const rollbackState = !rollback.error && !objectRollback.error ? "complete" : "partial";
      console.error(JSON.stringify({
        event: "CONTENT_INGEST_ROLLBACK",
        content_id: "storage_files:" + file.id,
        path,
        rollback_state: rollbackState,
        metadata_rollback_failed: Boolean(rollback.error),
        object_rollback_failed: Boolean(objectRollback.error),
      }));
      return json({ error: "content_registration_failed", rollback_state: rollbackState }, 500);
    }

    return json({
      ok: true,
      duplicate: false,
      content_id: "storage_files:" + file.id,
      file,
      checksum,
      detected_mime_type: mimeType,
      signature_state: signatureState,
      scan_state: "UNAVAILABLE",
      review_state: "PENDING_REVIEW",
    }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "content_ingest_failed";
    // Supabase errors are plain objects, not Error instances: log their code so a
    // 500 names its cause server-side. Never returned to the caller.
    const detail = error as { code?: unknown; message?: unknown } | null;
    console.error(JSON.stringify({
      event: "CONTENT_INGEST_FAILED",
      code: typeof detail?.code === "string" ? detail.code : null,
      detail: typeof detail?.message === "string" ? detail.message.slice(0, 300) : null,
    }));
    const clientErrors = new Set([
      "invalid_filename",
      "unsupported_bucket",
      "invalid_path",
      "path_not_owned",
      "upload_too_large",
    ]);
    return json(
      { error: clientErrors.has(message) ? message : "content_ingest_failed" },
      clientErrors.has(message) ? (message === "path_not_owned" ? 403 : message === "upload_too_large" ? 413 : 400) : 500,
    );
  }
});
