"""scripts/panel-eligibility.py: classification of census records, and the static check with planted violations."""
import copy
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('panel_eligibility', ROOT / 'scripts' / 'panel-eligibility.py')
pe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pe)


def rec(page, text=500, errors=0, **kw):
    r = {'page': page + '.html', 'text': text, 'errors': errors, 'failed': False, 'navigated': '/life.html'}
    r.update(kw)
    return r


def good_registry(pages=('alpha', 'beta')):
    entries = {k: {'status': 'hostable', 'measured': {'text': 500, 'errors': 0}} for k in pages}
    return {'schema': 1, 'generated_from': {'census_date': '2026-11-21'}, 'counts': pe.count(entries), 'pages': entries}


class ClassifyTests(unittest.TestCase):
    def status(self, **kw):
        return pe.classify(rec(kw.pop('page', 'water'), **kw))[0]

    def test_clean_page_is_hostable(self):
        self.assertEqual(self.status(), 'hostable')

    def test_could_not_load_needs_fix(self):
        self.assertEqual(self.status(failed=True), 'needs-fix')

    def test_destroyed_context_means_the_page_navigated_away(self):
        self.assertEqual(self.status(error='page.evaluate: Execution context was destroyed, most likely because of a navigation.'),
                         'navigates-away')

    def test_navigated_host_means_navigates_away(self):
        self.assertEqual(self.status(navigated='/dashboard.html'), 'navigates-away')

    def test_page_error_needs_fix(self):
        status, reason, _ = pe.classify(rec('x', errors=2, firstError='boom is not defined'))
        self.assertEqual(status, 'needs-fix')
        self.assertIn('boom', reason)

    def test_empty_page_needs_fix(self):
        self.assertEqual(self.status(text=3), 'needs-fix')

    def test_policy_beats_a_clean_measurement(self):
        # the census says kyc would load; policy keeps it out regardless
        self.assertEqual(self.status(page='kyc'), 'excluded-pending-review')
        self.assertEqual(self.status(page='wallet'), 'excluded-pending-review')   # payments.html was merged into subscriptions.html
        self.assertEqual(self.status(page='terms'), 'standalone-by-policy')
        self.assertEqual(self.status(page='account', error='context was destroyed'), 'standalone-by-policy')


class CheckTests(unittest.TestCase):
    def run_check(self, reg, pages=('alpha', 'beta'), panels=()):
        return pe.check(reg, pages, set(panels))

    def test_a_good_registry_passes(self):
        errors, _ = self.run_check(good_registry())
        self.assertEqual(errors, [])

    def test_a_page_missing_from_the_registry_fails(self):
        errors, _ = self.run_check(good_registry(), pages=('alpha', 'beta', 'gamma'))
        self.assertTrue(any('gamma.html is not in the registry' in e for e in errors), errors)

    def test_a_registry_entry_for_a_deleted_page_fails(self):
        errors, _ = self.run_check(good_registry(('alpha', 'beta', 'ghost')))
        self.assertTrue(any('ghost' in e and 'does not exist' in e for e in errors), errors)

    def test_unknown_status_fails(self):
        reg = good_registry()
        reg['pages']['alpha']['status'] = 'probably-fine'
        errors, _ = self.run_check(reg)
        self.assertTrue(any('probably-fine' in e for e in errors), errors)

    def test_non_hostable_needs_a_reason(self):
        reg = good_registry()
        reg['pages']['alpha'] = {'status': 'needs-fix'}
        reg['counts'] = pe.count(reg['pages'])
        errors, _ = self.run_check(reg)
        self.assertTrue(any('alpha' in e and 'needs a reason' in e for e in errors), errors)

    def test_an_excluded_policy_page_can_never_be_hostable(self):
        reg = good_registry(('alpha', 'kyc'))
        errors, _ = self.run_check(reg, pages=('alpha', 'kyc'))
        self.assertTrue(any('kyc' in e and 'excluded-pending-review' in e for e in errors), errors)

    def test_a_public_page_can_never_be_hostable(self):
        reg = good_registry(('alpha', 'terms'))
        errors, _ = self.run_check(reg, pages=('alpha', 'terms'))
        self.assertTrue(any('terms' in e and 'standalone-by-policy' in e for e in errors), errors)

    def test_hostable_with_a_measured_error_fails(self):
        reg = good_registry()
        reg['pages']['alpha']['measured'] = {'text': 500, 'errors': 1}
        errors, _ = self.run_check(reg)
        self.assertTrue(any('alpha' in e and 'page error' in e for e in errors), errors)

    def test_hostable_with_no_content_fails(self):
        reg = good_registry()
        reg['pages']['alpha']['measured'] = {'text': 5, 'errors': 0}
        errors, _ = self.run_check(reg)
        self.assertTrue(any('alpha' in e and 'chars of content' in e for e in errors), errors)

    def test_a_panel_page_must_be_hostable(self):
        reg = good_registry()
        reg['pages']['beta'] = {'status': 'needs-fix', 'reason': 'x'}
        reg['counts'] = pe.count(reg['pages'])
        errors, _ = self.run_check(reg, panels=('alpha', 'beta'))
        self.assertTrue(any('beta' in e and 'enabled as a panel' in e for e in errors), errors)

    def test_a_panel_page_missing_from_the_registry_fails(self):
        errors, _ = self.run_check(good_registry(), panels=('alpha', 'nowhere'))
        self.assertTrue(any('nowhere' in e for e in errors), errors)

    def test_stale_counts_fail(self):
        reg = good_registry()
        reg['counts']['hostable'] = 99
        errors, _ = self.run_check(reg)
        self.assertTrue(any('counts block' in e for e in errors), errors)

    def test_wrong_schema_fails(self):
        reg = good_registry()
        reg['schema'] = 2
        errors, _ = self.run_check(reg)
        self.assertTrue(errors)

    def test_a_page_edited_after_measurement_warns_but_does_not_fail(self):
        with tempfile.TemporaryDirectory() as d:
            Path(d, 'alpha.html').write_text('<html>one</html>')
            Path(d, 'beta.html').write_text('<html>two</html>')
            reg = good_registry()
            reg['pages']['alpha']['sha'] = pe.page_hash('alpha', d)
            reg['pages']['beta']['sha'] = pe.page_hash('beta', d)
            Path(d, 'alpha.html').write_text('<html>edited</html>')
            errors, warnings = pe.check(reg, ('alpha', 'beta'), set(), root=d)
        self.assertEqual(errors, [])
        self.assertTrue(any('1 page(s) changed' in w for w in warnings), warnings)


class BuildTests(unittest.TestCase):
    def test_build_classifies_hashes_and_counts(self):
        with tempfile.TemporaryDirectory() as site, tempfile.TemporaryDirectory() as cen:
            for k in ('life', 'water', 'kyc', 'gone'):
                Path(site, k + '.html').write_text('<html>%s</html>' % k)
            Path(cen, 'census-0.json').write_text(json.dumps([
                rec('water'), rec('kyc'), rec('gone', error='Execution context was destroyed')]))
            reg = pe.build(cen, root=site, today='2026-11-21')
        p = reg['pages']
        self.assertEqual(p['life']['status'], 'unmeasured')
        self.assertEqual(p['water']['status'], 'hostable')
        self.assertEqual(p['kyc']['status'], 'excluded-pending-review')
        self.assertEqual(p['gone']['status'], 'navigates-away')
        self.assertEqual(len(p['water']['sha']), 12)
        self.assertEqual(reg['counts'], pe.count(p))
        self.assertEqual(pe.check(reg, ['gone', 'kyc', 'life', 'water'], set(), root=site)[0], [])

    def test_build_refuses_a_census_that_skipped_a_page(self):
        with tempfile.TemporaryDirectory() as site, tempfile.TemporaryDirectory() as cen:
            for k in ('life', 'water', 'habits'):
                Path(site, k + '.html').write_text('x')
            Path(cen, 'census-0.json').write_text(json.dumps([rec('water')]))
            with self.assertRaises(SystemExit):
                pe.build(cen, root=site)


class CommittedRegistryTests(unittest.TestCase):
    def test_the_committed_registry_passes_its_own_check(self):
        reg = json.loads((ROOT / 'config' / 'omega-panel-eligibility.json').read_text(encoding='utf-8'))
        errors, _ = pe.check(reg, pe.root_pages(), pe.panel_pages())
        self.assertEqual(errors, [])


if __name__ == '__main__':
    unittest.main()
