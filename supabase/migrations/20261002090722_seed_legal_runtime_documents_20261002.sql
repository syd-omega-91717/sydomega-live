begin;

insert into public.omega_legal_documents(document_type,version,status,effective_at,title,body_markdown,source_uri,content_hash)
values
('terms','2026-10-02','PUBLISHED','2026-10-02T00:00:00Z','SYD OMEGA 91717 — Terms & Conditions',
'## Terms & Conditions

### 1. Sovereign Acceptance
By entering or continuing to use the platform, you accept these Terms and the applicable platform charter.

### 2. One Account
One account per person. Identity verification may be required before restricted economic features are enabled.

### 3. Earned Standing
Platform authority, progression, ranks and certificates are based on verified platform state and evidence. They are not sold.

### 4. Internal Assets
OMEGA platform assets are internal platform state unless and until an independently verified external legal and technical integration exists. No asset is represented as cash, a security, or a guaranteed investment.

### 5. Consultancy
Consultancy and contract engagements may require separate engagement terms, confidentiality terms and pricing.

### 6. Conduct
Fraud, abuse, harassment, unauthorized access, manipulation of platform state and unlawful use are prohibited.

### 7. Content
Users retain rights they lawfully hold in their submitted works and grant the platform the permissions necessary to operate the service. Interpretive horoscope/oracle content is for reflection and entertainment, not professional advice.

### 8. Data and Privacy
Personal data is processed according to the published Privacy Policy and applicable law. Users may exercise available data rights through the Privacy Centre.

### 9. Gated Economics
Financial, marketplace, token, KYC and other regulated economic features remain gated until the required provider, legal, compliance and operational controls are verified.

### 10. Platform Evolution
The platform may evolve. Material changes to terms will be versioned and surfaced for renewed acceptance where required.

### 11. Intellectual Property
SYD OMEGA branding, software, designs, lore and platform materials are protected by applicable intellectual-property law. No license to copy or build a competing derivative platform is granted except as expressly stated.',
'https://sydomega.com/terms.html',
encode(digest('SYD OMEGA 91717 — Terms & Conditions|2026-10-02','sha256'),'hex'))
on conflict(document_type) do update set version=excluded.version,status=excluded.status,effective_at=excluded.effective_at,title=excluded.title,body_markdown=excluded.body_markdown,source_uri=excluded.source_uri,content_hash=excluded.content_hash,updated_at=now();

insert into public.omega_legal_documents(document_type,version,status,effective_at,title,body_markdown,source_uri,content_hash)
values
('privacy','2026-10-02','PUBLISHED','2026-10-02T00:00:00Z','SYD OMEGA 91717 — Privacy Centre',
'## Privacy Centre

### What we process
Account/profile information, platform activity and security/audit events needed to operate, secure and improve the service. Identity documents are processed only where the relevant verification workflow requires them.

### Why we process it
Service delivery, authentication, security, fraud prevention, evidence-backed progression, requested communications, legal obligations and consent-based optional features.

### Consent
Optional processing is represented by versioned consent records. Consent can be changed through the Privacy Centre.

### Data rights
Subject to applicable law and legitimate operational/security exceptions, users may request access, correction, portability and deletion.

### Retention
Retention is purpose-based and governed by the platform retention controls. Security, financial, contractual and consent records may require longer retention where legally required.

### Security
The platform uses authentication, row-level authorization, server-side privileged boundaries, audit evidence and provider controls. No secret service credential is intended for browser delivery.

### Providers and transfers
Infrastructure and external providers may process data only as required to deliver configured services and subject to applicable contractual and legal controls. Current provider configuration is the authoritative source for active transfers.

### Contact
Privacy and data-rights requests may be submitted through the platform contact channel.

### Important
This document is an operational privacy notice, not a substitute for jurisdiction-specific legal advice. Applicable rights and obligations depend on the user, service, location and processing activity.',
'https://sydomega.com/privacy.html',
encode(digest('SYD OMEGA 91717 — Privacy Centre|2026-10-02','sha256'),'hex'))
on conflict(document_type) do update set version=excluded.version,status=excluded.status,effective_at=excluded.effective_at,title=excluded.title,body_markdown=excluded.body_markdown,source_uri=excluded.source_uri,content_hash=excluded.content_hash,updated_at=now();

commit;