# Agent Network — 3D Primary Constellation

**Implementation:** PR # pending · 2026-11-28

## Experience
- Adds the existing centralized Three.js `agents` scene above the current two-dimensional roster map.
- Twelve canonical identities orbit the Omega core with the platform's gold/cyan material language.
- The shared sculpture renderer is injected only because this page now has one declarative mount; no competing WebGL context or new renderer is introduced.
- Node navigation uses the existing governed agent directory route. The two-dimensional canvas and its click-to-inspect panel remain available below.

## Truth and governance
- The visual is a canonical roster composition, not agent execution telemetry.
- Orbital lines do not assert live dependencies, tool permissions, execution status, or autonomous relationships.
- The page's existing roster loader still validates `omega-agents.json` before rendering its 2D roster.
- Operational history and governed reads remain in the separate Agent Operations surface.

## Accessibility and performance
- The centralized sculpture runtime retains its reduced-motion handling, visibility-based rendering, shared WebGL context, and non-WebGL fallback.
- The 2D map remains the lightweight alternative.
- No additional JavaScript animation loop or WebGL context is added by this page.

## Verification boundary
Static contract tests pin the mount, the 2D fallback, the reality label, and the single-renderer ownership boundary. CI visual survey and a physical-device/GPU review are still required for production visual sign-off.
