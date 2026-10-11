begin;
create index if not exists omega_knowledge_documents_created_by_idx on public.omega_knowledge_documents(created_by);
commit;
