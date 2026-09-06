import unittest
from core.intelligence_fabric.evidence_matrix import EvidenceMatrix, EvidencePoint, EvidenceState


class EvidenceMatrixTests(unittest.TestCase):
    def test_summary_and_blockers(self):
        matrix = EvidenceMatrix([
            EvidencePoint("001", "runtime", "health", EvidenceState.VERIFIED, "ci", True),
            EvidencePoint("002", "payments", "stripe", EvidenceState.UNVERIFIED, "", True),
            EvidencePoint("003", "ui", "gateway", EvidenceState.PARTIAL),
        ])
        self.assertEqual(matrix.summary()["VERIFIED"], 1)
        self.assertEqual([p.point_id for p in matrix.release_blockers()], ["002"])

    def test_validation(self):
        matrix = EvidenceMatrix()
        with self.assertRaises(ValueError):
            matrix.add(EvidencePoint("", "x", "y"))


if __name__ == "__main__":
    unittest.main()
