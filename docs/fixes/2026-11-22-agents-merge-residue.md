# Agents page merge-residue repair — 2026-11-22

## Finding

The production page contained duplicate hierarchy tab navigation, duplicate `tab-hierarchy` panel IDs and two `renderHierarchy` declarations, one of which was incomplete. The hierarchy-specific CSS was also embedded inside the synchronized Omega Morph block. Replacing the Morph block with its canonical version removed that page-specific styling.

## Repair

- Removed the duplicate legacy tab navigation and retained the single ARIA tab list.
- Removed the duplicate hierarchy panel and incomplete renderer; retained the single asynchronous renderer.
- Restored hierarchy-specific CSS to the page's own stylesheet, outside the shared Morph block.
- Raised hierarchy metadata text to the 12px minimum interface type scale.
- Kept the shared Omega Morph block byte-for-byte identical to the canonical block.

## Verification

The production contract, page contract, visual page survey, Morph synchronization test and headless capability-evidence workflow passed after the repair. The hierarchy panel has one unique ID and one renderer.
