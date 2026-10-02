create or replace function public.omega_elemental_runtime(p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare
 v_seed text:=coalesce(nullif(pg_catalog.btrim(p_payload->>'seed'),''),'OMEGA');
 v_hash bytea; v_num numeric; v_element text; v_mode text; v_iterations integer; v_state bigint; v_total bigint:=0; v_i integer; v_labels text[];
begin
 if p_action not in ('cosmology.read','interpretation.read','simulation.run') then raise exception 'elemental_action_not_allowed'; end if;
 if pg_catalog.length(v_seed)>128 then raise exception 'seed_too_long'; end if;
 v_hash:=pg_catalog.decode(pg_catalog.md5(v_seed),'hex');
 v_num:=(get_byte(v_hash,0)*16777216 + get_byte(v_hash,1)*65536 + get_byte(v_hash,2)*256 + get_byte(v_hash,3));
 v_element:=case mod(v_num::bigint,5) when 0 then 'AETHER' when 1 then 'FIRE' when 2 then 'WATER' when 3 then 'EARTH' else 'AIR' end;
 v_mode:=case mod(v_num::bigint,4) when 0 then 'ORIGIN' when 1 then 'MOTION' when 2 then 'BALANCE' else 'TRANSFORMATION' end;
 if p_action='cosmology.read' then
   return jsonb_build_object('action',p_action,'status','LIVE','classification','DETERMINISTIC_INTERPRETIVE','seed_digest',pg_catalog.md5(v_seed),'element',v_element,'mode',v_mode,'index',mod(v_num::bigint,360)::integer,'provenance',jsonb_build_object('method','MD5-seeded deterministic mapping','external_source',false,'predictive_claim',false));
 elsif p_action='interpretation.read' then
   v_labels:=case v_element when 'AETHER' then array['perspective','integration','context'] when 'FIRE' then array['initiative','energy','change'] when 'WATER' then array['adaptation','reflection','flow'] when 'EARTH' then array['stability','structure','continuity'] else array['communication','movement','connection'] end;
   return jsonb_build_object('action',p_action,'status','LIVE','classification','INTERPRETIVE_CONTENT','seed_digest',pg_catalog.md5(v_seed),'element',v_element,'mode',v_mode,'themes',to_jsonb(v_labels),'disclaimer','Interpretive content for reflection; not scientific, medical, financial, legal, or predictive advice.','provenance',jsonb_build_object('method','deterministic elemental mapping','external_source',false,'predictive_claim',false));
 end if;
 v_iterations:=least(100,greatest(1,coalesce((p_payload->>'iterations')::integer,10)));
 v_state:=mod(v_num::bigint,2147483647);
 for v_i in 1..v_iterations loop v_state:=mod(v_state*1103515245+12345,2147483647); v_total:=v_total+v_state; end loop;
 return jsonb_build_object('action',p_action,'status','LIVE','classification','BOUNDED_SIMULATION','seed_digest',pg_catalog.md5(v_seed),'iterations',v_iterations,'result',mod(v_total,1000000),'state_persistence','DISCARDED','provenance',jsonb_build_object('method','bounded deterministic pseudo-random simulation','external_source',false,'predictive_claim',false));
end $$;