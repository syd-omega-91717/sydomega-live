#!/usr/bin/env python3
"""Regression contracts for the canonical 12-agent / 144-seat council."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

class AgentCouncilContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.roster = json.loads(read('omega-agents.json'))['agents']
        cls.tools = json.loads(read('supabase/functions/agent-execute/agent-tools.json'))
        cls.config = json.loads(read('config/omega-sovereign-hubs.json'))
        cls.hierarchy = json.loads(read('omega-agent-hierarchy.json'))
        cls.council = read('agents.html')
        cls.network = read('agent-network.html')
        cls.operations = read('omega-agent-operations.js')
        cls.operations_page = read('agent-operations.html')
        cls.pantheons = read('pantheons.html')

    def test_primary_roster_is_exactly_twelve_unique_agents(self):
        names = [agent['name'] for agent in self.roster]
        self.assertEqual(len(names), 12)
        self.assertEqual(len(set(names)), 12)

    def test_server_tool_allowlist_matches_canonical_roster(self):
        self.assertEqual(set(self.tools['agents']), {a['name'] for a in self.roster})
        self.assertEqual(self.tools['mode'], 'READ_ONLY')
        self.assertTrue(all(tool.get('mutation') is False for tool in self.tools['tools'].values()))

    def test_hierarchy_is_twelve_positions_per_primary(self):
        self.assertIn('data-tab="hierarchy"', self.council)
        self.assertIn('id="tab-hierarchy"', self.council)
        self.assertIn('function renderHierarchy(agents)', self.council)
        self.assertIn('renderHierarchy(_agents);', self.council)
        self.assertIn('positions.length!==144', self.council)
        self.assertIn('children.length!==12', self.council)
        hierarchy = self.config['agent_hierarchy']
        self.assertEqual(hierarchy['primary_agent_count'], 12)
        self.assertEqual(hierarchy['subordinate_positions_per_primary'], 12)
        self.assertEqual(hierarchy['subordinate_position_capacity'], 144)
        registry = self.hierarchy
        self.assertEqual(registry['status'], 'CAPACITY_REGISTRY_ONLY')
        self.assertEqual(len(registry['positions']), 144)
        self.assertEqual(len({p['position_id'] for p in registry['positions']}), 144)
        for agent in self.roster:
            seats = sorted((p for p in registry['positions'] if p['parent_agent_name'] == agent['name']), key=lambda p: p['slot_number'])
            self.assertEqual([p['slot_number'] for p in seats], list(range(1, 13)))
            self.assertTrue(all(p['name'] is None and p['classification'] is None and p['status'] == 'UNASSIGNED' and p['operational'] is False and not p['capabilities'] and not p['permissions'] and p['authority_inheritance'] is False for p in seats))
        self.assertIn("fetch('/omega-agent-hierarchy.json'", self.council)

    def test_source_conflict_is_recorded_as_an_owner_override(self):
        decision = self.config['agent_hierarchy']['source_reconciliation']
        prior = decision['prior_blueprint_reference']
        current = decision['latest_owner_instruction']
        self.assertEqual(prior['point'], 116)
        self.assertEqual(prior['subordinate_total'], 108)
        self.assertEqual(prior['subordinate_positions_per_primary'], 9)
        self.assertEqual(current['subordinate_positions_per_primary'], 12)
        self.assertEqual(current['subordinate_position_capacity'], 144)
        order = decision['agent_ordinal_order']
        self.assertNotEqual(order['blueprint_points_47_58'], order['canonical_omega_agents_json'])
        self.assertEqual(order['canonical_omega_agents_json'], [a['name'] for a in self.roster])
        self.assertIn('Use canonical agent names', order['identity_rule'])

    def test_unassigned_positions_do_not_claim_live_subagents(self):
        self.assertNotIn('FALLBACK_AGENTS', self.council)
        self.assertIn("fetch('/omega-agents.json',{cache:'no-cache'})", self.council)
        self.assertIn('UNASSIGNED', self.council)
        self.assertIn('Every seat below is therefore marked', self.council)
        self.assertIn('classification and parentage do not grant permissions', self.council.lower())

    def test_agent_council_page_adds_no_inline_event_handlers(self):
        self.assertEqual(re.findall(r'\bon[a-z]+\s*=', self.council, flags=re.I), [])

    def test_operations_ui_uses_canonical_roster_and_server_gateway(self):
        self.assertIn("fetch('/omega-agents.json'", self.operations)
        self.assertNotRegex(self.operations, r'var\s+AGENTS\s*=')
        self.assertIn("functions.invoke('agent-execute'", self.operations)
        self.assertIn('REGISTERED · AUTHORIZATION REQUIRED', self.operations)

    def test_network_view_disclaims_illustrative_relationships(self):
        self.assertIn('Illustrative visual arrangement', self.network)
        self.assertNotIn('FALLBACK_AGENTS', self.network)
        self.assertIn('NO FALLBACK IDENTITIES RENDERED', self.network)
        self.assertNotRegex(self.network, r'onclick\s*=')
        self.assertIn('NOT EXPOSED BY THIS VISUALIZATION', self.network)
        self.assertNotIn('Level 7 · Active Executor', self.network)
        self.assertNotIn('Real-time · Live monitoring', self.network)

    def test_agent_hub_integrates_related_pages_as_lazy_tabs(self):
        for name in ('network', 'pantheons', 'operations'):
            self.assertIn(f'data-tab="{name}"', self.council)
            self.assertIn(f'id="tab-{name}"', self.council)
        self.assertIn('data-src="/agent-network.html?embed=1"', self.council)
        self.assertIn('data-src="/pantheons.html?embed=1"', self.council)
        self.assertIn('data-src="/agent-operations.html?embed=1"', self.council)
        self.assertIn("frame.setAttribute('src',frame.getAttribute('data-src'))", self.council)
        self.assertIn('role="tabpanel"', self.council)
        self.assertIn('role="tablist" aria-label="Agent Council sections"', self.council)
        for name in ('agent', 'council', 'hierarchy', 'chat', 'science', 'network', 'pantheons', 'operations'):
            self.assertIn(f'id="tab-btn-{name}"', self.council)
            self.assertIn(f'aria-labelledby="tab-btn-{name}"', self.council)

    def test_embedded_views_preserve_standalone_routes_and_auth_boundaries(self):
        for page in (self.network, self.pantheons, self.operations_page):
            self.assertIn('omega-agent-embed-style', page)
            self.assertIn('<script src="/omega-agent-embed.js" defer></script>', page)
        self.assertIn("get('embed') === '1'", read('omega-agent-embed.js'))
        self.assertIn("location.replace('/account.html')", self.pantheons)
        self.assertIn("pr.is_owner", self.pantheons)
        self.assertIn("pr.access_approved", self.pantheons)
        self.assertIn("functions.invoke('agent-execute'", self.operations)
        self.assertIn('read-only gateway consumer', self.operations)

    def test_agent_architecture_copy_matches_fail_closed_roster(self):
        self.assertIn('fail closed if the canonical 12-agent roster cannot be verified', self.council)
        self.assertNotIn('hardcoded 12-agent fallback', self.council)
    def test_pantheon_storage_and_theory_claims_are_truthful(self):
        self.assertIn('SAVE ON THIS DEVICE', self.pantheons)
        self.assertIn('not currently saved to your SYD OMEGA member profile', self.pantheons)
        self.assertIn('PANTHEON THEORY &amp; INTERPRETATION', self.pantheons)
        self.assertIn('data-tab="science" role="tab">THEORY</button>', self.pantheons)
        self.assertNotIn('23% higher cohesion', self.pantheons)

if __name__ == '__main__':
    unittest.main()
