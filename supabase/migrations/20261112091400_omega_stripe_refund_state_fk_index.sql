-- Cover the second foreign key on the refund state row.
-- The table is currently empty; the index protects future delete/update checks
-- on omega_ledger_transactions as refund state begins to accumulate.
begin;

create index if not exists stripe_refund_state_last_reversal_transaction_idx
  on omega_private.stripe_refund_state(last_reversal_transaction_id);

commit;
