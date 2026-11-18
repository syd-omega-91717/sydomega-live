#!/usr/bin/env node
const fs=require('fs');
const gate=JSON.parse(fs.readFileSync('config/omega-production-10-10-evidence-gate.json','utf8'));
if(gate.truth_rule!=='IMPLEMENTATION_IS_NOT_PROVIDER_EVIDENCE')throw new Error('truth rule changed');
if(!Array.isArray(gate.domains)||gate.domains.length!==12)throw new Error('unexpected gate domain count');
const allowed=new Set(gate.statuses);
for(const d of gate.domains){if(!d.id||!allowed.has(d.status)||!Array.isArray(d.evidence_required)||!d.evidence_required.length)throw new Error('invalid domain: '+JSON.stringify(d));}
const cloudflare=gate.domains.find(d=>d.id==='cloudflare_production');
const requiredDeploymentEvidence=[
  'cloudflare_pages_production_deployment_for_current_main_commit',
  'release_manifest_commit_sha_matches_current_main_head',
  'sydomega_and_www_aliases_resolve_to_verified_deployment',
  'production_headers_csp_and_hsts_verified',
  'core_route_and_full_page_estate_smoke_passes',
  'rollback_target_and_runbook_verified'
];
if(!cloudflare||cloudflare.status!=='BLOCKED')throw new Error('Cloudflare production must remain blocked until live evidence exists');
for(const evidence of requiredDeploymentEvidence){if(!cloudflare.evidence_required.includes(evidence))throw new Error('missing Cloudflare release evidence: '+evidence);}
const blocked=gate.domains.filter(d=>d.status==='BLOCKED');
if(blocked.length<3)throw new Error('gate unexpectedly lost provider blockers');
console.log('OMEGA_PRODUCTION_10_10_EVIDENCE_GATE=PASS');
console.log('BLOCKED_DOMAINS='+blocked.map(d=>d.id).join(','));
