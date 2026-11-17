import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { assertUploadSize, detectMime, MAX_UPLOAD_BYTES, sha256Hex } from "../../supabase/functions/_shared/content-validation.mjs";

globalThis.crypto ??= webcrypto;

const bytes = (...values) => new Uint8Array(values);
const ascii = (value) => new TextEncoder().encode(value);

test("server size ceiling matches 50 MiB", () => {
  assert.equal(MAX_UPLOAD_BYTES, 50 * 1024 * 1024);
  assert.equal(assertUploadSize(MAX_UPLOAD_BYTES), MAX_UPLOAD_BYTES);
  assert.throws(() => assertUploadSize(MAX_UPLOAD_BYTES + 1), /upload_too_large/);
  assert.throws(() => assertUploadSize(-1), /invalid_upload_size/);
});

test("detects supported signatures rather than trusting MIME metadata", () => {
  assert.equal(detectMime(ascii("%PDF-1.7")), "application/pdf");
  assert.equal(detectMime(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), "image/png");
  assert.equal(detectMime(bytes(0xff, 0xd8, 0xff, 0x00)), "image/jpeg");
  assert.equal(detectMime(ascii("GIF89a")), "image/gif");
  assert.equal(detectMime(ascii("RIFF0000WEBP")), "image/webp");
  assert.equal(detectMime(ascii("RIFF0000WAVE")), "audio/wav");
  assert.equal(detectMime(ascii("OggS0000")), "application/ogg");
  assert.equal(detectMime(bytes(0x1a, 0x45, 0xdf, 0xa3)), "video/webm");
  assert.equal(detectMime(ascii("0000ftypisom")), "video/mp4");
  assert.equal(detectMime(ascii("ID3")), "audio/mpeg");
  assert.equal(detectMime(ascii("PK\x03\x04")), "application/zip");
  assert.equal(detectMime(ascii("<svg>")), "text/plain");
  assert.equal(detectMime(ascii("plain text\n")), "text/plain");
  assert.equal(detectMime(bytes(0x00, 0xff, 0x81)), "application/octet-stream");
});

test("computes a stable SHA-256 digest", async () => {
  assert.equal(
    await sha256Hex(ascii("abc")),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
});
