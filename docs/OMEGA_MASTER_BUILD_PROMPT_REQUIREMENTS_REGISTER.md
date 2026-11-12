# Ω SYD OMEGA 91717 — Master Build Prompt Requirements Register

**Source:** `SYD OMEGA 91717 - Master Prompt.txt`
**Audit date:** 2026-11-11
**Coverage:** 16 major sections; 439 source bullet/checklist/numbered requirements; 24 proposed Prisma models; 11 proposed enums.

> Historical proposed build requirements only. This register is not authorization to replace the current static + Supabase architecture. Secret assignments, hard-coded credentials and wallet identifiers are intentionally excluded. Consult the source file for original line context; never copy its credential values.

## Major section index

- **L18:** SECTION A — ROOT STRUCTURE & MONOREPO
- **L72:** SECTION B — ENVIRONMENT VARIABLES (.env ROOT)
- **L163:** SECTION C — DATABASE SCHEMA (prisma/schema.prisma)
- **L685:** SECTION D — MICROSERVICES ARCHITECTURE
- **L890:** SECTION E — SECURITY ARCHITECTURE (ALL LEVELS)
- **L951:** SECTION F — SCALABILITY ARCHITECTURE
- **L995:** SECTION G — FRONTEND (apps/web/)
- **L1269:** SECTION H — MOBILE APP (apps/mobile/) — React Native + Expo
- **L1361:** SECTION I — LEADERBOARD SYSTEM (complete implementation)
- **L1429:** SECTION J — CHATBOT SYSTEM (complete implementation)
- **L1489:** SECTION K — MISSING SYSTEMS TO ADD
- **L1599:** SECTION L — DOCKER & LOCAL DEVELOPMENT
- **L1652:** SECTION M — DEPLOYMENT CONFIGS
- **L1695:** SECTION N — SEED DATA (scripts/seed.js)
- **L1728:** SECTION O — REPAIR & VALIDATION CHECKLIST
- **L1778:** SECTION P — EXECUTION ORDER

## Proposed schema inventory

**Enums:** Role (L179), SubscriptionTier (L186), Element (L198), AchievementType (L202), AssetType (L206), TransactionType (L210), TransactionStatus (L214), ChainType (L218), GameStage (L222), KYCStatus (L227), NotificationType (L231).

**Models:** User (L237), UserSession (L298), KYCDocument (L313), Subscription (L326), Achievement (L343), Asset (L361), Transaction (L383), Game (L406), GameProgress (L420), Character (L438), NFT (L453), CryptoHolding (L476), HoroscopeProfile (L494), FamilyNode (L510), Passport (L524), ConsultancyBooking (L537), Report (L556), LeaderboardEntry (L574), ChatMessage (L590), Notification (L606), AuditLog (L622), InvestmentAllocation (L642), SocialLink (L653), TimeTracking (L666).

## Source requirements by section

### SECTION A — ROOT STRUCTURE & MONOREPO
**Source lines:** 18–71

- No bullet/checklist requirement extracted in this section.
 
### SECTION B — ENVIRONMENT VARIABLES (.env ROOT)
**Source lines:** 72–162

- No bullet/checklist requirement extracted in this section.
 
### SECTION C — DATABASE SCHEMA (prisma/schema.prisma)
**Source lines:** 163–684

- No bullet/checklist requirement extracted in this section.
 
### SECTION D — MICROSERVICES ARCHITECTURE
**Source lines:** 685–889

- **L695:** - Single entry point: port 4000
- **L696:** - Route all /api/auth/* → auth-service:4001
- **L697:** - Route all /api/users/* → user-service:4002
- **L698:** - Route all /api/payment/* → payment-service:4003
- **L699:** - Route all /api/gaming/* → gaming-service:4004
- **L700:** - Route all /api/nft/* → nft-service:4005
- **L701:** - Route all /api/chat/* → chat-service:4006
- **L702:** - Route all /api/media/* → media-service:4007
- **L703:** - Route all /api/horoscope/* → horoscope-service:4008
- **L704:** - Route all /api/news/* → news-service:4009
- **L705:** - Route all /api/heritage/* → heritage-service:4010
- **L706:** - Route all /api/investment/* → investment-service:4011
- **L707:** - Route all /api/notify/* → notification-service:4012
- **L710:** - helmet() for security headers
- **L711:** - cors() with CORS_ORIGINS from env
- **L712:** - morgan for request logging
- **L713:** - Global rate limiter (100 req/15min per IP)
- **L714:** - Request ID injection (x-request-id header)
- **L715:** - JWT validation before proxying
- **L716:** - Request/response logging to AuditLog
- **L717:** - Health check: GET /health (pings all services)
- **L744:** - Passwords: bcrypt with rounds=12
- **L745:** - JWT: RS256 algorithm preferred
- **L746:** - Refresh tokens: stored in DB, rotated on use
- **L747:** - 2FA: speakeasy library for TOTP
- **L748:** - Account lockout after 5 failed attempts (15min lock)
- **L749:** - IP-based suspicious activity detection
- **L769:** - payment_intent.succeeded
- **L770:** - payment_intent.payment_failed
- **L771:** - customer.subscription.created
- **L772:** - customer.subscription.updated
- **L773:** - customer.subscription.deleted
- **L774:** - invoice.payment_succeeded
- **L775:** - invoice.payment_failed
- **L789:** - All payment data encrypted at rest (AES-256)
- **L790:** - PCI DSS compliance: never store raw card data
- **L791:** - Stripe webhook signature validation (stripe.webhooks.constructEvent)
- **L792:** - Idempotency keys on all Stripe requests
- **L793:** - Transaction audit log for every operation
- **L794:** - Double-write: DB + Stripe (reconciliation endpoint)
- **L815:** - Use Redis Sorted Sets for real-time leaderboard
- **L816:** - Key pattern: leaderboard:{type}:{period}
- **L817:** - ZADD for score updates
- **L818:** - ZREVRANGE for top N
- **L819:** - ZRANK for user rank
- **L820:** - Daily/Weekly/Monthly auto-reset via cron job
- **L821:** - Persist snapshots to PostgreSQL
- **L822:** - Redis pipeline for atomic batch updates
- **L825:** 1. GLOBAL — overall XP across all modules
- **L826:** 2. GAMING — gaming XP only
- **L827:** 3. CRYPTO — portfolio value
- **L828:** 4. ACHIEVEMENT — total achievements count
- **L829:** 5. PER_MODULE — one board per module
- **L864:** - Use SSE (Server-Sent Events) for streaming responses
- **L865:** - Send chunks as: data: {"chunk": "...", "done": false}\n\n
- **L866:** - Final: data: {"chunk": "", "done": true, "tokens": N}\n\n
- **L867:** - Store complete message to DB after stream ends
- **L870:** - user:join → join personal room
- **L871:** - chat:message → send message
- **L872:** - chat:stream → receive streaming response
- **L873:** - chat:typing → show typing indicator
- **L874:** - notification:new → receive new notification
 
### SECTION E — SECURITY ARCHITECTURE (ALL LEVELS)
**Source lines:** 890–950

- **L896:** - Nginx reverse proxy in front of all services
- **L897:** - TLS/HTTPS enforced (redirect HTTP → HTTPS)
- **L898:** - Cloudflare WAF enabled (use CF API)
- **L899:** - DDoS protection via Cloudflare
- **L900:** - Rate limiting: 100 req/15min general, 10 req/min for auth
- **L901:** - IP allowlist for /api/owner/* routes
- **L904:** - helmet.js on all services (CSP, HSTS, X-Frame-Options)
- **L905:** - CORS: only CORS_ORIGINS whitelist
- **L906:** - express-validator on all input fields
- **L907:** - SQL injection prevention via Prisma parameterized queries
- **L908:** - XSS protection: sanitize all user inputs (xss-clean)
- **L909:** - CSRF tokens for state-changing requests
- **L910:** - HTTP parameter pollution prevention (hpp)
- **L911:** - Request size limit: 10mb for general, 50mb for uploads
- **L914:** - JWT RS256 with private/public key pair
- **L915:** - Short-lived access tokens (30min recommended)
- **L916:** - Long-lived refresh tokens (90 days) stored in DB
- **L917:** - Token rotation: new refresh token on every use
- **L918:** - Refresh token family tracking (detect reuse attack)
- **L919:** - Session invalidation on password change
- **L920:** - 2FA via TOTP (Google Authenticator compatible)
- **L921:** - Account lockout: 5 failed logins → 15min lockout
- **L922:** - Suspicious IP detection (new country login → email alert)
- **L925:** - AES-256-GCM encryption for sensitive fields
- **L926:** - Passwords: bcrypt rounds=12
- **L927:** - Payment data: never stored, Stripe tokenizes
- **L928:** - PII fields encrypted: email, phone, address, DOC numbers
- **L929:** - Database connection over SSL
- **L930:** - DB credentials rotated monthly via scripts
- **L931:** - Backup encryption: all DB backups AES-256 encrypted
- **L934:** - All secrets in .env (never in code)
- **L935:** - .env never committed to git (.gitignore)
- **L936:** - Separate .env per environment (dev/staging/prod)
- **L937:** - Service-to-service auth via internal JWT + shared secret
- **L938:** - Docker secrets for production (not env vars in compose)
- **L939:** - Render/Vercel environment variables (not exposed to client)
- **L940:** - Audit log for every sensitive action
- **L941:** - Automated security scanning in CI (npm audit)
- **L944:** - GDPR: right to deletion endpoint
- **L945:** - Data export: user can download all their data
- **L946:** - Cookie consent banner
- **L947:** - Privacy policy page
- **L948:** - Terms of service page
 
### SECTION F — SCALABILITY ARCHITECTURE
**Source lines:** 951–994

- **L955:** - Cache user sessions (TTL: 30min)
- **L956:** - Cache leaderboards (TTL: 60sec, real-time via sorted sets)
- **L957:** - Cache horoscope daily readings (TTL: 24hr)
- **L958:** - Cache news feeds (TTL: 15min)
- **L959:** - Cache user profile lookups (TTL: 5min)
- **L960:** - Cache investment prices (TTL: 5min)
- **L961:** - Cache-aside pattern: check Redis → if miss → DB → store in Redis
- **L964:** - Connection pooling via Prisma (pool size: 10 per service)
- **L965:** - Read replicas for heavy read services (news, leaderboard)
- **L966:** - Database indexes on all foreign keys and frequent queries
- **L967:** - Pagination on all list endpoints (cursor-based pagination)
- **L968:** - Soft deletes (isDeleted flag) instead of hard deletes
- **L969:** - Archive old audit logs after 90 days → cold storage
- **L973:** - email-queue: send emails async (welcome, receipts, alerts)
- **L974:** - notification-queue: push notifications async
- **L975:** - investment-queue: auto-invest calculations
- **L976:** - report-queue: PDF generation async
- **L977:** - leaderboard-queue: score recalculation batch
- **L980:** - Response compression (gzip via compression middleware)
- **L981:** - HTTP/2 via Nginx
- **L982:** - CDN for static assets (Cloudflare)
- **L983:** - Image optimization: resize on upload, serve WebP
- **L984:** - API response time target: p99 < 500ms
- **L985:** - Database query timeout: 5 seconds max
- **L988:** - All services stateless (no in-memory state)
- **L989:** - Sessions stored in Redis (not memory)
- **L990:** - Docker containers ready for horizontal scaling
- **L991:** - PM2 cluster mode for Node.js services
- **L992:** - render.yaml configured for auto-scaling
 
### SECTION G — FRONTEND (apps/web/)
**Source lines:** 995–1268

- **L1020:** - Deep space black backgrounds
- **L1021:** - Gold as the primary accent (never overused)
- **L1022:** - Crimson for danger/power moments
- **L1023:** - Cyan for technology/data
- **L1024:** - Every element feels hand-crafted, not generic
- **L1111:** - OmegaLayout.tsx — root layout with sidebar + content area
- **L1112:** - OmegaSidebar.tsx — 18-module nav, Ω logo, role badges
- **L1113:** - OmegaTopBar.tsx — search, notifications, user avatar
- **L1114:** - OmegaFooter.tsx — social links, copyright Ω seal
- **L1117:** - ModuleNav.tsx — animated module tabs
- **L1118:** - BreadCrumb.tsx — gold-styled breadcrumb trail
- **L1119:** - BackButton.tsx — animated back with Ω chevron
- **L1122:** - OmegaCard.tsx — glassmorphism card (title, icon, level, children)
- **L1123:** - StatCard.tsx — number + label + trend indicator
- **L1124:** - LevelBadge.tsx — hexagonal level display (1-9, animated at 9)
- **L1125:** - ProgressBar9.tsx — 9-segment gold progress bar
- **L1126:** - TrophyCard.tsx — 3D flip trophy display
- **L1127:** - MedalDisplay.tsx — circular medal with ribbon variants
- **L1128:** - CertificateView.tsx — printable PDF-ready certificate
- **L1129:** - AchievementUnlock.tsx — fullscreen celebration overlay
- **L1130:** - NftCard.tsx — NFT card with rarity glow effect
- **L1131:** - CryptoTicker.tsx — animated price ticker
- **L1134:** - LeaderboardTable.tsx
- **L1135:** - Rank column: #1 gold, #2 silver, #3 bronze, rest normal
- **L1136:** - User row: avatar, name, level badge, score, trend arrow
- **L1137:** - Animated rank changes (slide up/down)
- **L1138:** - Filter tabs: Global / Gaming / Crypto / Weekly / Monthly
- **L1139:** - Top 3 podium display (3D effect for top positions)
- **L1140:** - Current user row always visible (pinned at bottom)
- **L1141:** - Real-time updates via Socket.io
- **L1142:** - Infinite scroll (load more)
- **L1143:** - LeaderboardPodium.tsx — animated 3D podium for top 3
- **L1144:** - RankBadge.tsx — #1/#2/#3 special badge with crown/star
- **L1147:** - OmegaInput.tsx — styled input with gold focus ring
- **L1148:** - OmegaSelect.tsx — custom dropdown with Ω styling
- **L1149:** - OmegaTextarea.tsx — styled textarea
- **L1150:** - OmegaFileUpload.tsx — drag-and-drop file upload
- **L1151:** - FormField.tsx — input + label + error message wrapper
- **L1154:** - ChatWindow.tsx — full chat interface
- **L1155:** - Message list (virtualized for performance)
- **L1156:** - Input bar with send button + module shortcut icons
- **L1157:** - Streaming text animation (typewriter effect)
- **L1158:** - OMEGA-AI avatar with golden halo animation
- **L1159:** - Session management panel
- **L1160:** - Module context pill (shows active module)
- **L1161:** - ChatBubble.tsx — user (right/cyan) vs AI (left/gold) messages
- **L1162:** - TypingIndicator.tsx — three animated gold dots
- **L1163:** - ChatModuleShortcuts.tsx — quick action buttons per module
- **L1164:** - FloatingChatButton.tsx — bottom-right FAB with pulse animation
- **L1167:** - PaymentModal.tsx — Stripe Elements card form
- **L1168:** - PricingCard.tsx — tier card with feature list
- **L1169:** - PricingGrid.tsx — 9-tier grid layout
- **L1170:** - TransactionRow.tsx — single transaction item
- **L1171:** - TransactionHistory.tsx — paginated transaction list
- **L1172:** - CryptoTransfer.tsx — crypto send/receive form
- **L1173:** - ReceiptView.tsx — PDF-ready receipt layout
- **L1176:** - InvestmentPieChart.tsx — Recharts pie for allocations
- **L1177:** - XpRadarChart.tsx — user skill radar across modules
- **L1178:** - CryptoPriceLadder.tsx — 9x9 animated grid
- **L1179:** - HapticWaveform.tsx — 9.17Hz sine wave animation
- **L1180:** - TimeHeatmap.tsx — daily time dedication heatmap
- **L1183:** - OmegaGlobe3D.tsx — rotating planet for horoscope
- **L1184:** - TrophyScene3D.tsx — 3D trophy in Three.js
- **L1185:** - OmegaLogo3D.tsx — 3D rotating Ω for landing page
- **L1186:** - PillarVisualization3D.tsx — 9x9x9 pillar system
- **L1189:** - WalletCard.tsx — styled wallet address display
- **L1190:** - QRCodeDisplay.tsx — QR code viewer
- **L1191:** - PassportCard.tsx — digital passport visual
- **L1192:** - CreditCard.tsx — virtual crypto card design
- **L1193:** - OmegaSeal.tsx — animated holographic seal
- **L1194:** - ParticleField.tsx — background particle system
- **L1195:** - OmegaLoader.tsx — global loading overlay
- **L1196:** - ErrorBoundary.tsx — graceful error fallback
- **L1197:** - ConfirmDialog.tsx — confirmation modal
- **L1198:** - ToastProvider.tsx — notification toasts
- **L1209:** - Full leaderboard hub page
- **L1210:** - Tab navigation: Global / Gaming / Crypto / Weekly / Monthly
- **L1211:** - Podium section at top (top 3 with 3D effect)
- **L1212:** - Full table below
- **L1213:** - User's own rank highlighted and pinned
- **L1214:** - Filters: All Time / This Week / This Month
- **L1215:** - Real-time score updates via Socket.io
- **L1218:** - Account settings: email, password, 2FA toggle
- **L1219:** - Profile settings: name, bio, avatar upload
- **L1220:** - Notification preferences (email/SMS/push toggles)
- **L1221:** - Privacy settings: profile visibility
- **L1222:** - Linked accounts: connect social platforms
- **L1223:** - Danger zone: delete account, export data
- **L1226:** - List of all notifications
- **L1227:** - Mark all as read
- **L1228:** - Filter by type
- **L1229:** - Click to navigate to relevant module
- **L1232:** - Global search with debounce
- **L1233:** - Search across: users, games, NFTs, reports, characters
- **L1234:** - Category filter chips
- **L1235:** - Results organized in sections
- **L1236:** - Recent searches (stored in localStorage)
- **L1237:** - Trending searches
- **L1240:** - Step-by-step wizard for new users
- **L1241:** - Step 1: Enter birth info (for horoscope)
- **L1242:** - Step 2: Choose element
- **L1243:** - Step 3: Set up profile
- **L1244:** - Step 4: Choose subscription tier
- **L1245:** - Step 5: Complete (show generated horoscope character)
 
### SECTION H — MOBILE APP (apps/mobile/) — React Native + Expo
**Source lines:** 1269–1360

- **L1332:** - Same Ω brand identity adapted for mobile
- **L1333:** - Dark theme with gold accents
- **L1334:** - Bottom tab navigation: Home / Gaming / Chat / Leaderboard / Profile
- **L1335:** - Haptic feedback (expo-haptics) on level ups, achievements
- **L1336:** - Push notifications (expo-notifications) for:
- **L1337:** - New rank on leaderboard
- **L1338:** - Achievement unlocked
- **L1339:** - Daily horoscope ready
- **L1340:** - Payment confirmed
- **L1341:** - New message
- **L1342:** - Biometric auth option (expo-local-authentication)
- **L1343:** - Offline mode for horoscope and profile viewing
- **L1344:** - Deep linking support for /profile/:id, /nft/:id
 
### SECTION I — LEADERBOARD SYSTEM (complete implementation)
**Source lines:** 1361–1428

- **L1369:** - Gaming XP:        1 point per XP
- **L1370:** - Level bonus:      level × 100 points
- **L1371:** - Achievement:      trophy=500, medal=200, cert=100
- **L1372:** - Daily login:      +10 points
- **L1373:** - Subscription:     tier × 50 bonus points
- **L1374:** - Referral:         +200 per verified referral
- **L1375:** - Time dedication:  1 point per 10 minutes daily
- **L1378:** - On XP gain → update GAMING board
- **L1379:** - On level up → update GLOBAL board
- **L1380:** - On achievement → update ACHIEVEMENT board
- **L1381:** - On portfolio value change → update CRYPTO board
- **L1382:** - At midnight UTC → snapshot daily boards, start fresh
- **L1399:** - emit `leaderboard:update` when top 100 changes
- **L1400:** - emit `rank:changed` to specific user when their rank changes
- **L1423:** - Rank number changes: slide up/down with color flash
- **L1424:** - New entry entering top 10: spotlight animation
- **L1425:** - User's own rank change: notification toast + table highlight
- **L1426:** - Top 3 podium: breathing gold glow on #1
 
### SECTION J — CHATBOT SYSTEM (complete implementation)
**Source lines:** 1429–1488

- **L1436:** - Complete knowledge of all 18 modules
- **L1437:** - User context injection: {userName}, {level}, {role}, {element}
- **L1438:** - Conversation memory (last 20 messages included in context)
- **L1439:** - Module awareness: detect which module user is asking about
- **L1440:** - Response format: structured with headings when needed
- **L1441:** - Personality: wise, authoritative, slightly mystical
- **L1442:** - Never mention being Claude or Anthropic
- **L1458:** 1. Try Claude API (primary)
- **L1459:** 2. On failure → fallback to Gemini API
- **L1460:** 3. Log which model was used per message
- **L1465:** - Sidebar: conversation history list (by date)
- **L1466:** - Main area: scrollable message list
- **L1467:** - Typing indicator when AI is generating
- **L1468:** - Streaming text (character by character reveal)
- **L1469:** - Code blocks: syntax highlighted
- **L1470:** - Markdown rendering
- **L1471:** - Copy message button on hover
- **L1472:** - Regenerate response button
- **L1473:** - Module context selector (dropdown)
- **L1474:** - Quick prompts per module:
- **L1482:** - OMEGA-AI avatar: animated golden Ω symbol
- **L1483:** - Typewriter animation for streaming response
- **L1484:** - Message timestamp on hover
- **L1485:** - Smooth scroll to new messages
- **L1486:** - Loading state: pulsing gold dots
 
### SECTION K — MISSING SYSTEMS TO ADD
**Source lines:** 1489–1598

- **L1493:** - Each user gets unique referral code
- **L1494:** - Share link: https://sydomega.com/join?ref=CODE
- **L1495:** - Referral tracking: /api/referral/track
- **L1496:** - Rewards: +200 leaderboard points per verified referral
- **L1497:** - Dashboard: show referred users count + rewards earned
- **L1500:** - In-app: notification bell in top bar
- **L1501:** - Email: nodemailer templates for all events
- **L1502:** - SMS: Twilio for critical events (payment, level up)
- **L1503:** - Push (mobile): expo-notifications
- **L1504:** - Notification types: Achievement / Payment / Level Up /
- **L1506:** - Preferences: user can toggle each type on/off
- **L1509:** - /settings/privacy → data management page
- **L1510:** - Export all data: generates JSON download of user's complete record
- **L1511:** - Delete account: soft delete with 30-day recovery window
- **L1512:** - Cookie consent modal (first visit)
- **L1513:** - Privacy policy page (/legal/privacy)
- **L1514:** - Terms of service page (/legal/terms)
- **L1515:** - Cookie policy page (/legal/cookies)
- **L1519:** - KPI cards: Total Users / Active Subscribers / Revenue Today / System Health
- **L1520:** - User management: search, filter by role, view profile, change role, ban
- **L1521:** - KYC review queue: approve/reject with notes
- **L1522:** - Transaction monitoring: all payments, refunds, disputes
- **L1523:** - Leaderboard management: manual score adjustment, reset
- **L1524:** - Investment engine: adjust allocation percentages
- **L1525:** - Broadcast message: send notification to all users or segment
- **L1526:** - System health: API key status, DB connection, Redis ping
- **L1527:** - Audit log: searchable, filterable, exportable CSV
- **L1528:** - Content management: manage games, characters, news categories
- **L1529:** - Crypto lock dashboard: 51% vault status
- **L1534:** - Users (name, email — verified only)
- **L1535:** - Games (title, description)
- **L1536:** - NFTs (name, category)
- **L1537:** - Reports (title, sector)
- **L1538:** - Characters (name, civilization)
- **L1539:** - News (title, category)
- **L1540:** - Achievements (name)
- **L1546:** - Server-side analytics: track page views, API usage per user
- **L1547:** - Admin analytics dashboard: user growth chart, revenue chart,
- **L1549:** - User personal analytics: time per module chart, progress radar
- **L1550:** - Automated weekly report: email to owner every Monday
- **L1553:** - Cloudinary integration for all image uploads
- **L1554:** - Avatar: auto-resize to 200x200, 400x400
- **L1555:** - NFT images: store original + thumbnail
- **L1556:** - Report PDFs: store in Cloudinary secure
- **L1557:** - File size limits enforced server-side
- **L1558:** - Virus scan hook (ClamAV or equivalent)
- **L1562:** - manifest.json with Ω icon, theme color #0A0A0F
- **L1563:** - Service worker: offline support for dashboard + profile
- **L1564:** - Install prompt for mobile browsers
- **L1565:** - Push notification support via web push
- **L1566:** - App-like experience on mobile browsers
- **L1569:** - Client: implement simple error boundary with error reporting
- **L1570:** - Server: structured error logging to console + file
- **L1571:** - Health check dashboard at /api/health (pings all services)
- **L1572:** - Uptime monitoring: add to render.yaml health check URL
- **L1573:** - Alert: email owner if any service goes down
- **L1584:** - Use canvas/jsPDF to generate:
- **L1585:** - Passport PDF: official-looking document with Ω seal, QR, user data
- **L1586:** - Crypto Card: credit-card-sized PNG/PDF design
- **L1587:** - QR code: links to https://sydomega.com/profile/{userId}
- **L1588:** - Issue via Stripe (fee charged before PDF generated)
- **L1589:** - Stored in Cloudinary, link saved to Passport model
- **L1592:** - Add i18next + react-i18next
- **L1593:** - Support: English (default), Arabic, French
- **L1594:** - Language switcher in top bar
- **L1595:** - All UI strings in translation files
- **L1596:** - RTL support for Arabic (html dir="rtl")
 
### SECTION L — DOCKER & LOCAL DEVELOPMENT
**Source lines:** 1599–1651

- No bullet/checklist requirement extracted in this section.
 
### SECTION M — DEPLOYMENT CONFIGS
**Source lines:** 1652–1694

- **L1670:** - name: sydomega-postgres
- **L1674:** - type: web
- **L1680:** - key: DATABASE_URL
 
### SECTION N — SEED DATA (scripts/seed.js)
**Source lines:** 1695–1727

- **L1700:** 1. OWNER user:
- **L1709:** 2. 9 Games: OMEGA-1 through OMEGA-9 with placeholder descriptions
- **L1711:** 3. 9 Investment allocations:
- **L1715:** 4. 81 Crypto entries (9 categories × 9 tiers) with seed prices
- **L1717:** 5. 81 NFT template entries (9 categories × 9 tiers)
- **L1719:** 6. Horoscope data: 12 signs with planet/god assignments
- **L1721:** 7. 6 Elements with descriptions and civilization mappings
- **L1723:** 8. Sample achievements: 3 trophies, 3 medals, 3 certificates
- **L1725:** 9. Leaderboard seed: initialize Redis sorted sets with owner entry
 
### SECTION O — REPAIR & VALIDATION CHECKLIST
**Source lines:** 1728–1777

- **L1734:** □ All services start without errors
- **L1735:** □ /api/health returns green for all services
- **L1736:** □ Database connected, all migrations applied
- **L1737:** □ Redis connected, leaderboard sorted sets initialized
- **L1738:** □ JWT auth works: issue token → use on protected route
- **L1739:** □ Role guards: OWNER-only routes reject non-owners
- **L1740:** □ Stripe: test payment creates transaction in DB
- **L1741:** □ Stripe webhook: test event processed correctly
- **L1742:** □ Claude API: chatbot responds with streaming
- **L1743:** □ All CORS errors resolved
- **L1744:** □ All rate limits configured correctly
- **L1745:** □ Audit log records: login, payment, level up, admin actions
- **L1748:** □ All 18+ pages render without console errors
- **L1749:** □ React Router: no 404 on page refresh
- **L1750:** □ All API calls use correct gateway URL (VITE_API_URL)
- **L1751:** □ Auth flow: register → login → protected page → logout
- **L1752:** □ Leaderboard loads and updates via Socket.io
- **L1753:** □ Chatbot sends message and streams response
- **L1754:** □ Payment modal: Stripe Elements loads and processes
- **L1755:** □ Framer Motion transitions work on all pages
- **L1756:** □ Mobile responsive at 375px, 768px, 1280px
- **L1757:** □ All forms validate correctly (zod schemas)
- **L1758:** □ Error boundaries catch and display errors gracefully
- **L1759:** □ Loading states on all async operations
- **L1760:** □ Toast notifications appear for all actions
- **L1763:** □ Expo app starts on iOS simulator and Android emulator
- **L1764:** □ Bottom tabs navigate correctly
- **L1765:** □ Login works and stores token in SecureStore
- **L1766:** □ Leaderboard loads
- **L1767:** □ Chat sends message
- **L1768:** □ Push notification permission requested
- **L1771:** □ No API keys exposed in client bundle (check build output)
- **L1772:** □ .env not committed to git
- **L1773:** □ Helmet headers present in responses
- **L1774:** □ Rate limiting active (test with rapid requests)
- **L1775:** □ 2FA flow works end-to-end
 
### SECTION P — EXECUTION ORDER
**Source lines:** 1778–1847

- **L1783:** 1.  Create full directory structure
- **L1784:** 2.  Write root package.json with workspaces + turbo.json
- **L1785:** 3.  Write .env with all environment variables
- **L1786:** 4.  Write prisma/schema.prisma (complete schema)
- **L1787:** 5.  npm install all dependencies (all services + apps)
- **L1788:** 6.  Run: npx prisma migrate dev --name init
- **L1789:** 7.  Run: npx prisma generate
- **L1790:** 8.  Build services/gateway (proxy + middleware)
- **L1791:** 9.  Build services/auth-service (full auth system)
- **L1792:** 10. Build services/payment-service (Stripe microservice)
- **L1793:** 11. Build services/gaming-service (games + leaderboard + Redis)
- **L1794:** 12. Build services/chat-service (Claude API + Socket.io)
- **L1795:** 13. Build remaining 8 services (nft, media, horoscope, news, heritage, investment, notification, user)
- **L1796:** 14. Write apps/web design system (tokens.css + Tailwind config)
- **L1797:** 15. Write all shared UI components
- **L1798:** 16. Write Zustand stores
- **L1799:** 17. Write React Router (App.tsx with all routes)
- **L1800:** 18. Build all 20+ web pages
- **L1801:** 19. Initialize apps/mobile with Expo
- **L1802:** 20. Build mobile navigation + all screens
- **L1803:** 21. Write scripts/seed.js + run: node scripts/seed.js
- **L1804:** 22. Write Docker configs (docker-compose.yml + Dockerfiles)
- **L1805:** 23. Write deployment configs (vercel.json, render.yaml, netlify.toml)
- **L1806:** 24. Write infra/nginx/nginx.conf
- **L1807:** 25. Run full repair checklist (Section O)
- **L1808:** 26. Start full stack: docker-compose up (or npm run dev)
- **L1809:** 27. Verify /api/health all green
- **L1810:** 28. Test complete user flow: register → subscribe → game → leaderboard → chat → pay
- **L1811:** 29. Fix all errors found during testing
- **L1812:** 30. Commit to GitHub: git add . && git commit -m "SYD OMEGA 91717 — Full System Build"
 
## Security note

The source contains credential-like assignments and static development passwords in its environment/Docker examples. They are intentionally omitted from this register. Treat any real values copied from the source as exposed, rotate them and store replacements only in provider-managed secret storage. Do not create a production `.env` from the prompt.

## Implementation rule

Each approved requirement must be reconciled with current repository contracts and evidence. Do not implement the proposed Prisma schema, duplicate JWT/auth system, React/Vite monorepo, microservices, or alternate deployment stack unless a separate architecture decision approves the migration.