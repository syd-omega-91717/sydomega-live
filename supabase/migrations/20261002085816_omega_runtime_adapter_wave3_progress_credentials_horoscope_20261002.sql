begin;

create index if not exists task_completions_user_created_idx on public.task_completions(user_id,created_at desc);
create index if not exists graph_evidence_user_timestamp_idx on public.graph_evidence(user_id,extraction_timestamp desc);
create index if not exists omega_audit_log_actor_created_idx on public.omega_audit_log(actor_user_id,created_at desc);

update public.omega_module_runtime_actions set lifecycle='INTEGRATED'
where (module_id,action_name) in (
 ('PROGRESS','tasks.read'),('PROGRESS','verification.read'),
 ('CREDENTIALS','passport.read'),('CREDENTIALS','verify.read'),
 ('HOROSCOPE','reading.generate'),('HOROSCOPE','provenance.read'),
 ('INTELLIGENCE','retrieval.read'),('HIERARCHY','governance.read')
);

commit;
