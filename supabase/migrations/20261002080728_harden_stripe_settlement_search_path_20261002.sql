-- SYD OMEGA 91717
-- Pin the Stripe settlement SECURITY DEFINER function to an empty search path.
alter function omega_private.record_stripe_payment(
  text,text,uuid,bigint,text,text,text,jsonb
) set search_path='';
