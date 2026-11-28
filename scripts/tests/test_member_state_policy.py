"""Source contract tests for member-state mirror/export privacy boundaries."""

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def object_keys(source, name):
    match = re.search(
        r'\bvar\s+' + re.escape(name) + r'\s*=\s*\{([^}]*)\}',
        source, re.S)
    if not match:
        raise AssertionError('%s map not found' % name)
    return set(re.findall(r'''['"]?([A-Za-z0-9_:-]+)['"]?\s*:''', match.group(1)))


class MemberStatePolicyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.member = (ROOT / 'omega-member-state.js').read_text(encoding='utf-8')
        cls.backup = (ROOT / 'omega-local-backup.js').read_text(encoding='utf-8')
        cls.export = (ROOT / 'omega-export.js').read_text(encoding='utf-8')
        cls.skip = object_keys(cls.member, 'SKIP')
        cls.no_mirror = object_keys(cls.member, 'NO_MIRROR')

    def test_browser_only_ad_impressions_are_excluded_from_mirror_and_exports(self):
        key = 'omega:ad:impressions'
        self.assertIn(key, self.skip)
        self.assertIn('!SKIP[k]', self.member)
        self.assertIn('skip[k]', self.backup)
        self.assertIn('MS.isMemberKey(k)', self.export)

    def test_focus_retry_queue_is_transient_and_excluded_from_mirror_and_exports(self):
        key = 'omega_focus_mirror_queue_v1'
        self.assertIn(key, self.skip)
        self.assertIn('!SKIP[k]', self.member)
        self.assertIn('skip[k]', self.backup)
        self.assertIn('MS.isMemberKey(k)', self.export)

    def test_finance_keys_remain_exportable_but_not_cloud_mirrored(self):
        finance = {
            'omega_wealth_assets', 'omega_wallet', 'omega_treasury_assets',
            'omega_investments', 'omega_revenue', 'omega_expenses',
            'omega_budgets', 'omega_budget_targets',
        }
        self.assertTrue(finance.issubset(self.no_mirror))
        self.assertTrue(finance.isdisjoint(self.skip))
        self.assertIn('!NO_MIRROR[k]', self.member)
        self.assertIn('skip[k]', self.backup)
        self.assertIn('MS.isMemberKey(k)', self.export)


if __name__ == '__main__':
    unittest.main()
