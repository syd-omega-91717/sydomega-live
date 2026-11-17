// Shared, dependency-free file validation for Supabase Edge Functions.
// This identifies common file signatures and computes an integrity hash.
// It does NOT claim malware safety, provenance, ownership or publication rights.

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function assertUploadSize(size) {
  if (!Number.isSafeInteger(size) || size < 0) {
    throw new TypeError("invalid_upload_size");
  }
  if (size > MAX_UPLOAD_BYTES) {
    throw new RangeError("upload_too_large");
  }
  return size;
}

function ascii(bytes, offset, value) {
  if (bytes.length < offset + value.length) return false;
  for (let i = 0; i < value.length; i++) {
    if (bytes[offset + i] !== value.charCodeAt(i)) return false;
  }
  return true;
}

export function detectMime(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (bytes.length >= 5 && ascii(bytes, 0, "%PDF-")) return "application/pdf";
  if (bytes.length >= 8 &&
      bytes[0] === 0x89 && ascii(bytes, 1, "PNG\r\n\x1a\n")) return "image/png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (bytes.length >= 6 && (ascii(bytes, 0, "GIF87a") || ascii(bytes, 0, "GIF89a"))) {
    return "image/gif";
  }
  if (bytes.length >= 12 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WEBP")) {
    return "image/webp";
  }
  if (bytes.length >= 12 && ascii(bytes, 0, "RIFF") && ascii(bytes, 8, "WAVE")) {
    return "audio/wav";
  }
  if (bytes.length >= 4 && ascii(bytes, 0, "OggS")) return "application/ogg";
  if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 &&
      bytes[2] === 0xdf && bytes[3] === 0xa3) return "video/webm";
  if (bytes.length >= 8 && ascii(bytes, 4, "ftyp")) return "video/mp4";
  if (bytes.length >= 3 && ascii(bytes, 0, "ID3")) return "audio/mpeg";
  if (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
    return "audio/mpeg";
  }
  if (bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b &&
      bytes[2] === 0x03 && bytes[3] === 0x04) return "application/zip";
  return "application/octet-stream";
}

export async function sha256Hex(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (value) => value.toString(16).padStart(2, "0")).join("");
}
