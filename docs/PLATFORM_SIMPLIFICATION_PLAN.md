# Platform simplification plan (2026-11-05)

Goal: fewer places to go, less text, easier to surf. This is a plan with measurements, not a change.
Nothing here deletes a page. Approve a target in section 3 and it is done in reversible steps.

## 1. What is measured

| | now |
|---|---|
| HTML pages | 236 (224 in the nav, 12 not) |
| Sidebar | 15 sections, 249 entries: 107 visible, 142 folded into search |
| Pages offered under two sections | 6 (`income`, `payments`, `ledger`, `subscriptions` under VAULT and INVEST; `life`; `horoscope`) |
| Visible words | 78,504 across all pages, median page 280 |
| Exact on-page repeats left | about 971 words sitewide (after #1164) |

Two findings that change the plan:

- **Pages are modules, not duplicates.** `omega-single-page-workspaces.js` already opens 15 hub pages as workspaces
  and loads their sub-pages (`character`, `kyc`, `wallet`, `heritage` ...) as embedded modules. Deleting a standalone
  page breaks the hub that embeds it. "Fewer pages" means inlining content, not removing files.
- **The overlap is between hubs.** The same pages are offered by VAULT and INVEST, and the identity documents
  (`character`, `identity`, `passport`, `kyc`, `credentials`, `heritage`, `bloodline`, `membership`) appear under
  PROFILE, ARCHIVE and ORDER.

## 2. What usage data says, and does not

Vercel Analytics, Oct 5 to 19 only (production moved to Cloudflare on 2026-10-18; nothing is recorded since):
about 500 page views, 3 to 9 visitors a day. Most-opened: `dashboard` (45 visitors), `account`, `gateway` (13 each),
`cosmos`, `gaming` (9), `profile`, `vault`, `honors`, `matrix`, `media`, `academy`. About 170 of the 236 pages had no
view at all.

That is enough to say which pages members open first. It is **not** enough to delete a page: two weeks, a handful of
people, and the owner's own testing mixed in (one visitor made 149 views of `/pending`). The evidence class in
`EVIDENCE_MATRIX.md` is also the wrong lever: it marks `guide`, `world`, `missions` and `leaderboard` STATIC
(they persist nothing), and they are core navigation.

**Gap:** there is no usage data now. Turning on Cloudflare Web Analytics for the `sydomega` Pages project fixes it
and costs nothing in the code.

## 3. Proposed structure (needs the owner's yes)

15 sections to 8. Navigation only; every page keeps its URL.

| New section | Merges | Why |
|---|---|---|
| COMMAND | command | unchanged: the way in |
| ME | identity, archive, life | one place for who you are, your documents and your daily life |
| GROW | ascend, achieve, arena | learning, levels, games |
| WORLD | cosmos, media | the lore and the creative universe |
| ORDER | order | family, hall, city |
| MONEY | vault, invest, services | one money section instead of three |
| INTEL | intel | research and graph tools |
| GOVERN | govern | platform and admin, owner-facing |

Visible entries per section drop from about 7 to about 6, and the 6 double-listings disappear.

## 4. Steps, each its own PR and reversible

1. **Nav only. DONE 2026-11-05** (`docs/fixes/2026-11-05-nav-eight-doors.md`): the dock, tooltips and phone drawer group the
   15 sections into 8 doors; the sections themselves, the hubs and every page are unchanged. Labels keep the existing
   names because they are translated per key.
2. **Hub trims.** Same trick as #1164 on the heaviest hubs: state a status once, keep real per-item facts.
3. **Retire for real**, only with Cloudflare analytics and at least 30 days of data: pages with no views, no inbound
   link and nothing embedding them become redirects, then are removed.

## 5. Needs a decision

- Is the 8-section structure right? Tell me which sections to keep apart.
- Should the platform navigator page (a concept catalogue, see #1165) stay?
- Enable Cloudflare Web Analytics (a dashboard switch): without it step 3 cannot happen honestly.
