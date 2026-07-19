/* ============================================================================
   SYD OMEGA 91717 -- GEOMETRIC SYSTEM

   WHY THIS EXISTS
   Measured across all 56 real pages:

     gap                34 distinct values
     padding            54 distinct values
     grid minmax        20 distinct column widths
     border-radius       9 values -- but 96 of 107 uses are 2px

   Border-radius was already 91% consistent. Spacing was not: 54 different
   padding values means no two sections share a rhythm, which is what makes a
   layout read as "not organised" even when every individual page looks fine.

   WHAT THIS DOES
   Publishes one modular scale as CSS custom properties, plus a small set of
   composition utilities built on it. Purely ADDITIVE -- no existing rule is
   changed or removed, so nothing can regress. New and edited sections use the
   scale; the platform converges instead of being rewritten in one risky pass.

   THE SCALE
   A 4px base with a 1.5x-ish progression, chosen to absorb the values already
   most used (8, 10, 12, 14, 16, 20, 24) rather than inventing a fresh system
   the existing pages would fight:

     --o-1  4px     hairline separation
     --o-2  8px     inside small controls
     --o-3  12px    default gap between siblings
     --o-4  16px    inside cards
     --o-5  24px    between sections
     --o-6  32px    between major bands
     --o-7  48px    page-level rhythm

   COLUMN WIDTHS
   Four canonical track widths replace twenty ad-hoc ones. Each is a minmax()
   floor for auto-fill grids, so pages reflow on the same breakpoints instead
   of each choosing its own.
   ============================================================================ */
(function () {
  'use strict';
  if (window.__omegaGeometry) return;
  window.__omegaGeometry = 1;

  var css = [
    ':root{',
      '--o-1:4px;--o-2:8px;--o-3:12px;--o-4:16px;--o-5:24px;--o-6:32px;--o-7:48px;',
      /* canonical grid track floors */
      '--o-col-xs:140px;--o-col-sm:180px;--o-col-md:220px;--o-col-lg:280px;',
      /* the radius already used by 96 of 107 rules */
      '--o-radius:2px;',
      /* page gutter, fluid but bounded */
      '--o-gutter:clamp(14px,3vw,36px);',
    '}',

    /* --- composition utilities ------------------------------------------- */
    /* auto-fill grids on the four canonical widths */
    '.o-grid{display:grid;gap:var(--o-3)}',
    '.o-grid-xs{grid-template-columns:repeat(auto-fill,minmax(var(--o-col-xs),1fr))}',
    '.o-grid-sm{grid-template-columns:repeat(auto-fill,minmax(var(--o-col-sm),1fr))}',
    '.o-grid-md{grid-template-columns:repeat(auto-fill,minmax(var(--o-col-md),1fr))}',
    '.o-grid-lg{grid-template-columns:repeat(auto-fill,minmax(var(--o-col-lg),1fr))}',

    /* vertical rhythm: consistent space between stacked children */
    '.o-stack>*+*{margin-top:var(--o-3)}',
    '.o-stack-lg>*+*{margin-top:var(--o-5)}',

    /* a section band: gutter + rhythm, the unit most pages hand-roll */
    '.o-band{padding:var(--o-5) var(--o-gutter)}',
    '.o-band+.o-band{padding-top:0}',

    /* card interior spacing on the scale */
    '.o-card{padding:var(--o-4);border-radius:var(--o-radius)}',
    '.o-card-lg{padding:var(--o-5);border-radius:var(--o-radius)}',

    /* --- responsive: collapse the scale rather than each page guessing --- */
    '@media(max-width:760px){',
      ':root{--o-5:16px;--o-6:24px;--o-7:32px;--o-gutter:14px}',
      '.o-grid{gap:var(--o-2)}',
    '}'
  ].join('');

  var st = document.createElement('style');
  st.id = 'omega-geometry';
  st.textContent = css;
  (document.head || document.documentElement).appendChild(st);
})();
