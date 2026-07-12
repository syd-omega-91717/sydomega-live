// SYD OMEGA 91717 -- neutralized stub.
// This file previously caused browsers to download it (treated as an MPEG-TS
// video stream) instead of opening the site. It is intentionally inert now.
// The real protection is .vercelignore (this file is not deployed) + vercel.json
// (any .ts request is redirected to the site). If this ever loads in a browser,
// it simply bounces to the homepage and downloads nothing.
if (typeof window !== "undefined") { window.location.replace("/dashboard.html"); }
export {};
