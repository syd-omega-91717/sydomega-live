from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github/workflows/evidence-matrix-refresh.yml"


class EvidenceMatrixRefreshWorkflowTests(unittest.TestCase):
    def test_write_workflow_is_scoped_to_refresh_branches(self):
        source = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn('branches:\n      - "automation/evidence-matrix-refresh-*"', source)
        self.assertIn("permissions:\n  contents: write", source)
        self.assertIn("if: github.actor != 'github-actions[bot]'", source)
        self.assertIn('git push origin "HEAD:${GITHUB_REF_NAME}"', source)
        self.assertNotIn("concurrency:", source)
        self.assertNotIn("pull_request:", source)
        self.assertNotIn("branches: [main]", source)
        self.assertNotIn("git push origin main", source)

    def test_workflow_only_commits_the_generated_matrix(self):
        source = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("python3 scripts/evidence-audit.py", source)
        self.assertIn("git add EVIDENCE_MATRIX.md", source)
        self.assertIn("git diff --quiet -- EVIDENCE_MATRIX.md", source)
        self.assertNotIn("git add .", source)
        self.assertNotIn("git add -A", source)

    def test_actions_are_pinned_to_full_commit_shas(self):
        source = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1", source)
        self.assertIn("actions/setup-python@5fda3b95a4ea91299a34e894583c3862153e4b97", source)


if __name__ == "__main__":
    unittest.main()
