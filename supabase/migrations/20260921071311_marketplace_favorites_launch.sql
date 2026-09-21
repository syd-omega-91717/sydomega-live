-- Omega SYD OMEGA 91717
-- Activates marketplace_favorites (save-for-later) -- the only one of the
-- four newly-captured tables that needs no other decision first.
-- marketplace_categories stays dormant: activating it usefully needs a
-- category_id column on marketplace_listings and a taxonomy design
-- decision, a real separate follow-up. marketplace_orders stays dormant:
-- it is the purchase/payment side of the SAME dormant Omega-token economy
-- marketplace.html's own SCIENCE tab already documents as off behind
-- platform_settings.tokens_enabled (currently false) -- activating it
-- would be the token-economy decision, already made this session to stay
-- dormant. marketplace_reviews stays dormant: without an orders/purchase
-- flow there is no verified-buyer signal to gate a review on, which is a
-- trust-model decision, not this slice's to make silently.
--
-- Own-row only, no public "N people favorited this" counter for v1 --
-- confirmed live via impersonation that a second member cannot see
-- another member's favorite row.

drop policy if exists omega_deny_by_default on public.marketplace_favorites;

create policy marketplace_favorites_own on public.marketplace_favorites
  for all
  using ((select auth.uid()) = profile_id or private.is_platform_owner())
  with check ((select auth.uid()) = profile_id or private.is_platform_owner());

grant select, insert, delete on public.marketplace_favorites to authenticated;
