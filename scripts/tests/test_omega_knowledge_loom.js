#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert');
// The view's live definition is the last migration that replaces it.
const migration=fs.readFileSync('supabase/migrations/20261006103210_omega_knowledge_loom_canonical_evidence_reconciliation_20261006.sql','utf8');
const js=fs.readFileSync('omega-knowledge-loom.js','utf8');
const html=fs.readFileSync('knowledge-loom.html','utf8');
const css=fs.readFileSync('omega-knowledge-loom.css','utf8');
assert(migration.includes('create or replace view public.omega_member_knowledge_loom'));
assert(migration.includes('security_invoker = true'));
assert(/where d\.author_id\s*=\s*\(select auth\.uid\(\)\)/.test(migration));
assert(/where m\.user_id\s*=\s*\(select auth\.uid\(\)\)/.test(migration));
assert(/where g\.user_id\s*=\s*\(select auth\.uid\(\)\)/.test(migration));
assert(/where e\.owner_user_id\s*=\s*\(select auth\.uid\(\)\)/.test(migration));
['knowledge_document','ai_memory','graph_evidence','platform_evidence'].forEach(k=>assert(migration.includes("'"+k+"'")));
assert(!js.includes('innerHTML'));
assert(js.includes("from('omega_member_knowledge_loom')"));
assert(js.includes('source_id,source_kind,title,excerpt,truth_state'));
assert(html.includes('id="loom-grid"'));
assert(html.includes('omega-knowledge-loom.js'));
assert(css.includes('.loom-card'));
console.log('OMEGA KNOWLEDGE LOOM CONTRACT: PASS');
