-- ============================================================================
-- SYD OMEGA 91717 -- COMMISSION CONTRACTS (contracts.html backend, M-contracts)
-- A member drafts a member-to-trade contract; the Order's 9.17% commission is
-- SEALED server-side (recomputed by a trigger, so it cannot be tampered with in
-- the browser) and a sovereign reference is recorded. Member sees own; owner
-- reviews all. Matches contracts.html's insert to 'commission_contracts'.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.commission_contracts (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid NOT NULL DEFAULT auth.uid(),
  reference               text,
  counterparty            text,
  scope                   text,
  deal_value              numeric NOT NULL DEFAULT 0,
  commission_rate         numeric NOT NULL DEFAULT 9.17,
  commission_value        numeric NOT NULL DEFAULT 0,
  terms                   text,
  confidentiality_accepted boolean NOT NULL DEFAULT false,
  status                  text NOT NULL DEFAULT 'submitted',  -- submitted|reviewing|sealed|rejected
  created_at              timestamptz NOT NULL DEFAULT now()
);
-- self-heal older versions
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS counterparty text;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS scope text;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS deal_value numeric NOT NULL DEFAULT 0;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS commission_rate numeric NOT NULL DEFAULT 9.17;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS commission_value numeric NOT NULL DEFAULT 0;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS terms text;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS confidentiality_accepted boolean NOT NULL DEFAULT false;
ALTER TABLE public.commission_contracts ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';
ALTER TABLE public.commission_contracts ENABLE ROW LEVEL SECURITY;

-- SEAL the commission at 9.17% server-side (cannot be tampered client-side) ---
CREATE OR REPLACE FUNCTION public.seal_commission()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.commission_rate  := 9.17;
  NEW.commission_value := round(COALESCE(NEW.deal_value,0) * 0.0917, 2);
  IF NEW.reference IS NULL OR length(trim(NEW.reference))=0 THEN
    NEW.reference := 'OMEGA-' || to_char(now(),'YYYYMMDD') || '-' || substr(gen_random_uuid()::text,1,6);
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_seal_commission ON public.commission_contracts;
CREATE TRIGGER trg_seal_commission BEFORE INSERT OR UPDATE ON public.commission_contracts
  FOR EACH ROW EXECUTE FUNCTION public.seal_commission();

DROP POLICY IF EXISTS cc_insert ON public.commission_contracts;
CREATE POLICY cc_insert ON public.commission_contracts FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS cc_select ON public.commission_contracts;
CREATE POLICY cc_select ON public.commission_contracts FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

-- owner reviews / seals / rejects -------------------------------------------
CREATE OR REPLACE FUNCTION public.set_contract_status(p_id uuid, p_status text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','owner_only'); END IF;
  IF p_status NOT IN ('submitted','reviewing','sealed','rejected') THEN
    RETURN jsonb_build_object('ok',false,'error','bad_status'); END IF;
  UPDATE public.commission_contracts SET status = p_status WHERE id = p_id;
  RETURN jsonb_build_object('ok',true,'id',p_id,'status',p_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.review_contracts()
RETURNS SETOF public.commission_contracts LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT * FROM public.commission_contracts WHERE public.is_platform_owner()
  ORDER BY (status='submitted') DESC, created_at DESC;
$$;

GRANT SELECT, INSERT ON public.commission_contracts TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_contract_status(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_contracts() TO authenticated;

COMMIT;
