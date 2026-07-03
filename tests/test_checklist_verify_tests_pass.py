"""tests/test_checklist_verify_tests_pass.py

wave-7 trust gate: autonomy/checklist-verify.py run_check(tests_pass).

A tests_pass checklist item REQUIRES that test verification actually ran. The
jest invocation uses --passWithNoTests, so a zero-match pattern exits 0 with
"No tests found ..." -- which would be a fake-green (a required verification
reporting SUCCESS with no test executed). pytest exits 5 when it collects no
tests. These tests prove the no-test signal now fails the check, while a real
passing run still passes and a real failing run still fails.

The check function is exercised directly with subprocess.run monkeypatched so
the test does not require jest/pytest to be installed in the project dir.
"""

from __future__ import annotations

import importlib.util
import os
import subprocess
import tempfile
import types
import unittest
from pathlib import Path


def _load_module():
    here = Path(__file__).resolve().parent.parent
    path = here / "autonomy" / "checklist-verify.py"
    spec = importlib.util.spec_from_file_location("loki_checklist_verify", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class _FakeCompleted:
    def __init__(self, returncode, stdout="", stderr=""):
        self.returncode = returncode
        self.stdout = stdout
        self.stderr = stderr


class TestsPassTrustGate(unittest.TestCase):
    def setUp(self):
        self.mod = _load_module()
        self.tmp = tempfile.mkdtemp(prefix="loki-checklist-")
        self._orig_run = subprocess.run

    def tearDown(self):
        subprocess.run = self._orig_run
        import shutil
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _make_jest_project(self):
        # Presence of package.json routes run_check to the jest command.
        with open(os.path.join(self.tmp, "package.json"), "w") as f:
            f.write('{"name": "x"}')

    def _patch_run(self, completed):
        def fake_run(cmd, **kwargs):
            self._last_cmd = cmd
            return completed
        subprocess.run = fake_run

    def _check(self, pattern="src"):
        return self.mod.run_check(
            {"type": "tests_pass", "pattern": pattern},
            project_dir=self.tmp,
            timeout=30,
        )

    # ---- jest fake-green: exit 0 but "No tests found" -> must FAIL ----------

    def test_jest_no_tests_found_fails(self):
        self._make_jest_project()
        # Real jest --passWithNoTests output on a zero-match pattern.
        self._patch_run(_FakeCompleted(
            returncode=0,
            stderr="No tests found, exiting with code 0\n"
                   "Pattern: nomatch - 0 matches",
        ))
        result = self._check(pattern="nomatch")
        self.assertFalse(
            result["passed"],
            "tests_pass must NOT report success when no test was discovered",
        )
        self.assertIn("No tests discovered", result["output"])

    def test_jest_real_pass_still_passes(self):
        self._make_jest_project()
        self._patch_run(_FakeCompleted(
            returncode=0,
            stdout="Tests: 3 passed, 3 total\nTest Suites: 1 passed, 1 total",
        ))
        result = self._check()
        self.assertTrue(result["passed"])

    def test_jest_real_failure_still_fails(self):
        self._make_jest_project()
        self._patch_run(_FakeCompleted(
            returncode=1,
            stdout="Tests: 1 failed, 2 passed, 3 total",
        ))
        result = self._check()
        self.assertFalse(result["passed"])

    # ---- pytest path: exit code 5 = no tests collected -> must FAIL ---------

    def test_pytest_no_tests_collected_fails(self):
        # No package.json -> pytest command path.
        self._patch_run(_FakeCompleted(
            returncode=5,
            stdout="no tests ran in 0.01s",
        ))
        result = self._check()
        self.assertFalse(
            result["passed"],
            "pytest exit 5 (no tests collected) must fail the required check",
        )

    def test_pytest_real_pass_still_passes(self):
        self._patch_run(_FakeCompleted(
            returncode=0,
            stdout="3 passed in 0.05s",
        ))
        result = self._check()
        self.assertTrue(result["passed"])


class GrepCodebaseErrorInconclusiveGate(unittest.TestCase):
    """#142 trust gate: a grep_codebase check whose grep ERRORS (returncode >= 2:
    bad regex, or a grep variant like macOS ugrep that rejects a pattern GNU grep
    accepts) must be INCONCLUSIVE (passed=None), NEVER a hard False.

    Collapsing a grep ERROR to False is a fake-RED: it marks a genuinely-present
    endpoint 'failing' -> the completion council hard-gate blocks a CORRECT build
    forever. Observed live: an LLM-emitted pattern `app\\.get\\('/api/tasks'` made
    ugrep error 'parentheses not balanced' (returncode 2), so 3 working endpoints
    read 'failing' -> a 64-minute non-converging build (issue #124). A clean
    returncode 1 (real no-match) stays an honest False; returncode 0 stays True.
    """

    def setUp(self):
        self.mod = _load_module()
        self.tmp = tempfile.mkdtemp()
        self._orig_run = subprocess.run

    def tearDown(self):
        subprocess.run = self._orig_run
        import shutil
        shutil.rmtree(self.tmp, ignore_errors=True)

    def _patch_run(self, completed):
        def fake_run(cmd, **kwargs):
            return completed
        subprocess.run = fake_run

    def _grep(self, pattern="app.get"):
        return self.mod.run_check(
            {"type": "grep_codebase", "pattern": pattern},
            project_dir=self.tmp,
            timeout=30,
        )

    def test_grep_error_is_inconclusive_not_false(self):
        # returncode 2 = grep error (e.g. ugrep 'parentheses not balanced').
        self._patch_run(_FakeCompleted(
            returncode=2, stdout="", stderr="grep: parentheses not balanced"))
        result = self._grep()
        self.assertIsNone(
            result["passed"],
            "a grep ERROR must be inconclusive (None), never a hard False "
            "(fake-RED that blocks a correct build)")
        self.assertIn("inconclusive", result["output"])

    def test_grep_no_match_stays_false(self):
        # returncode 1 = clean 'not found' -> an honest False (moat: a genuinely
        # absent pattern must NOT sneak to inconclusive/green).
        self._patch_run(_FakeCompleted(returncode=1, stdout=""))
        result = self._grep()
        self.assertFalse(result["passed"])
        self.assertIn("0 file", result["output"])

    def test_grep_match_stays_true(self):
        self._patch_run(_FakeCompleted(returncode=0, stdout="src/app.js\n"))
        result = self._grep()
        self.assertTrue(result["passed"])
        self.assertIn("1 file", result["output"])


if __name__ == "__main__":
    unittest.main()
