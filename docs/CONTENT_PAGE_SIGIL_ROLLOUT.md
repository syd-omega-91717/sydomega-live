# Universal Content-Page Sigil Rollout

The global emblem integration now owns the page-entry layer for project and content pages.

## Contract

- Every eligible content page receives a compact sigil entry near its main header.
- The sigil links to the page's canonical URL and keeps the existing header, navigation, footer, authentication, and page-owned functionality intact.
- Long explanatory blocks are progressively disclosed through `MORE INFO +` / `LESS INFO −` controls only when they use an explicit supported selector or data attribute.
- System pages are excluded from automatic content-page decoration.
- The enhancement must fail soft: missing catalog entries or missing main content never block the page.

## Supported content selectors

`[data-omega-long-copy]`, `.page-description`, `.hero-subtitle`, `.hero-description`, `.lead`, `.intro`, `.intro-text`, `.section-description`, `.section-intro`, `[data-page-description]`, and `[data-explanatory-text]`.

For new pages, prefer explicit attributes over broad classes:

```html
<p data-explanatory-text>Long contextual explanation...</p>
```

This prevents business-critical data, forms, tables, and interactive controls from being hidden automatically.
