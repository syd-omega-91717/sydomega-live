# Member-state scanner: executable HTML script scope

**Date:** 2026-11-28

## Problem
The inventory scanner previously ran JavaScript string/comment masking over the entire HTML document. Apostrophes in ordinary page copy and quotes in HTML attributes could therefore hide executable script declarations from the scanner. This left literal keys such as `ATLAS_KEY`, `ENC_KEY`, `LOG_KEY`, `Q_KEY`, `SHELF_KEY`, and `WR_KEY` incorrectly unresolved.

## Change
- HTML files are now scanned through executable inline `script` blocks and quoted `on*` event-handler attributes.
- JSON/data script blocks and ordinary page prose/attributes are excluded from JavaScript scanning.
- Constants are resolved per script block, avoiding cross-module constant leakage.
- JavaScript and MJS source files continue to be scanned as complete source units.
- Source line references are preserved relative to the original HTML file.

## Limits
This remains a static lexical scanner, not a browser parser or complete JavaScript AST/data-flow analysis. It does not infer arbitrary aliases, dynamically computed keys, storage APIs other than direct localStorage calls, or whether a key exists in a real browser or cloud table. Dynamic function arguments remain unresolved by design.
