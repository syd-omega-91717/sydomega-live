#!/usr/bin/env python3
"""Advertising submissions and live placement reads must fail honestly."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SOURCE = (ROOT / "advertising.html").read_text(encoding="utf-8")


class AdvertisingTruthBoundaryContract(unittest.TestCase):
    def test_live_placement_errors_are_not_converted_to_empty_or_zero(self):
        self.assertIn("if(r.error)throw r.error;", SOURCE)
        self.assertIn("if(!Array.isArray(r.data))", SOURCE)
        self.assertIn("r.error||!Number.isInteger(r.count)", SOURCE)
        self.assertNotIn("(r.count||0)", SOURCE)
        self.assertIn("PLACEMENTS UNAVAILABLE", SOURCE)
        self.assertIn("data.truth='UNAVAILABLE'", SOURCE)

    def test_ad_submission_is_explicitly_pending_and_never_claims_success_on_error(self):
        self.assertIn("status:'pending'", SOURCE)
        self.assertIn("SUBMISSION SAVED AS PENDING", SOURCE)
        self.assertIn("NO PAYMENT TAKEN", SOURCE)
        self.assertIn("SUBMISSION FAILED · NOT SAVED", SOURCE)
        self.assertNotIn("SUBMISSION RECEIVED. THE ARCHITECT WILL REVIEW WITHIN 48 HOURS.", SOURCE)

    def test_only_https_ad_destinations_are_opened(self):
        self.assertIn("new URL(a.url)", SOURCE)
        self.assertIn("parsedUrl.protocol==='https:'", SOURCE)
        self.assertIn("destination.protocol!=='https:'", SOURCE)

    def test_non_persisted_timeline_control_is_removed(self):
        self.assertNotIn("adv-timeline", SOURCE)
        self.assertIn("PROPOSED PRICING ONLY", SOURCE)


if __name__ == "__main__":
    unittest.main()
