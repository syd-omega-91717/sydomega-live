BEGIN;

CREATE TABLE IF NOT EXISTS public.billing_plans (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT UNIQUE NOT NULL,

    name TEXT NOT NULL,

    description TEXT,

    monthly_price NUMERIC(12,2) DEFAULT 0,

    yearly_price NUMERIC(12,2) DEFAULT 0,

    currency TEXT DEFAULT 'USD',

    active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.billing_features (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code TEXT UNIQUE NOT NULL,

    name TEXT NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

CREATE TABLE IF NOT EXISTS public.billing_plan_features (

    plan_id UUID REFERENCES public.billing_plans(id) ON DELETE CASCADE,

    feature_id UUID REFERENCES public.billing_features(id) ON DELETE CASCADE,

    feature_limit INTEGER,

    PRIMARY KEY(plan_id,feature_id)

);

CREATE TABLE IF NOT EXISTS public.billing_invoices (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    profile_id UUID REFERENCES public.profiles(id),

    subscription_id UUID REFERENCES public.subscriptions(id),

    invoice_number TEXT UNIQUE,

    subtotal NUMERIC,

    tax NUMERIC DEFAULT 0,

    total NUMERIC,

    currency TEXT,

    status TEXT DEFAULT 'pending',

    due_date DATE,

    paid_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now()

);

COMMIT;
