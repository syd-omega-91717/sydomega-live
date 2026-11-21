#!/usr/bin/env python3
"""Guard the dormant KYC product contract against future-state claims."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
PROFILE = (ROOT / "profile.html").read_text(encoding="utf-8")
KYC = (ROOT / "kyc.html").read_text(encoding="utf-8")


class DormantKycCopyContract(unittest.TestCase):
    def test_profile_does_not_claim_unimplemented_verification_stages(self):
        self.assertIn("No liveness-check provider or active workflow is connected.", PROFILE)
        self.assertIn("Proof-of-address intake is not implemented", PROFILE)
        self.assertIn("No automated compliance engine or review-time commitment is active.", PROFILE)

    def test_kyc_does_not_claim_economic_unlocks(self):
        self.assertIn("A KYC status does not activate payments, tokens, marketplace access", PROFILE)
        self.assertIn("No economic feature is activated by this status.", PROFILE)
        self.assertIn("No HSM biometric, succession, or inheritance workflow is implemented.", PROFILE)

    def test_kyc_page_does_not_claim_provider_or_aml_capability(self):
        self.assertIn("No regulated third-party verification provider is connected.", KYC)
        self.assertIn("AML and sanctions screening are not implemented.", KYC)
        self.assertIn("No Gate-based privilege or revenue-participation entitlement is implemented.", KYC)


if __name__ == "__main__":
    unittest.main()
