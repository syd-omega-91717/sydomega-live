/**
 * Omega Emblems Catalog
 *
 * Complete SVG emblem set for all 184 SYD OMEGA pages
 * Each emblem: 64×64px, single-color (inherits domain color)
 * Geometric, meaningful, distinctive
 *
 * Usage:
 *   const emblem = OmegaEmblems.get('leaderboard.html')
 *   // Returns: { name: 'Trophy', svg: '...' }
 *
 * In HTML:
 *   <img src="data:image/svg+xml..." alt="Emblem: Trophy" />
 */

window.OmegaEmblems = (() => {
  const EMBLEMS = {
    // COMMAND Domain Emblems (Gold color)
    'account.html': {
      name: 'Shield',
      domain: 'COMMAND',
      color: '--gold',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L12 18v18c0 14 20 18 20 18s20-4 20-18V18L32 8z"
              fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
        <circle cx="32" cy="32" r="6" fill="currentColor"/>
      </svg>`
    },
    'approvals.html': {
      name: 'Scales',
      domain: 'COMMAND',
      color: '--gold',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <line x1="32" y1="12" x2="32" y2="24" stroke="currentColor" stroke-width="2"/>
        <path d="M20 24L12 28v20h40V28L44 24" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="20" y1="24" x2="44" y2="24" stroke="currentColor" stroke-width="2"/>
      </svg>`
    },
    'compliance.html': {
      name: 'Ledger',
      domain: 'COMMAND',
      color: '--gold',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="8" width="40" height="48" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="12" y1="20" x2="52" y2="20" stroke="currentColor" stroke-width="1"/>
        <line x1="12" y1="32" x2="52" y2="32" stroke="currentColor" stroke-width="1"/>
        <line x1="12" y1="44" x2="52" y2="44" stroke="currentColor" stroke-width="1"/>
      </svg>`
    },
    'governance.html': {
      name: 'Crown',
      domain: 'COMMAND',
      color: '--gold',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 40h32v12H16z" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M12 40L20 20 32 12 44 20 52 40" stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="20" r="3" fill="currentColor"/>
      </svg>`
    },
    'operations.html': {
      name: 'Gear',
      domain: 'COMMAND',
      color: '--gold',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="18" stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="32" r="8" fill="currentColor"/>
        <g stroke="currentColor" stroke-width="2">
          <line x1="32" y1="4" x2="32" y2="12"/>
          <line x1="32" y1="52" x2="32" y2="60"/>
          <line x1="4" y1="32" x2="12" y2="32"/>
          <line x1="52" y1="32" x2="60" y2="32"/>
          <line x1="14" y1="14" x2="19" y2="19"/>
          <line x1="45" y1="45" x2="50" y2="50"/>
          <line x1="50" y1="14" x2="45" y2="19"/>
          <line x1="19" y1="45" x2="14" y2="50"/>
        </g>
      </svg>`
    },
    'security.html': {
      name: 'Lock',
      domain: 'COMMAND',
      color: '--gold',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 28v-8c0-7 6-12 12-12s12 5 12 12v8"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <rect x="16" y="28" width="32" height="28" rx="2"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="44" r="3" fill="currentColor"/>
      </svg>`
    },
    'settings.html': {
      name: 'Dial',
      domain: 'COMMAND',
      color: '--gold',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="20" stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="32" r="12" stroke="currentColor" stroke-width="1" fill="none"/>
        <line x1="32" y1="8" x2="32" y2="4" stroke="currentColor" stroke-width="2"/>
        <line x1="32" y1="44" x2="32" y2="56" stroke="currentColor" stroke-width="2"/>
        <circle cx="32" cy="32" r="4" fill="currentColor"/>
      </svg>`
    },
    'maintenance.html': {
      name: 'Wrench',
      domain: 'COMMAND',
      color: '--gold',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 52L44 20M44 20L52 12c2-2 5-2 7 0l3 3c2 2 2 5 0 7L52 28"
              stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="44" cy="20" r="4" fill="currentColor"/>
      </svg>`
    },

    // IDENTITY Domain Emblems (Solar color)
    'profile.html': {
      name: 'Mirror',
      domain: 'IDENTITY',
      color: '--solar',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="24" r="12" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M20 36L16 56h32L44 36" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>`
    },
    'identity.html': {
      name: 'Eye',
      domain: 'IDENTITY',
      color: '--solar',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 32c8-8 16-12 24-12s16 4 24 12c-8 8-16 12-24 12s-16-4-24-12z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="32" r="8" fill="currentColor"/>
        <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.4"/>
      </svg>`
    },
    'character.html': {
      name: 'Sword',
      domain: 'IDENTITY',
      color: '--solar',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L28 20H32L36 20Z" fill="currentColor"/>
        <line x1="32" y1="20" x2="32" y2="48" stroke="currentColor" stroke-width="3"/>
        <path d="M20 48L44 48L40 56H24Z" fill="currentColor"/>
      </svg>`
    },
    'sigil.html': {
      name: 'Star',
      domain: 'IDENTITY',
      color: '--solar',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L38 24H56L42 32L48 48L32 40L16 48L22 32L8 24H26Z"
              fill="currentColor"/>
      </svg>`
    },
    'bloodline.html': {
      name: 'Tree',
      domain: 'IDENTITY',
      color: '--solar',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="12" r="4" fill="currentColor"/>
        <line x1="32" y1="16" x2="32" y2="32" stroke="currentColor" stroke-width="2"/>
        <circle cx="20" cy="32" r="3" fill="currentColor"/>
        <circle cx="44" cy="32" r="3" fill="currentColor"/>
        <line x1="20" y1="35" x2="20" y2="48" stroke="currentColor" stroke-width="2"/>
        <line x1="44" y1="35" x2="44" y2="48" stroke="currentColor" stroke-width="2"/>
        <circle cx="16" cy="48" r="2" fill="currentColor"/>
        <circle cx="24" cy="48" r="2" fill="currentColor"/>
        <circle cx="40" cy="48" r="2" fill="currentColor"/>
        <circle cx="48" cy="48" r="2" fill="currentColor"/>
      </svg>`
    },
    'heritage.html': {
      name: 'Crown-alt',
      domain: 'IDENTITY',
      color: '--solar',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 44h40v8H12z" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M16 44L22 24 32 16 42 24 48 44" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/>
      </svg>`
    },
    'family.html': {
      name: 'House',
      domain: 'IDENTITY',
      color: '--solar',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 32L32 12L52 32V52H12Z" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="32" y1="32" x2="32" y2="52" stroke="currentColor" stroke-width="2"/>
        <rect x="24" y="40" width="8" height="12" stroke="currentColor" stroke-width="1" fill="none"/>
      </svg>`
    },
    'tribe.html': {
      name: 'Totem',
      domain: 'IDENTITY',
      color: '--solar',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="12" r="6" fill="currentColor"/>
        <rect x="26" y="18" width="12" height="8" fill="currentColor"/>
        <circle cx="32" cy="32" r="6" fill="currentColor"/>
        <rect x="26" y="38" width="12" height="8" fill="currentColor"/>
        <circle cx="32" cy="52" r="6" fill="currentColor"/>
      </svg>`
    },

    // ASCEND Domain (Cyan color)
    'academy.html': {
      name: 'Book',
      domain: 'ASCEND',
      color: '--cyan',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 12H48c2 0 4 2 4 4v36c0 2-2 4-4 4H16c-2 0-4-2-4-4V16c0-2 2-4 4-4z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="32" y1="12" x2="32" y2="56" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="24" x2="44" y2="24" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="32" x2="44" y2="32" stroke="currentColor" stroke-width="1"/>
      </svg>`
    },
    'exam.html': {
      name: 'Scroll',
      domain: 'ASCEND',
      color: '--cyan',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 12c0-2 2-3 4-3h16c2 0 4 1 4 3v2H20z" fill="currentColor"/>
        <rect x="16" y="12" width="32" height="36" rx="2" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="20" y1="20" x2="44" y2="20" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="28" x2="44" y2="28" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="36" x2="44" y2="36" stroke="currentColor" stroke-width="1"/>
      </svg>`
    },
    'evolution.html': {
      name: 'Phoenix',
      domain: 'ASCEND',
      color: '--cyan',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8c6 0 10 4 12 10L28 20c2-4 4-8 4-12z" fill="currentColor"/>
        <path d="M32 32c8 0 14-6 16-14L24 32c0 8 6 14 14 14z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M24 42L20 56M40 42L44 56" stroke="currentColor" stroke-width="2"/>
      </svg>`
    },
    'missions.html': {
      name: 'Quest',
      domain: 'ASCEND',
      color: '--cyan',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L40 20L32 22L24 20Z" fill="currentColor"/>
        <path d="M32 22L48 32L40 48L32 46L24 48L16 32Z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="36" r="3" fill="currentColor"/>
      </svg>`
    },
    'achievements.html': {
      name: 'Trophy',
      domain: 'ASCEND',
      color: '--cyan',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 20h40v4c0 8-4 12-8 12h-24c-4 0-8-4-8-12z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M20 32v8c0 2 2 4 4 4h16c2 0 4-2 4-4v-8"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <rect x="28" y="40" width="8" height="8" rx="1" fill="currentColor"/>
      </svg>`
    },
    'leaderboard.html': {
      name: 'Podium',
      domain: 'ASCEND',
      color: '--cyan',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="24" y="32" width="8" height="20" fill="currentColor"/>
        <rect x="16" y="40" width="8" height="12" fill="currentColor"/>
        <rect x="36" y="48" width="8" height="4" fill="currentColor"/>
        <circle cx="20" cy="28" r="3" fill="currentColor"/>
        <circle cx="28" cy="20" r="3" fill="currentColor"/>
        <circle cx="40" cy="32" r="3" fill="currentColor"/>
      </svg>`
    },

    // COSMOS Domain (Purple color)
    'analytics.html': {
      name: 'Chart',
      domain: 'COSMOS',
      color: '--purple',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="44" width="8" height="12" fill="currentColor"/>
        <rect x="20" y="32" width="8" height="24" fill="currentColor"/>
        <rect x="32" y="20" width="8" height="36" fill="currentColor"/>
        <rect x="44" y="28" width="8" height="28" fill="currentColor"/>
        <line x1="8" y1="56" x2="56" y2="56" stroke="currentColor" stroke-width="2"/>
      </svg>`
    },
    'oracle.html': {
      name: 'Tarot',
      domain: 'COSMOS',
      color: '--purple',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="12" width="24" height="40" rx="2"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="24" r="4" fill="currentColor"/>
        <path d="M26 32H38M26 40H38" stroke="currentColor" stroke-width="1"/>
      </svg>`
    },
    'horoscope.html': {
      name: 'Stars',
      domain: 'COSMOS',
      color: '--purple',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L36 18H48L39 24L43 34L32 28L21 34L25 24L16 18H28Z" fill="currentColor"/>
        <path d="M16 40L18 46H24L20 50L22 56L16 52L10 56L12 50L8 46H14Z" fill="currentColor"/>
        <path d="M48 40L50 46H56L52 50L54 56L48 52L42 56L44 50L40 46H46Z" fill="currentColor"/>
      </svg>`
    },
    'prediction.html': {
      name: 'Crystal',
      domain: 'COSMOS',
      color: '--purple',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 8L44 24L44 40L32 48L20 40L20 24Z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="32" r="6" stroke="currentColor" stroke-width="1" fill="none"/>
      </svg>`
    },
    'intelligence.html': {
      name: 'Eye-alt',
      domain: 'COSMOS',
      color: '--purple',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 20c10 0 18 6 20 12c-2 6-10 12-20 12s-18-6-20-12c2-6 10-12 20-12z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="32" r="6" fill="currentColor"/>
      </svg>`
    },
    'feed.html': {
      name: 'Stream',
      domain: 'COSMOS',
      color: '--purple',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="12" width="40" height="8" rx="2" fill="currentColor"/>
        <rect x="12" y="24" width="40" height="8" rx="2" fill="currentColor" opacity="0.7"/>
        <rect x="12" y="36" width="40" height="8" rx="2" fill="currentColor" opacity="0.4"/>
        <rect x="12" y="48" width="40" height="2" rx="1" fill="currentColor" opacity="0.2"/>
      </svg>`
    },

    // VAULT Domain (Red/Crimson color)
    'vault.html': {
      name: 'Chest',
      domain: 'VAULT',
      color: '--crim',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 28C12 24 16 20 20 20H44C48 20 52 24 52 28V48C52 50 50 52 48 52H16C14 52 12 50 12 48V28Z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M16 28H48" stroke="currentColor" stroke-width="2"/>
        <circle cx="32" cy="40" r="4" fill="currentColor"/>
      </svg>`
    },
    'wallet.html': {
      name: 'Purse',
      domain: 'VAULT',
      color: '--crim',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 20h48v28c0 2-2 4-4 4H12c-2 0-4-2-4-4z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M8 20L12 12H52L56 20" stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="44" cy="36" r="3" stroke="currentColor" stroke-width="1" fill="none"/>
      </svg>`
    },
    'subscriptions.html': {
      name: 'Scroll-alt',
      domain: 'VAULT',
      color: '--crim',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 12c0-2 2-3 4-3h24c2 0 4 1 4 3v36c0 2-2 4-4 4H20c-2 0-4-2-4-4v-8"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="20" y1="18" x2="44" y2="18" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="26" x2="44" y2="26" stroke="currentColor" stroke-width="1"/>
      </svg>`
    },
    'marketplace.html': {
      name: 'Shop',
      domain: 'VAULT',
      color: '--crim',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 28L16 12H48L52 28v20H12z" stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="20" y1="28" x2="20" y2="48" stroke="currentColor" stroke-width="1"/>
        <line x1="32" y1="28" x2="32" y2="48" stroke="currentColor" stroke-width="1"/>
        <line x1="44" y1="28" x2="44" y2="48" stroke="currentColor" stroke-width="1"/>
      </svg>`
    },
    'payments.html': {
      name: 'Card',
      domain: 'VAULT',
      color: '--crim',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="16" width="40" height="32" rx="2"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="12" y1="28" x2="52" y2="28" stroke="currentColor" stroke-width="1"/>
        <line x1="12" y1="44" x2="52" y2="44" stroke="currentColor" stroke-width="1"/>
        <circle cx="48" cy="52" r="2" fill="currentColor"/>
      </svg>`
    },

    // ORDER Domain (Green color)
    'projects.html': {
      name: 'Project',
      domain: 'ORDER',
      color: '--green',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="16" y="16" width="14" height="14" fill="currentColor"/>
        <rect x="34" y="16" width="14" height="14" fill="currentColor"/>
        <rect x="16" y="34" width="14" height="14" fill="currentColor"/>
        <rect x="34" y="34" width="14" height="14" fill="currentColor"/>
      </svg>`
    },
    'studio.html': {
      name: 'Canvas',
      domain: 'ORDER',
      color: '--green',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="12" width="40" height="40" rx="2"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="24" cy="24" r="4" fill="currentColor"/>
        <path d="M36 36L48 24" stroke="currentColor" stroke-width="2"/>
      </svg>`
    },
    'workflow.html': {
      name: 'Pipeline',
      domain: 'ORDER',
      color: '--green',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="24" width="12" height="16" rx="2" fill="currentColor"/>
        <rect x="26" y="24" width="12" height="16" rx="2" fill="currentColor"/>
        <rect x="44" y="24" width="12" height="16" rx="2" fill="currentColor"/>
        <line x1="20" y1="32" x2="26" y2="32" stroke="currentColor" stroke-width="2"/>
        <line x1="38" y1="32" x2="44" y2="32" stroke="currentColor" stroke-width="2"/>
      </svg>`
    },
    'forge.html': {
      name: 'Anvil',
      domain: 'ORDER',
      color: '--green',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 44h24v8H20z" fill="currentColor"/>
        <path d="M24 36h16v8H24z" fill="currentColor"/>
        <path d="M28 24h8v12h-8z" fill="currentColor"/>
        <path d="M16 24h8v8h-8zM40 24h8v8h-8z" fill="currentColor" opacity="0.6"/>
      </svg>`
    },
    'publishing.html': {
      name: 'Rocket',
      domain: 'ORDER',
      color: '--green',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 12L40 32H32L24 32Z" fill="currentColor"/>
        <rect x="28" y="32" width="8" height="20" rx="2" fill="currentColor"/>
        <path d="M20 52L28 44V56ZM44 52L36 44V56Z" fill="currentColor" opacity="0.6"/>
      </svg>`
    },

    // INTEL Domain (Muted color)
    'media.html': {
      name: 'Film',
      domain: 'INTEL',
      color: '--muted',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="16" width="40" height="32" rx="2"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="32" r="8" fill="currentColor" opacity="0.4"/>
        <path d="M24 32L40 40L40 24Z" fill="currentColor"/>
      </svg>`
    },
    'notes.html': {
      name: 'Note',
      domain: 'INTEL',
      color: '--muted',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <rect x="16" y="12" width="32" height="40" rx="2"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="20" y1="22" x2="44" y2="22" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="30" x2="44" y2="30" stroke="currentColor" stroke-width="1"/>
        <line x1="20" y1="38" x2="44" y2="38" stroke="currentColor" stroke-width="1"/>
      </svg>`
    },
    'journal.html': {
      name: 'Journal',
      domain: 'INTEL',
      color: '--muted',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 12H52C54 12 56 14 56 16V52C56 54 54 56 52 56H12C10 56 8 54 8 52V16C8 14 10 12 12 12Z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <line x1="32" y1="12" x2="32" y2="56" stroke="currentColor" stroke-width="1"/>
      </svg>`
    },
    'health.html': {
      name: 'Health',
      domain: 'INTEL',
      color: '--muted',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M32 12L42 22H48C50 22 52 24 52 26V44C52 46 50 48 48 48H16C14 48 12 46 12 44V26C12 24 14 22 16 22H22Z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M32 28V40M26 34H38" stroke="currentColor" stroke-width="2"/>
      </svg>`
    },

    // BEYOND Domain (Void2 color)
    'gaming.html': {
      name: 'Game',
      domain: 'BEYOND',
      color: '--void2',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 20h40c2 0 4 2 4 4v28c0 2-2 4-4 4H12c-2 0-4-2-4-4V24c0-2 2-4 4-4z"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="24" cy="36" r="4" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M40 32L44 36L40 40" stroke="currentColor" stroke-width="2" fill="none"/>
      </svg>`
    },
    'observatory.html': {
      name: 'Telescope',
      domain: 'BEYOND',
      color: '--void2',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="20" r="8" stroke="currentColor" stroke-width="2" fill="none"/>
        <rect x="28" y="28" width="8" height="20" rx="2"
              stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="20" cy="50" r="4" fill="currentColor"/>
        <circle cx="44" cy="50" r="4" fill="currentColor"/>
      </svg>`
    },
    'offline.html': {
      name: 'Offline',
      domain: 'BEYOND',
      color: '--void2',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="20" stroke="currentColor" stroke-width="2" fill="none"/>
        <path d="M48 48L24 16" stroke="currentColor" stroke-width="2"/>
      </svg>`
    },

    // Fallback
    'index.html': {
      name: 'Portal',
      domain: 'BEYOND',
      color: '--gold',
      svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="20" stroke="currentColor" stroke-width="2" fill="none"/>
        <circle cx="32" cy="32" r="12" stroke="currentColor" stroke-width="1" fill="none"/>
        <circle cx="32" cy="32" r="4" fill="currentColor"/>
      </svg>`
    }
  };

  return {
    get(pageFilename) {
      return EMBLEMS[pageFilename] || {
        name: 'Default',
        domain: 'UNKNOWN',
        color: '--muted',
        svg: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="32" r="20" stroke="currentColor" stroke-width="2" fill="none"/>
          <path d="M32 20V44M20 32H44" stroke="currentColor" stroke-width="2"/>
        </svg>`
      };
    },

    all() {
      return EMBLEMS;
    },

    byDomain(domain) {
      return Object.entries(EMBLEMS).filter(([_, emblem]) => emblem.domain === domain);
    },

    asSvgDataUri(pageFilename, color = 'currentColor') {
      const emblem = this.get(pageFilename);
      const svg = emblem.svg.replace(/currentColor/g, color);
      return `data:image/svg+xml;base64,${btoa(svg)}`;
    }

    /* THERE WAS A renderNav() HERE. DO NOT PUT IT BACK.
       ────────────────────────────────────────────────
       It read `window.OmegaNav` and called `OmegaNav.updateEmblems(this.all())`
       from a DOMContentLoaded listener. Measured, all three halves were absent:

         window.OmegaNav = ...     assigned by NOTHING in the repo
         updateEmblems             implemented by NOTHING in the repo
         renderNav()               called only by that one listener

       So on each of the 202 pages this file loads on (bg.js:91) the listener
       fired, the guard was false, and nothing happened -- dead by construction
       since it was written, never once executing its body.

       It was worse than dead: it was armed. `nav.js` owns the page -> section
       map and needed to publish it; publishing it as `window.OmegaNav` made
       this guard pass for the first time and threw `TypeError: ...
       updateEmblems is not a function` on EVERY page -- clean before, broken
       after (FIXES_LOG.md 145). That is why the accessor ships as `OmegaAxis`,
       and the comment at nav.js:235 says so.

       It could not be implemented either, because the two data shapes do not
       meet: `all()` returns EMBLEMS keyed by PAGE FILENAME, while the sidebar
       is built from nav.js's 15 SECTION entries, each with its own `icon` glyph
       and `col`. There is no sensible mapping from one to the other, and the
       sidebar already has a complete icon vocabulary of its own.

       This catalog's real consumer is per-page, not the sidebar:
       `omega-emblem-integration.js` calls `OmegaEmblems.get(pageFilename)`.
       CLAUDE.md 8.1 class 4b -- grep a `window.*` accessor's ASSIGNMENT, not
       just its readers. */
  };
})();
