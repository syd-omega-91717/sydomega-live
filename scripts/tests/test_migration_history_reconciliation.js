#!/usr/bin/env node
const fs=require('fs');
const m=JSON.parse(fs.readFileSync('supabase/remote-migrations.json','utf8'));
if(m.remoteMigrationCount!==373) throw new Error('expected 373 migration versions');
if(m.latestRemoteMigration!=='20261008032846') throw new Error('unexpected latest migration');
for(const v of ['20261006193000','20261006195600','20261006201000','20261006203000','20261007001000','20261007005000','20261007120000','20261008032308','20261008032846']){
 if(!m.versions.includes(v)) throw new Error('missing migration version '+v);
}
for(const p of [
 'supabase/migrations/20261008032308_omega_knowledge_hybrid_retrieval_20261008.sql',
 'supabase/migrations/20261008032846_omega_knowledge_embedding_worker_20261008.sql'
]) if(!fs.existsSync(p)) throw new Error('canonical knowledge migration missing: '+p);
for(const p of [
 'supabase/migrations/20261008001000_omega_knowledge_hybrid_retrieval_20261008.sql',
 'supabase/migrations/20261008100000_omega_knowledge_embedding_worker_20261008.sql'
]) if(fs.existsSync(p)) throw new Error('misnumbered knowledge migration remains: '+p);
console.log('OMEGA_MIGRATION_HISTORY_RECONCILIATION=PASS');
