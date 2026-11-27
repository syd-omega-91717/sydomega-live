# Genesis Planet — first implementation slice

**Intent.** Turn the platform's 18 governed realms into a symbolic, explorable planet, using the existing omega-sculpture renderer rather than creating a second WebGL owner.

**Implemented in this change.**
- Deterministic sphere, cyan wireframe and restrained atmosphere.
- Nine latitude bands and twelve meridians as visual references to the platform's progression and gate structures.
- Up to 18 route-backed realm waypoints sourced from OmegaWorldEngine.modules; each waypoint opens its real module route.
- The primary World page now mounts this planet. Its waypoint colours consume the route verifier's LIVE / CHECKING / UNAVAILABLE state; LIVE means route reachability only, not feature completeness.
- Slow orbital rotation, cursor-responsive camera, reduced-motion still pose, and the existing renderer's shared context/fallback lifecycle.
- No external textures, invented member state, financial claims, or physical-world claims.

**Verification boundary.** Static regression tests are added. Static regression coverage includes route-state publication and visual binding. Real-GPU frame-time, phone rendering, accessibility review, and deployed browser interaction remain pending until the PR preview can be inspected on physical hardware.
