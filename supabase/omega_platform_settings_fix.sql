-- Seasonal & Elemental Theming Feature Flag (Proposal #22)
-- Enables tier 3+ members to have their element affiliation synchronize with dynamic CSS tokens
-- Grounded in: omega-theme-elemental.js tier-gating, theme.js --page-accent/soft/glow tokens, nav.js dispatcher
-- Status: Default FALSE (dormant) until explicitly enabled by platform owner

INSERT INTO public.platform_settings (key, value, description)
VALUES ('elemental_theming_enabled', 'false', 'Enable seasonal/elemental theme cycling for tier 3+ members (phase-4 visual system)')
ON CONFLICT (key) DO NOTHING;
