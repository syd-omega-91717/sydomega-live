begin;

-- Canonical Stripe subscription event entrypoint:
-- public.apply_subscription_event(text,text,uuid,text,text,timestamptz,text).
-- Remove the legacy uuid-first overload so the production RPC surface is
-- deterministic and matches the repository's canonical Stripe contract.
drop function if exists public.apply_subscription_event(uuid,text,text,timestamptz,text,text,text);

commit;
