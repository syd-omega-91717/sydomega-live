#!/usr/bin/env python3
"""Contract tests for the deterministic browser-script dependency inventory."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "omega-script-dependency-graph.py"
SPEC = importlib.util.spec_from_file_location("omega_script_dependency_graph", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)

class ScriptDependencyGraphTests(unittest.TestCase):
    def test_finds_html_consumers_and_bg_loader_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "bg.js").write_text("var a='/omega-a.js'; __omegaAppend(a); var b='/omega-b.js'; __omegaIdleAppend(b);")
            (root / "omega-a.js").write_text("window.OmegaA = {};")
            (root / "omega-b.js").write_text("window.OmegaB = window.OmegaA;")
            (root / "index.html").write_text('<script src="/bg.js"></script><script src="/omega-b.js"></script>')
            result = MODULE.build_inventory(root)
            self.assertEqual(result["root_script_count"], 3)
            self.assertEqual(result["bg_load_states"]["immediate"], ["omega-a.js"])
            self.assertEqual(result["bg_load_states"]["idle"], ["omega-b.js"])
            by_path = {row["path"]: row for row in result["scripts"]}
            self.assertEqual(by_path["omega-b.js"]["pages"], ["index.html"])
            self.assertIn("OmegaA", by_path["omega-b.js"]["reads_published_globals"])

    def test_topological_order_places_local_import_before_consumer(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "a.js").write_text("window.A = true;")
            (root / "b.js").write_text("import './a.js'; window.B = true;")
            result = MODULE.build_inventory(root)
            self.assertEqual(result["deterministic_topological_order"], ["a.js", "b.js"])
            self.assertEqual(result["hard_dependency_edges"], [
                {"from": "a.js", "to": "b.js", "type": "static-local-import"}
            ])

    def test_reports_hard_dependency_cycles_deterministically(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "a.js").write_text("import './b.js';")
            (root / "b.js").write_text("import './a.js';")
            result = MODULE.build_inventory(root)
            self.assertEqual(result["hard_dependency_cycles_or_blocked_nodes"], ["a.js", "b.js"])


    def test_bg_loader_contract_reports_missing_order_and_failure_guarantees(self):
        bg = """
function __omegaIdleAppend(el){
  var go=function(){var run=function(){__omegaAppend(el);};
    if(window.requestIdleCallback){requestIdleCallback(run,{timeout:2500});}
    else{setTimeout(run,300);}
  };
  if(document.readyState==='complete'){go();}
  else{window.addEventListener('load',go,{once:true});}
}
function __omegaAppend(el){
  var seen=__omegaAppend.seen||(__omegaAppend.seen={el:new WeakSet(),path:Object.create(null)});
  if(list[k]!==el && list[k].isConnected)return true;
  if(document.body){if(!dup())document.body.appendChild(el);return;}
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.body;if(b&&!dup())b.appendChild(el);
  });
}
"""
        contract = MODULE.inspect_bg_loader_contract(bg)
        self.assertTrue(contract["deduplicates_existing_scripts_signal"])
        self.assertTrue(contract["idle_waits_for_window_load_signal"])
        self.assertEqual(contract["idle_request_timeout_ms"], 2500)
        self.assertFalse(contract["ordered_dynamic_execution_signal"])
        self.assertFalse(contract["creates_load_promise_signal"])
        self.assertFalse(contract["has_error_callback_signal"])
        self.assertFalse(contract["has_timeout_signal"])
        self.assertEqual(contract["status"], "DEDUPE_AND_IDLE_ONLY")

    def test_bg_loader_contract_recognizes_explicit_order_and_error_api(self):
        bg = """
function __omegaIdleAppend(el){requestIdleCallback(function(){__omegaAppend(el);},{timeout:2500});}
var pending = new Map();
function __omegaAppend(el){
  el.async=false;
  if(pending.has(el.src)) return pending.get(el.src);
  var loadPromise = new Promise(function(resolve,reject){
    el.onload=resolve;
    el.onerror=function(error){reject(error);};
    var timer=setTimeout(function(){reject(new Error('timeout'));},8000);
  });
  pending.set(el.src, loadPromise);
  document.body.appendChild(el);
  return loadPromise;
}
function retryOmegaScript(src){ pending.delete(src); }
"""
        contract = MODULE.inspect_bg_loader_contract(bg)
        self.assertTrue(contract["ordered_dynamic_execution"])
        self.assertTrue(contract["returns_shared_load_promise"])
        self.assertTrue(contract["has_load_callback_signal"])
        self.assertTrue(contract["handles_network_or_csp_error"])
        self.assertTrue(contract["has_load_timeout"])
        self.assertTrue(contract["has_registry_cleanup_signal"])
        self.assertEqual(contract["status"], "ORDERED_WITH_SHARED_PROMISE_AND_RETRY_SIGNALS")

    def test_bg_loader_sequence_preserves_source_order_and_idle_classification(self):
        bg = """
var alpha=document.createElement('script');alpha.src='/alpha.js';alpha.defer=true;__omegaAppend(alpha);
var beta=document.createElement('script');beta.src='/beta.js';beta.defer=true;__omegaIdleAppend(beta);
"""
        sequence = MODULE.scan_bg_loader_sequence(bg, {"alpha.js", "beta.js"})
        self.assertEqual([item["path"] for item in sequence], ["alpha.js", "beta.js"])
        self.assertEqual([item["helper"] for item in sequence], ["immediate", "idle"])
        self.assertEqual([item["order"] for item in sequence], [1, 2])

    def test_excludes_external_and_vendor_script_references(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "app.js").write_text("window.App = true;")
            (root / "index.html").write_text(
                '<script src="https://example.test/x.js"></script>'
                '<script src="/vendor/lib.js"></script><script src="/app.js"></script>'
            )
            result = MODULE.build_inventory(root)
            self.assertEqual(result["scripts"][0]["pages"], ["index.html"])
            self.assertEqual(result["root_script_count"], 1)

if __name__ == "__main__":
    unittest.main()
