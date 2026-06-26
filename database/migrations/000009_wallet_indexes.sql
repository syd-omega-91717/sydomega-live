CREATE INDEX IF NOT EXISTS idx_wallet_accounts_profile
ON public.wallet_accounts(profile_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet
ON public.wallet_transactions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_profile
ON public.wallet_transactions(profile_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_profile
ON public.subscriptions(profile_id);

CREATE INDEX IF NOT EXISTS idx_payments_profile
ON public.payments(profile_id);
