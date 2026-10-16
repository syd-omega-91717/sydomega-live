#!/usr/bin/env python3
"""Fail closed if marketplace listing paths or unpublished rows become public again."""

from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "supabase/migrations/20261016172500_marketplace_asset_path_isolation_20261016.sql"
PAGE = ROOT / "marketplace.html"


def main() -> int:
    errors = []
    if not MIGRATION.is_file() or not PAGE.is_file():
        print("MARKETPLACE ACCESS CONTRACT: FAIL")
        print(" - required migration or marketplace.html is missing")
        return 1

    sql = MIGRATION.read_text(encoding="utf-8").lower()
    page = PAGE.read_text(encoding="utf-8")
    page_lower = page.lower()

    select_policy = re.search(
        r'create\s+policy\s+marketplace_listings_select\b(.*?);',
        sql,
        re.S,
    )
    checks = [
        ("server-only asset table", "create table omega_private.marketplace_listing_assets" in sql),
        ("private asset table has RLS", "alter table omega_private.marketplace_listing_assets enable row level security" in sql),
        ("asset foreign key is deferred for the before-row trigger", "deferrable initially deferred" in sql),
        ("private asset table is not granted to API roles", "revoke all on table omega_private.marketplace_listing_assets from public, anon, authenticated, service_role" in sql),
        ("asset paths are seller-prefix validated", "path_value !~ ('^' || new.seller_id::text || '/[a-za-z0-9._-]+$')" in sql),
        ("public listing path is cleared", "new.file_path := null;" in sql),
        ("legacy public paths are backfilled then cleared", "update public.marketplace_listings\nset file_path = null" in sql),
        ("inactive listing rows are not broadly visible", bool(select_policy) and "status = 'active'" in select_policy.group(1) and "seller_id = (select auth.uid())" in select_policy.group(1) and "private.is_platform_owner()" in select_policy.group(1) and "auth.role()" not in select_policy.group(1)),
        ("member read model counts own listing IDs", "count(l.id)" in sql and "marketplace_listing_count" in sql),
        ("platform count is active inventory only", "count(id) from public.marketplace_listings where status='active'" in sql),
        ("public listing query uses an explicit field allowlist", "from('marketplace_listings').select('id,seller_id,title,kind,price_omega,description,status,created_at,user_id')" in page),
        ("seller listing query uses an explicit field allowlist", page.count("from('marketplace_listings').select('id,seller_id,title,kind,price_omega,description,status,created_at,user_id')") >= 2),
        ("favorite relation uses an explicit field allowlist", "marketplace_listings(id,seller_id,title,kind,price_omega,description,status,created_at,user_id)" in page),
        ("no wildcard listing selects remain", not re.search(r"from\(['\"]marketplace_listings['\"]\)\.select\(['\"]\*['\"]\)", page) and "marketplace_listings(*)" not in page),
        ("copy does not claim purchases or delivery are live", "purchase-gated signed delivery is not implemented" in page_lower and "sale-related xp is planned, not available" in page_lower),
        ("tier restriction is not falsely described as server-enforced", "not enforced server-side yet" in page_lower),
    ]

    for label, ok in checks:
        if not ok:
            errors.append(label)

    if errors:
        print("MARKETPLACE ACCESS CONTRACT: FAIL")
        for error in errors:
            print(" - " + error)
        return 1

    print(f"MARKETPLACE ACCESS CONTRACT: PASS ({len(checks)} invariants)")
    print("asset_path=server_only")
    print("listing_visibility=active_or_seller_or_platform_owner")
    print("purchase_delivery=NOT_IMPLEMENTED")
    print("tier_authorization=NOT_SERVER_ENFORCED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
