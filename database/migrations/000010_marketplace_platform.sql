BEGIN;

-- ==========================================================
-- MARKETPLACE CATEGORIES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.marketplace_categories (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,

    slug TEXT UNIQUE NOT NULL,

    description TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- ORDERS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.marketplace_orders (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    listing_id UUID REFERENCES public.marketplace_listings(id),

    buyer_id UUID REFERENCES public.profiles(id),

    seller_id UUID REFERENCES public.profiles(id),

    quantity INTEGER DEFAULT 1,

    total_price NUMERIC,

    payment_status TEXT DEFAULT 'pending',

    order_status TEXT DEFAULT 'pending',

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- REVIEWS
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.marketplace_reviews (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,

    reviewer_id UUID REFERENCES public.profiles(id),

    rating INTEGER CHECK(rating BETWEEN 1 AND 5),

    review TEXT,

    created_at TIMESTAMPTZ DEFAULT now()

);

-- ==========================================================
-- FAVORITES
-- ==========================================================

CREATE TABLE IF NOT EXISTS public.marketplace_favorites (

    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,

    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

    created_at TIMESTAMPTZ DEFAULT now(),

    UNIQUE(listing_id,profile_id)

);

COMMIT;
