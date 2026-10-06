
drop view if exists public.omega_member_life_surface;

create view public.omega_member_life_surface
with (security_invoker = true)
as
select
  p.id as user_id,
  jsonb_build_object(
    'display_name', p.display_name,
    'email', p.email,
    'country', p.country,
    'sign', p.sign,
    'element', p.element,
    'agent', p.agent,
    'profession', p.profession,
    'bio', p.bio,
    'membership_tier', p.membership_tier,
    'subscription_status', p.subscription_status,
    'is_public', p.is_public,
    'created_at', p.created_at,
    'updated_at', p.updated_at
  ) as identity,
  coalesce(
    (select to_jsonb(mp) from public.member_preferences mp where mp.user_id=p.id),
    jsonb_build_object('status','UNAVAILABLE','reason','preferences record not created')
  ) as preferences,
  jsonb_build_object(
    'count', (
      select count(*) from public.projects pr
      where pr.owner_id=p.id
         or exists (
           select 1 from public.project_members pm
           where pm.project_id=pr.id and pm.profile_id=p.id
         )
    ),
    'active_count', (
      select count(*) from public.projects pr
      where (pr.owner_id=p.id or exists (
        select 1 from public.project_members pm
        where pm.project_id=pr.id and pm.profile_id=p.id
      )) and coalesce(lower(pr.status),'') not in ('completed','archived','cancelled')
    ),
    'items', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.updated_at desc)
      from (
        select pr.id,pr.name,pr.slug,pr.description,pr.status,pr.category,pr.priority,pr.start_date,pr.due_date,pr.updated_at
        from public.projects pr
        where pr.owner_id=p.id
           or exists (
             select 1 from public.project_members pm
             where pm.project_id=pr.id and pm.profile_id=p.id
           )
        order by pr.updated_at desc
        limit 25
      ) x
    ), '[]'::jsonb)
  ) as projects,
  jsonb_build_object(
    'defined', (select count(*) from public.omega_missions m where m.status='active'),
    'owned_state_count', (select count(*) from public.omega_member_mission_state ms where ms.user_id=p.id),
    'active_count', (select count(*) from public.omega_member_mission_state ms where ms.user_id=p.id and lower(ms.status) in ('active','in_progress')),
    'completed_count', (select count(*) from public.omega_member_mission_state ms where ms.user_id=p.id and lower(ms.status)='completed')
  ) as missions,
  jsonb_build_object(
    'defined', (select count(*) from public.omega_quests q where q.status='active'),
    'owned_state_count', (select count(*) from public.omega_member_quest_state qs where qs.user_id=p.id),
    'member_authored_count', (select count(*) from public.member_quests q where q.user_id=p.id),
    'completed_count', (select count(*) from public.member_quests q where q.user_id=p.id and q.status='completed')
  ) as quests,
  jsonb_build_object(
    'completion_count', (select count(*) from public.task_completions tc where tc.user_id=p.id),
    'points_earned', coalesce((select sum(tc.points_earned) from public.task_completions tc where tc.user_id=p.id),0),
    'recent', coalesce((
      select jsonb_agg(to_jsonb(x) order by x.completed_at desc)
      from (
        select tc.id,tc.task_name,tc.task_type,tc.axis_type,tc.description,tc.points_earned,tc.completed_at
        from public.task_completions tc
        where tc.user_id=p.id
        order by tc.completed_at desc
        limit 25
      ) x
    ),'[]'::jsonb)
  ) as tasks,
  jsonb_build_object(
    'memory_count',(select count(*) from public.ai_memory am where am.user_id=p.id),
    'embedding_count',(select count(*) from public.ai_memory_embeddings ae where ae.user_id=p.id),
    'ready_embedding_count',(select count(*) from public.ai_memory_embeddings ae where ae.user_id=p.id and ae.status='ready')
  ) as ai_memory,
  jsonb_build_object(
    'notification_count',(select count(*) from public.notifications n where n.user_id=p.id),
    'unread_count',(select count(*) from public.notifications n where n.user_id=p.id and coalesce(n.is_read,false)=false),
    'queued_count',(select count(*) from public.notification_queue nq where nq.profile_id=p.id and lower(coalesce(nq.status,'')) not in ('sent','delivered','failed','cancelled'))
  ) as notifications,
  jsonb_build_object(
    'event_count',(select count(*) from public.omega_platform_events e where e.actor_user_id=p.id),
    'evidence_count',(select count(*) from public.omega_platform_evidence e where e.owner_user_id=p.id),
    'graph_evidence_count',(select count(*) from public.graph_evidence ge where ge.user_id=p.id),
    'recent_events',coalesce((
      select jsonb_agg(to_jsonb(x) order by x.created_at desc)
      from (
        select e.id,e.event_type,e.route,e.created_at,e.metadata
        from public.omega_platform_events e
        where e.actor_user_id=p.id
        order by e.created_at desc
        limit 25
      ) x
    ),'[]'::jsonb)
  ) as activity,
  jsonb_build_object(
    'evolution_event_count',(select count(*) from public.evolution_events ev where ev.user_id=p.id),
    'domain_mastery_count',(select count(*) from public.domain_mastery dm where dm.user_id=p.id),
    'quest_completion_count',(select count(*) from public.quest_completions qc where qc.user_id=p.id),
    'leaderboard_entry_count',(select count(*) from public.leaderboard_entries le where le.user_id=p.id)
  ) as progression,
  jsonb_build_object(
    'skills','UNAVAILABLE',
    'goals','UNAVAILABLE',
    'ideas','UNAVAILABLE',
    'credentials','UNAVAILABLE',
    'achievement_definitions','UNAVAILABLE',
    'user_achievements','UNAVAILABLE',
    'reason','No authoritative production table exists for these member concepts in the current schema; no synthetic records are created.'
  ) as unavailable_domains,
  'LIVE'::text as truth_state,
  now() as observed_at
from public.profiles p
where p.id=(select auth.uid());

comment on view public.omega_member_life_surface is
'Canonical Ω LIFE member read model. Read-only projection over existing authoritative member tables; unavailable domains are explicit and never fabricated.';

revoke all on public.omega_member_life_surface from public, anon;
grant select on public.omega_member_life_surface to authenticated;
