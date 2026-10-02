begin;

create index if not exists omega_achievement_verifications_user_achievement_idx on public.omega_achievement_verifications(user_achievement_id);
create index if not exists omega_agent_task_events_task_idx on public.omega_agent_task_events(task_id);
create index if not exists omega_agent_tasks_agent_idx on public.omega_agent_tasks(agent_id);
create index if not exists omega_agent_tasks_approved_by_idx on public.omega_agent_tasks(approved_by);
create index if not exists omega_agent_tasks_user_idx on public.omega_agent_tasks(user_id);
create index if not exists omega_certificates_achievement_idx on public.omega_certificates(achievement_id);
create index if not exists omega_certificates_user_idx on public.omega_certificates(user_id);
create index if not exists omega_entitlements_source_transaction_idx on public.omega_entitlements(source_transaction_id);
create index if not exists omega_fraud_signals_referral_code_idx on public.omega_fraud_signals(referral_code);
create index if not exists omega_ledger_accounts_owner_user_idx on public.omega_ledger_accounts(owner_user_id);
create index if not exists omega_payment_events_transaction_idx on public.omega_payment_events(transaction_id);
create index if not exists omega_payment_reconciliation_transaction_idx on public.omega_payment_reconciliation(internal_transaction_id);
create index if not exists omega_referral_attributions_referral_code_idx on public.omega_referral_attributions(referral_code);
create index if not exists omega_referral_attributions_source_click_idx on public.omega_referral_attributions(source_click_id);
create index if not exists omega_referral_rewards_ledger_transaction_idx on public.omega_referral_rewards(ledger_transaction_id);
create index if not exists omega_referral_rewards_referred_user_idx on public.omega_referral_rewards(referred_user_id);
create index if not exists omega_referral_rewards_referrer_user_idx on public.omega_referral_rewards(referrer_user_id);
create index if not exists omega_service_orders_entitlement_idx on public.omega_service_orders(entitlement_id);
create index if not exists omega_service_orders_service_idx on public.omega_service_orders(service_id);
create index if not exists omega_services_capability_idx on public.omega_services(capability_id);
create index if not exists omega_user_achievements_user_idx on public.omega_user_achievements(user_id);
create index if not exists omega_user_achievements_verified_by_idx on public.omega_user_achievements(verified_by);

drop policy if exists omega_platform_events_select_own on public.omega_platform_events;
drop policy if exists omega_deny_by_default on public.omega_platform_evidence;

commit;
