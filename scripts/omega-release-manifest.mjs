#!/usr/bin/env node
/**
 * Emit or verify a public, non-secret release provenance marker.
 * Production promotion validates this exact commit marker before and after deploy.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const mode = process.argv[2] || "--write";
const outputPath = resolve(process.argv[3] || "public/.well-known/omega-release.json");
const expectedSha = (
  process.env.OMEGA_RELEASE_SHA ||
  process.env.GITHUB_SHA ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.CF_PAGES_COMMIT_SHA ||
  ""
).toLowerCase();
const shaPattern = /^[0-9a-f]{40}$/;
const sourceSha = expectedSha || "unknown";
const sourceRef =
  process.env.GITHUB_REF_NAME ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.CF_PAGES_BRANCH ||
  "unknown";
const source =
  process.env.OMEGA_RELEASE_SHA || process.env.GITHUB_SHA
    ? "github-actions"
    : process.env.VERCEL_GIT_COMMIT_SHA
      ? "vercel-git"
      : process.env.CF_PAGES_COMMIT_SHA
        ? "cloudflare-pages-git"
        : "local";

function fail(message) {
  console.error("OMEGA_RELEASE_MANIFEST=FAIL " + message);
  process.exit(1);
}

if (mode === "--write") {
  if (sourceSha !== "unknown" && !shaPattern.test(sourceSha)) {
    fail("invalid_source_commit_sha");
  }
  const manifest = {
    schema_version: 1,
    project: "SYD OMEGA 91717",
    commit_sha: sourceSha,
    ref: sourceRef,
    source,
  };
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log("OMEGA_RELEASE_MANIFEST=WRITTEN path=" + outputPath + " sha=" + sourceSha);
  process.exit(0);
}

if (mode === "--check") {
  if (!shaPattern.test(expectedSha)) {
    fail("expected_commit_sha_missing_or_invalid");
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(outputPath, "utf8"));
  } catch {
    fail("manifest_missing_or_invalid_json");
  }
  if (manifest.schema_version !== 1 || manifest.project !== "SYD OMEGA 91717") {
    fail("manifest_schema_or_project_mismatch");
  }
  if (manifest.commit_sha !== expectedSha) {
    fail("commit_mismatch expected=" + expectedSha + " actual=" + String(manifest.commit_sha));
  }
  console.log("OMEGA_RELEASE_MANIFEST=PASS sha=" + expectedSha);
  process.exit(0);
}

fail("usage=--write [path] | --check [path]");
