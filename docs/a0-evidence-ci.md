# A0 — Source-matched check evidence (CI-only, experimental)

**Status:** reviewable M1 evidence-capture slice, not A0 pilot acceptance.  
**Source:** [Constellation A0 goal](https://github.com/pedrobritx/constellation/issues/2) · [Polaris evidence issue](https://github.com/pedrobritx/polaris/issues/16).  
**Owner:** VIA project maintains its test commands and data boundaries; Polaris owns the reusable result/receipt validator.

## What this adds

`.github/workflows/a0-evidence.yml` checks out VIA and a **pinned, reviewed Polaris commit** with read-only token permissions and no persisted checkout credentials. It runs `npm ci`, then executes the exact four commands already mandated in VIA's `AGENTS.md`:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

The limited `scripts/a0_capture_checks.py` does not accept arbitrary commands, dynamically choose test suites, download external model instructions, or invoke agents. It captures actual subprocess exit codes and stdout/stderr into **runner-temporary local files**. Receipt JSON files record the checked-out Git commit SHA, command, exit code and SHA-256 hashes of both logs. Logs over 10 MiB are rejected.

After execution, Polaris's `automation/a0.py check-result` validates **reported** execution/verification/approval states, while `automation/a0_evidence.py` confirms local receipt consistency, a clean VIA source revision, and that the referenced log bytes match recorded hashes. The workflow is failed if any of the four commands fails or if evidence validation fails.

A short-lived artifact uploads **only JSON receipt metadata**, never raw stdout/stderr logs. Raw logs remain runner-local and are deleted after execution. This avoids a new publicly downloadable copy of potentially sensitive test logs, but limits later independent replay of the hash checks. The GitHub Actions job itself gives an independently hosted record that the validation steps ran, subject to GitHub's workflow and retention policies.

## Explicitly incomplete

This workflow **does not** run Codex or verify that Codex authored VIA's existing feature. It does not prove user-interface accessibility, real clipboard permissions, privacy against malicious downstream clipboard readers, independent security review, or improvement over a control. Its A0 result deliberately remains:

- `execution: partial`
- `verification: partial`
- `approval: pending`

Coverage gaps are explicit and may not be overridden simply because the four commands succeed. The evidence validator is not a security attestation: anyone with the ability to rewrite both logs and their receipts can forge internally consistent data.

## Privacy and authority

This workflow runs on public GitHub infrastructure; use synthetic test fixtures and do not put patient records, production secrets or personal files into CI. `npm ci` and tests run existing repository code without additional service keys. No production deployment, code merge, security-policy change or spending authorization is granted.

## Human acceptance still required

Before the VIA pilot can count as Constellation A0 G1–G6, a real host session must inspect Polaris/Axis/Meridian/Sentinel, route its task, produce actual source-matched work, undergo owner review, exercise clipboard and assistive technologies, and record the planned conventional-agent baseline comparison. This CI run is **narrow verification evidence**, not the end-to-end pilot.
