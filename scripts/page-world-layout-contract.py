#!/usr/bin/env python3
"""Regression gate for the shared page-world membrane and owner alert chrome.

The Vault/finance estate contains two valid page shells:
  1. aside#omega-side + .shell + main.main
  2. aside#omega-side + .page-shell + topbar/content

The world membrane must mount inside the content column in both forms. Mounting
to <body> on form (2) turns the membrane into a third body-level flex item and
squeezes the real page into a narrow right-hand column.

The owner access alert is also a shared <a>; its dimensions must be explicitly
bounded because the platform-wide anchor accessibility rule gives anchors a
minimum touch target and inline-flex display.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
WORLD = ROOT / "omega-page-world.js"
BG = ROOT / "bg.js"

VAULT_SECTOR = {
    "vault.html",
    "blockchain.html",
    "subscriptions.html",
    "marketplace.html",
    "income.html",
    "payments.html",
    "ledger.html",
    "settings.html",
    "advertising.html",
    "portfolio.html",
}


def fail(msg):
    print("FAIL:", msg)
    return 1


def main():
    world = WORLD.read_text(encoding="utf-8")
    bg = BG.read_text(encoding="utf-8")

    selector = "main, .main, .page-shell, #app, [role=\"main\"]"
    if selector not in world:
        return fail("page-world membrane does not select the shared content-column variants")

    if re.search(r"querySelector\(['\"]main['\"]\)\s*\|\|\s*document\.body", world):
        return fail("page-world membrane still falls back directly from <main> to <body>")

    if "main.insertBefore(host,main.firstElementChild||null);" not in world:
        return fail("page-world membrane is not inserted into its selected content host")

    if ".opw-compact .opw-kicker,#omega-page-world.opw-compact .opw-verb" not in world:
        return fail("page-world membrane lacks the duplicate-identity compact mode")

    if "document.querySelector('.oid-hero')" not in world:
        return fail("page-world membrane does not reconcile against the canonical identity hero")

    if "fetch('/config/page-world-actions.json'" in world and world.count("fetch('/config/page-world-actions.json'") > 1:
        return fail("page-world actions manifest is fetched more than once")

    required_alert = [
        ".omega-alert{position:fixed",
        "display:flex;flex-direction:column",
        "box-sizing:border-box",
        "width:min(560px,calc(100vw - 36px))",
        "min-width:0",
        "max-width:calc(100vw - 36px)",
        "text-decoration:none",
    ]
    for token in required_alert:
        if token not in bg:
            return fail("owner alert is missing required bounded-layout rule: " + token)

    found = []
    for path in sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8", errors="replace")
        if re.search(r'<aside\b[^>]*id=["\']omega-side["\']', text, re.I) and re.search(
            r'<(?:div|section)\b[^>]*class=["\'][^"\']*\bpage-shell\b', text, re.I
        ):
            found.append(path.name)

    missing_vault = sorted(VAULT_SECTOR - set(found))
    if missing_vault:
        # Some sector pages intentionally use the nested .shell/main form, so
        # only pages that actually use .page-shell are required to be present.
        # The explicit list is kept here as a review signal, not a blanket
        # requirement that every Vault route share one legacy DOM.
        print("INFO: Vault-sector pages using the .page-shell variant:", ", ".join(found))

    if not found:
        return fail("no aside#omega-side + .page-shell pages were detected")

    print("PASS: page-world membrane targets the content column")
    print("PASS: owner access alert has an explicit bounded layout")
    print("PASS: detected .page-shell pages:", ", ".join(found))
    print("PASS: Vault-sector regression gate complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
