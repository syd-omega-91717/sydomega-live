"""The 3D Honors Vault is a presentation of persisted award rows, never a minting source."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCULPTURE = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
HONORS = (ROOT / "honors.html").read_text(encoding="utf-8")
VAULT = (ROOT / "omega-honors-vault.js").read_text(encoding="utf-8")


def scene_body():
    start = SCULPTURE.index("SCENES.vault = function")
    end = SCULPTURE.index("SCENES.world = function", start)
    return SCULPTURE[start:end]


class Honors3DVault(unittest.TestCase):
    def test_scene_is_mounted_only_in_the_vault_tab(self):
        start = HONORS.index('id="mtab-vault"')
        end = HONORS.index('id="mtab-science"', start)
        panel = HONORS[start:end]
        self.assertIn('data-omega-sculpture="vault"', panel)
        self.assertIn('id="vt-3d-source"', panel)

    def test_scene_reads_persisted_award_collections(self):
        body = scene_body()
        self.assertIn("window.OmegaHonorsVault", body)
        self.assertIn("data.trophies", body)
        self.assertIn("data.medals", body)
        self.assertIn("data.certificates", body)
        self.assertIn("state === 'LIVE'", body)

    def test_unavailable_is_unknown_not_locked_or_earned(self):
        body = scene_body()
        self.assertIn("entry.state = known ? (earned ? 'EARNED' : 'LOCKED') : 'UNKNOWN'", body)
        self.assertIn("HONORS DATA UNAVAILABLE", body)
        self.assertIn("NO EARNED STATE INFERRED", body)

    def test_three_collections_rotate_independently(self):
        body = scene_body()
        self.assertIn("collection.group.rotation.y = t * collection.speed", body)
        self.assertIn("prefers-reduced-motion: reduce", body)
        self.assertIn("count: 36", body)

    def test_data_is_published_from_member_scoped_database_reads(self):
        self.assertIn("sb.from('trophies').select('trophy_num,earned_at').eq('user_id',uid)", VAULT)
        self.assertIn("sb.from('medals').select('medal_num,earned_at').eq('user_id',uid)", VAULT)
        self.assertIn("sb.from('certificates').select('cert_num,issued_at').eq('user_id',uid)", VAULT)
        self.assertIn("window.OmegaHonorsVault={status:'LIVE'", VAULT)

    def test_owner_role_does_not_override_persisted_earned_rows(self):
        self.assertNotIn("isOwner?all", VAULT)
        self.assertIn("var tn=et.map(function(r){return r.trophy_num;});", VAULT)
        self.assertIn("var mn=em.map(function(r){return r.medal_num;});", VAULT)
        self.assertIn("var cn=ec.map(function(r){return r.cert_num;});", VAULT)


if __name__ == "__main__":
    unittest.main()
