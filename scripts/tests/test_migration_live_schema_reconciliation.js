#!/usr/bin/env node
const fs=require('fs');
const p='supabase/migrations/20261009020000_migration_live_schema_reconciliation_20261009.sql';
const sql=fs.readFileSync(p,'utf8');
const required=[
  'alter column capability_id set not null',
  'alter column evidence_level set not null',
  'alter column check_name set not null',
  'alter column result set not null',
  'create table if not exists public.notification_templates',
  'notification_queue_template_id_fkey',
  'create policy omega_deny_by_default',
  'drop policy if exists quest_completions_member_insert',
  'drop policy if exists quest_completions_member_update',
  'drop policy if exists domain_mastery_member_update',
  'drop policy if exists leaderboard_member_update',
  'drop policy if exists covenant_member_update'
];
for(const x of required) if(!sql.includes(x)) throw new Error('missing reconciliation clause: '+x);
console.log('OMEGA_MIGRATION_LIVE_SCHEMA_RECONCILIATION=PASS');
