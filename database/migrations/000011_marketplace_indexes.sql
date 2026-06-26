CREATE INDEX IF NOT EXISTS idx_market_orders_buyer
ON public.marketplace_orders(buyer_id);

CREATE INDEX IF NOT EXISTS idx_market_orders_seller
ON public.marketplace_orders(seller_id);

CREATE INDEX IF NOT EXISTS idx_market_reviews_listing
ON public.marketplace_reviews(listing_id);

CREATE INDEX IF NOT EXISTS idx_market_favorites_profile
ON public.marketplace_favorites(profile_id);
