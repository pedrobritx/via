#!/usr/bin/env python3
"""Capture fixed VIA CI checks for A0; not a Codex or autonomous agent runtime.

This pilot-only utility executes four hard-coded, already-required project
verification commands. It records exact Git HEAD, return codes and local
stdout/stderr SHA-256 receipts, without claiming independent UI assessment.
No command, argument or arbitrary shell snippet is taken from project input.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

COMMANDS = (
    ("test", ("npm", "run", "test")),
    ("typecheck", ("npm", "run", "typecheck")),
    ("lint", ("npm", "run", "lint")),
    ("build", ("npm", "run", "build")),
)
MAX_LOG_BYTES = 10 * 1024 * 1024


def git_revision(product_root: Path) -> str:
    return subprocess.check_output(
        ["git", "-C", str(product_root), "rev-parse", "HEAD"],
        text=True,
    ).strip()


def capture(product_root: Path, evidence_root: Path) -> bool:
    """Only run the four fixed VIA checks. Returns True if all checks pass."""
    product_root = product_root.resolve()
    evidence_root = evidence_root.resolve()
    if evidence_root == product_root or evidence_root.is_relative_to(product_root):
        raise ValueError("Evidence must be outside the adopter repository")
    if product_root.name != "via":
        raise ValueError("The pilot capture runner only supports the VIA checkout")
    evidence_root.mkdir(parents=True, exist_ok=True)
    (evidence_root / "receipts").mkdir(exist_ok=True)
    (evidence_root / "logs").mkdir(exist_ok=True)
    revision = git_revision(product_root)
    checks = []
    all_passed = True
    for name, argv in COMMANDS:
        try:
            execution = subprocess.run(
                argv, cwd=product_root, stdout=subprocess.PIPE,
                stderr=subprocess.PIPE, timeout=600, check=False,
            )
            stdout, stderr, exit_code = execution.stdout, execution.stderr, execution.returncode
        except subprocess.TimeoutExpired as error:
            stdout = error.stdout or b""
            stderr = (error.stderr or b"") + b"\nA0 CHECK TIMEOUT after 600s\n"
            exit_code = 124
        if len(stdout) > MAX_LOG_BYTES or len(stderr) > MAX_LOG_BYTES:
            raise ValueError(f"{name} generated excessive evidence output")
        paths = {
            "stdout": evidence_root / "logs" / (name + ".stdout.log"),
            "stderr": evidence_root / "logs" / (name + ".stderr.log"),
        }
        paths["stdout"].write_bytes(stdout)
        paths["stderr"].write_bytes(stderr)
        receipt = {
            "version": 1,
            "request_id": "via-a0-copy-summary-review-001",
            "project": "pedrobritx/via",
            "source_revision": revision,
            "command": " ".join(argv),
            "exit_code": exit_code,
            "stdout_path": str(paths["stdout"].relative_to(evidence_root)),
            "stdout_sha256": hashlib.sha256(stdout).hexdigest(),
            "stderr_path": str(paths["stderr"].relative_to(evidence_root)),
            "stderr_sha256": hashlib.sha256(stderr).hexdigest(),
        }
        ref = f"receipts/{name}.json"
        (evidence_root / ref).write_text(json.dumps(receipt, indent=2) + "\n")
        checks.append({
            "command": receipt["command"],
            "exit_code": exit_code,
            "source_revision": revision,
            "evidence_ref": ref,
        })
        all_passed &= exit_code == 0
        print(f"{name}: exit={exit_code}", flush=True)

    result = {
        "version": 1,
        "request_id": "via-a0-copy-summary-review-001",
        "project": "pedrobritx/via",
        "source_revision": revision,
        "execution": "partial",
        "verification": "partial",
        "approval": "pending",
        "checks": checks,
        "artifacts": ["src/components/ExportButtons.tsx", "src/i18n/shareSummary.ts"],
        "documentation": ["docs/a0-copy-summary.md", "docs/a0-codex-runbook.md"],
        "coverage_gaps": [
            "No Codex/Polaris execution of initial implementation observed",
            "Manual screen-reader/keyboard/clipboard-denial checks outstanding",
            "No preregistered conventional-agent baseline comparison",
            "No independent security or accessibility review",
        ],
        "unresolved_findings": [],
    }
    (evidence_root / "a0-result.json").write_text(json.dumps(result, indent=2) + "\n")
    return all_passed


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--product-root", type=Path, required=True)
    parser.add_argument("--evidence-root", type=Path, required=True)
    args = parser.parse_args(argv)
    try:
        passed = capture(args.product_root, args.evidence_root)
    except (OSError, subprocess.CalledProcessError, ValueError) as error:
        print(f"A0 capture failed: {error}", file=sys.stderr)
        return 1
    if not passed:
        print("One or more VIA checks failed (see local receipts).", file=sys.stderr)
        return 1
    print("All four VIA commands returned zero; human approval and A0 pilot remain pending.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
