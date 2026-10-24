#!/usr/bin/env node
const fs=require('fs');
const m=JSON.parse(fs.readFileSync('supabase/remote-migrations.json','utf8'));

if(!Array.isArray(m.versions)||!Array.isArray(m.migrations)) {
  throw new Error('migration snapshot must expose ordered versions and migration records as arrays');
}
if(m.remoteMigrationCount!==m.versions.length) {
  throw new Error('remote migration count must equal the versions array length');
}
if(m.migrations.length!==m.versions.length) {
  throw new Error('migration record count must equal the versions array length');
}
if(new Set(m.versions).size!==m.versions.length) {
  throw new Error('duplicate migration version in snapshot');
}
if(m.latestRemoteMigration!==m.versions[m.versions.length-1]) {
  throw new Error('latest migration must match the final provider-recorded version');
}
for(let i=0;i<m.versions.length;i++) {
  if(String(m.migrations[i]?.version)!==String(m.versions[i])) {
    throw new Error('migration record order/version mismatch at index '+i);
  }
  if(typeof m.migrations[i]?.name!=='string'||!m.migrations[i].name) {
    throw new Error('migration record missing name at index '+i);
  }
}
for(const v of [
  '20261006193000','20261006195600','20261006201000','20261006203000',
  '20261007001000','20261007005000','20261007120000','20261008032308',
  '20261008032846','20261016193700','20261016194804','20261017110604'
]) {
  if(!m.versions.includes(v)) throw new Error('missing migration version '+v);
}
for(const p of [
  'supabase/migrations/20261008032308_omega_knowledge_hybrid_retrieval_20261008.sql',
  'supabase/migrations/20261008032846_omega_knowledge_embedding_worker_20261008.sql',
  'supabase/migrations/20261016193700_progression_rpc_guardrails_20261016.sql',
  'supabase/migrations/20261016194804_progression_rpc_guardrails_20261016.sql'
]) if(!fs.existsSync(p)) throw new Error('canonical migration missing: '+p);
for(const p of [
  'supabase/migrations/20261008001000_omega_knowledge_hybrid_retrieval_20261008.sql',
  'supabase/migrations/20261008100000_omega_knowledge_embedding_worker_20261008.sql'
]) if(fs.existsSync(p)) throw new Error('misnumbered knowledge migration remains: '+p);
console.log('OMEGA_MIGRATION_HISTORY_RECONCILIATION=PASS');
