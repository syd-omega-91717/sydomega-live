begin;

-- Canonical 24-record product/service seed. No user orders, payments or rewards are created here.
insert into public.omega_capabilities
(capability_id,version,name,capability_type,module_id,purpose,lifecycle,audience,authz,data_class)
values
('core-orchestration','1.0.0','Core Orchestration','WORKFLOW','Core','Platform routing and governed state transitions','DESIGNED',array['human','agent'],'DENY_BY_DEFAULT','INTERNAL'),
('consultancy-workbench','1.0.0','Consultancy Workbench','SERVICE','Consultancy','Structured consultancy workflows','DESIGNED',array['human'],'DENY_BY_DEFAULT','CONFIDENTIAL'),
('gaming-engine','1.0.0','Gaming Engine','SERVICE','Gaming','Governed game-loop and simulation experiences','DESIGNED',array['human'],'DENY_BY_DEFAULT','INTERNAL'),
('achievement-engine','1.0.0','Achievement Engine','SERVICE','Achievements','Evidence-gated achievements and certificates','DESIGNED',array['human'],'DENY_BY_DEFAULT','PRIVATE'),
('family-space','1.0.0','Family Space','SERVICE','Family','Consent-aware family and heritage experiences','DESIGNED',array['human'],'DENY_BY_DEFAULT','PRIVATE'),
('media-studio','1.0.0','Media Studio','MEDIA_PIPELINE','Media','Governed media generation workflows','DESIGNED',array['human'],'DENY_BY_DEFAULT','PRIVATE'),
('blockchain-lab','1.0.0','Blockchain Lab','SERVICE','Blockchain/NFT','Signed transaction and digital-asset research/simulation','DESIGNED',array['human'],'DENY_BY_DEFAULT','RESTRICTED'),
('communication-hub','1.0.0','Communication Hub','SERVICE','Communication','User-scoped communication workflows','DESIGNED',array['human','agent'],'DENY_BY_DEFAULT','PRIVATE'),
('horoscope-oracle','1.0.0','Horoscope Oracle','SERVICE','Horoscope','Deterministic interpretive oracle experiences','DESIGNED',array['human'],'DENY_BY_DEFAULT','PUBLIC'),
('news-intelligence','1.0.0','News Intelligence','DATA_PRODUCT','News','Trusted-source news discovery and evidence synthesis','DESIGNED',array['human','agent'],'DENY_BY_DEFAULT','PUBLIC'),
('heritage-archive','1.0.0','Heritage Archive','DATA_PRODUCT','Heritage','Provenance-aware legacy archive','DESIGNED',array['human'],'DENY_BY_DEFAULT','PRIVATE'),
('progression-matrix','1.0.0','Progression Matrix','SERVICE','Progress','729-node governed progression and verification','INTEGRATED',array['human','agent'],'DENY_BY_DEFAULT','PRIVATE'),
('credentials-passport','1.0.0','Credentials Passport','SERVICE','Credentials','Evidence-backed credential presentation','DESIGNED',array['human'],'DENY_BY_DEFAULT','PRIVATE'),
('legal-compliance','1.0.0','Legal Compliance','SERVICE','Legal','Consent, terms and compliance workflows','DESIGNED',array['human'],'DENY_BY_DEFAULT','RESTRICTED'),
('elemental-simulation','1.0.0','Elemental Simulation','SERVICE','Elemental','Safe digital simulation of experimental concepts','DESIGNED',array['human'],'DENY_BY_DEFAULT','SIMULATION'),
('investment-intelligence','1.0.0','Investment Intelligence','SERVICE','Investment','Financial information and analysis without unauthorized execution','DESIGNED',array['human'],'DENY_BY_DEFAULT','CONFIDENTIAL'),
('intelligence-fabric','1.0.0','Intelligence Fabric','AI_AGENT','Intelligence','Governed agent orchestration and tool policy','INTEGRATED',array['human','agent'],'DENY_BY_DEFAULT','RESTRICTED'),
('hierarchy-governance','1.0.0','Hierarchy Governance','SERVICE','Hierarchy','Roles, authority and policy boundaries','DESIGNED',array['human','agent'],'DENY_BY_DEFAULT','RESTRICTED'),
('event-fabric','1.0.0','Durable Event Fabric','API','CrossPlatform','Allowlisted event and evidence linkage','DESIGNED',array['agent'],'DENY_BY_DEFAULT','RESTRICTED'),
('referral-economy','1.0.0','Referral Economy','SERVICE','CrossPlatform','Server-authoritative referral attribution','INTEGRATED',array['human','agent'],'DENY_BY_DEFAULT','FINANCIAL'),
('notification-delivery','1.0.0','Notification Delivery','WORKFLOW','CrossPlatform','Durable multi-channel notification queue','INTEGRATED',array['human','agent'],'DENY_BY_DEFAULT','PRIVATE'),
('agent-task-control','1.0.0','Agent Task Control','WORKFLOW','CrossPlatform','Queued agent lifecycle with approval and evidence','INTEGRATED',array['agent','human'],'DENY_BY_DEFAULT','RESTRICTED'),
('commerce-settlement','1.0.0','Commerce Settlement','PAYMENT_PRODUCT','CrossPlatform','Stripe-authoritative settlement and reconciliation','INTEGRATED',array['human'],'DENY_BY_DEFAULT','FINANCIAL'),
('observability-audit','1.0.0','Observability and Audit','REPORT','CrossPlatform','Audit and operational diagnostics','DESIGNED',array['human','agent'],'DENY_BY_DEFAULT','RESTRICTED')
on conflict (capability_id) do update set name=excluded.name,purpose=excluded.purpose,lifecycle=excluded.lifecycle,audience=excluded.audience,authz=excluded.authz,data_class=excluded.data_class,updated_at=now();

insert into public.omega_services(service_id,capability_id,name,service_family,commercial_model,status,description,delivery_mode,policy)
select capability_id,capability_id,name,
case
 when capability_id in ('core-orchestration','event-fabric','observability-audit','hierarchy-governance') then 'ENTERPRISE'
 when capability_id in ('consultancy-workbench','legal-compliance','investment-intelligence','commerce-settlement') then 'PROFESSIONAL'
 when capability_id in ('news-intelligence','heritage-archive','credentials-passport') then 'KNOWLEDGE'
 when capability_id in ('media-studio','elemental-simulation','blockchain-lab','gaming-engine') then 'CREATION'
 when capability_id in ('notification-delivery','agent-task-control','referral-economy','intelligence-fabric','progression-matrix','achievement-engine') then 'AUTOMATION'
 else 'COMMUNITY' end,
case
 when capability_id in ('core-orchestration','communication-hub','news-intelligence','horoscope-oracle') then 'FREE'
 when capability_id='commerce-settlement' then 'USAGE'
 when capability_id in ('consultancy-workbench','investment-intelligence','media-studio','gaming-engine') then 'SUBSCRIPTION'
 else 'ONE_TIME' end,
case when lifecycle='INTEGRATED' then 'INTEGRATED' else 'DESIGNED' end,
purpose,'DIGITAL',jsonb_build_object('defaultAgentAccess','DENY','humanApprovalRequired',true,'productionStatusRequired','VERIFIED')
from public.omega_capabilities
on conflict(service_id) do update set capability_id=excluded.capability_id,name=excluded.name,service_family=excluded.service_family,commercial_model=excluded.commercial_model,status=excluded.status,description=excluded.description,delivery_mode=excluded.delivery_mode,policy=excluded.policy,updated_at=now();

commit;
