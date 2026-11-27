# 3D Sovereign Podium

The leaderboard's existing ranking authority remains the source of truth. This scene only visualizes the same three rows passed to the existing 2D podium.

- Supports the rankings Edge Function, daily leaderboard snapshot, and public leaderboard RPC fallback.
- Renders only rows returned by the selected authority; missing ranks remain explicitly unfilled.
- Displays the source label so users can distinguish a server ranking response, daily snapshot, and public RPC fallback.
- Uses procedural Three.js geometry and canvas text textures; no external imagery or fabricated members.
- Uses restrained continuous rotation and lift, with reduced-motion support.
- Existing 2D podium remains as a readable fallback and accessible summary.

Real-device GPU, mobile layout, and browser interaction review remain required before production promotion.
