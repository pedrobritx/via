# Constellation A0 — Codex pilot review runbook

**Status:** ready-to-review instructions, **not an executed Codex session**.  
**Host:** Codex in a developer-controlled local checkout; no new runtime or provider credentials.  
**Product:** [VIA #4](https://github.com/pedrobritx/via/pull/4), issue [VIA #3](https://github.com/pedrobritx/via/issues/3).  
**Goal:** [Constellation A0](https://github.com/pedrobritx/constellation/issues/2).

## Scope

This reviews the existing review-branch implementation of the user-initiated Copy summary feature. **It is not a randomized or controlled baseline-vs-treatment experiment**, because the feature code has already been authored through the GitHub connector. Do not count this run as demonstrating that Polaris routed the original implementation. A future comparable implementation experiment must start separately from immutable baseline `2c32a58ba9ab07771991d94bc8554353bc74b900` in isolated worktrees, with equivalent explicit acceptance criteria and resource limits.

This folder contains `a0-adoption.pilot.json` and `a0-review-intake.pilot.json`, deliberately *not* a root `constellation.json` so that reviewing/merging a feature does not silently adopt Polaris governance for every VIA task. The host must consciously opt in to use these pilot files.

## Local-only preflight

Place optional independently cloned repositories under one parent folder, named `polaris`, `axis`, `meridian`, `sentinel`, and the adopter `via`. Check out only the reviewed commits; inspect Git status and project instructions. From the parent folder:

```sh
python3 polaris/automation/a0.py route \
  --config via/docs/a0-adoption.pilot.json \
  --intake via/docs/a0-review-intake.pilot.json \
  --workspace . \
  --product-root via
```

The expected route is **unified** for Axis, Meridian and Sentinel, because the host capabilities are conservatively set to `subagents=false` and `isolated_worktrees=false`. It does not actually execute any agents. Review `preflight_status` and stop or obtain alternate reviewed coverage if `needs-coverage`.

## Codex task instruction

> Inspect VIA's actual AGENTS.md, README, source of PR #4, acceptance criteria in `docs/a0-copy-summary.md`, and the selected Polaris/Axis/Meridian/Sentinel guidance. Run the A0 route command above, inspect its contract output, and audit the proposed user-initiated clipboard feature. Verify that native keyboard interaction, visible focus, copy failure/success announcements, result-stale disabling, localization, index version, nonviability language, normative caveats and raw input minimization match the specification. Run the four existing VIA checks on the actual checkout. Keep work on a review branch, preserve project-owned docs, and report executed commands with real output/evidence references. Do not auto-merge, deploy, publish, change auth/security posture or claim independent security/accessibility verification. If you cannot actually inspect or run a check, report it as unverified or blocked.

## Exact project checks

Use the existing VIA-required check sequence in the adopter checkout, not simulated test output:

```sh
npm ci
npm run test
npm run typecheck
npm run lint
npm run build
```

Inspect exact exit statuses, test counts and any failed or skipped steps. Confirm `src/domain/` remains unchanged and the local-only fallback works with no provider credentials. Test clipboard permission/availability and keyboard focus on an actual supported browser manually; a passing CI build is not an accessibility pass.

## Evidence capture

Use private/local non-synced evidence storage when logs might contain user data. Commit only redacted, durable summaries and references. For command receipts, use the [Polaris A0 evidence contract](https://github.com/pedrobritx/polaris/blob/main/integration/a0.md) and the exact current Git revision. Each result check references a local receipt and SHA-256 digests of captured stdout/stderr. Run:

```sh
python3 polaris/automation/a0.py check-result \
  --result /path/to/a0-result.json
python3 polaris/automation/a0_evidence.py \
  --result /path/to/a0-result.json \
  --product-root via \
  --evidence-root /path/to/private/receipts
```

The first checks the *self-reported schema*; the second checks local log integrity and a clean, unchanged adopter Git HEAD. Neither proves the claimed command actually ran, nor guarantees clipboard UX, security or accessibility. Keep the evidence tied to the revision under test.

## Exit state

Record any routed disciplines and reasons, actual checks, files/ADRs changed, unresolved limitations, residual privacy risk from derived values, manual keyboard/screen-reader outcomes, and the human reviewer decision. If any mandatory criterion cannot be verified, report `partial` or `blocked`; never silently promote `ready` to `passed`. A0 G1–G6 acceptance and the baseline comparison remain separate work items.
