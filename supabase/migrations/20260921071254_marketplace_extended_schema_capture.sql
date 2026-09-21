-- Omega SYD OMEGA 91717
-- Backfills real source control for marketplace_categories/favorites/
-- orders/reviews -- live since before this repo's SQL history, never
-- declared as a CREATE TABLE anywhere in this repo (marketplace_listings
-- itself is declared multiple times; these four never were). RLS-enabled
-- with no grant to any role, except marketplace_listings' own 4 real
-- policies, which are untouched here. CREATE TABLE IF NOT EXISTS is a
-- no-op against the live database; every column/type/default/FK below is
-- copied from a live information_schema.columns + pg_constraint query.

create table if not exists public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz default now(),
  constraint marketplace_categories_slug_key unique (slug)
);

create table if not exists public.marketplace_favorites (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  constraint marketplace_favorites_listing_id_profile_id_key unique (listing_id, profile_id)
);

create table if not exists public.marketplace_orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id),
  buyer_id uuid references public.profiles(id),
  seller_id uuid references public.profiles(id),
  quantity integer default 1,
  total_price numeric,
  payment_status text default 'pending',
  order_status text default 'pending',
  created_at timestamptz default now()
);

create table if not exists public.marketplace_reviews (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.marketplace_listings(id) on delete cascade,
  reviewer_id uuid references public.profiles(id),
  rating integer,
  review text,
  created_at timestamptz default now(),
  constraint marketplace_reviews_rating_check check (rating >= 1 and rating <= 5)
);

alter table public.marketplace_categories enable row level security;
alter table public.marketplace_favorites enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_reviews enable row level security;
