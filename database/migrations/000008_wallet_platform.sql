BEGIN;

-- ==========================================================
-- WALLET ACCOUNTS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.wallet_accounts (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    currency TEXT NOT NULL DEFAULT 'OMEGA',

    balance NUMERIC(20,8) NOT NULL DEFAULT 0,

    locked_balance NUMERIC(20,8) NOT NULL DEFAULT 0,

    status TEXT NOT NULL DEFAULT 'active',

    created_at TIMESTAMPTZ DEFAULT now(),

    updated_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(profile_id,currency)

);

-- ==========================================================
-- WALLET TRANSACTIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.wallet_transactions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    wallet_id UUID REFERENCES public.wallet_accounts(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id),

    reference TEXT UNIQUE,

    transaction_type TEXT,

    amount NUMERIC(20,8),

    balance_before NUMERIC(20,8),

    balance_after NUMERIC(20,8),

    status TEXT DEFAULT 'completed',

    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- SUBSCRIPTIONS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    plan_name TEXT,

    billing_cycle TEXT,

    amount NUMERIC,

    status TEXT DEFAULT 'active',

    starts_at TIMESTAMPTZ,

    expires_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- PAYMENTS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.payments (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    transaction_id UUID REFERENCES public.wallet_transactions(id),

    provider TEXT,

    provider_reference TEXT,

    amount NUMERIC,

    currency TEXT,

    status TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

COMMIT;
