-- Omega SYD OMEGA 91717
-- Activates a v1 slice of the dormant knowledge-base scaffold: personal
-- notes, migrating notes.html off localStorage (omega_notes) the same way
-- projects.html was migrated off localStorage earlier this session.
--
-- Only knowledge_documents is activated. knowledge_spaces (folders/
-- notebooks) stays dormant -- notes.html has no folder concept today, and
-- space_id is nullable, so a personal note with no space is a real,
-- correct row, not a workaround. knowledge_attachments stays dormant --
-- notes.html has no file-attachment feature to migrate. knowledge_nodes/
-- knowledge_edges (a generic graph, already declared elsewhere) and every
-- ai_workspace_*/ai_documents/omega_knowledge_* table are untouched -- an
-- actual AI/RAG workspace is a materially different, larger feature and a
-- separate decision, not implied by migrating a personal notes page.
--
-- category/tags/pinned are added as real columns: notes.html's UX depends
-- on all three (10 categories, a tag cloud, pin-to-top) and none exists on
-- the live table, the same shape of gap category/priority were on
-- projects.

alter table public.knowledge_documents add column if not exists category text;
alter table public.knowledge_documents add column if not exists tags text[] default '{}';
alter table public.knowledge_documents add column if not exists pinned boolean default false;

drop policy if exists omega_deny_by_default on public.knowledge_documents;

create policy knowledge_documents_author_all on public.knowledge_documents
  for all
  using ((select auth.uid()) = author_id or private.is_platform_owner())
  with check ((select auth.uid()) = author_id or private.is_platform_owner());

grant select, insert, update, delete on public.knowledge_documents to authenticated;
