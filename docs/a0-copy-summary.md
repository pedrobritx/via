# VIA — A0 pilot: local Copy summary action

**Status:** implementation candidate for review, not a product release.  
**Pilot owner:** VIA repository (product behavior); [Constellation A0 goal](https://github.com/pedrobritx/constellation/issues/2).  
**Issue:** [VIA pilot #3](https://github.com/pedrobritx/via/issues/3).  
**Source baseline:** `2c32a58ba9ab07771991d94bc8554353bc74b900`; proposed changes are reviewable against this revision.

## Intended product behavior

The results area already displays a translated aggregate summary and supports full JSON/CSV file exports. The new **Copy summary** button requires an explicit click or keyboard activation. It writes an aggregated, localized text comprising:
- the existing `buildSummary` result (without reproducing raw inputs);
- the actual `indexVersion` for reproducibility;
- an explicit *hypothetical savings* caveat when teleconsultation is not viable;
- a route precision caveat for low-confidence estimates;
- a concise explanation that burden/social indices use normative—not measured—weights.

The clipboard text deliberately does **not** include raw patient, income, age, mobility, origin/destination or `remoteBlockedReason` fields. It does contain derived estimates; those can still be sensitive. The UI warns that other apps may access clipboard contents. No new network request, server copy, analytics or automatic copy is introduced. This is a user-initiated disclosure, not a promise of anonymization.

When results become stale after form changes, the Copy summary action is disabled and instructs the user to recalculate. JSON/CSV exports are left unchanged to avoid unrelated behavior changes.

## Discipline handoff lenses

| Discipline | Code / review scope |
| --- | --- |
| Axis | UI wrapper reuses existing `buildSummary` and `ImpactResult`; no change to `src/domain/` or INDEX_VERSION; regression tests for local text generation and fixed version |
| Meridian | Native button keyboard semantics, disabled/stale feedback, translated status labels, visible status with `role=status`/`aria-live`; manual focus and assistive-tech behavior still requires actual observation |
| Sentinel | Explicit clipboard API user action, no remote upload/telemetry, avoidance of raw input data, clipboard privacy warning; inspect whether derived savings should be treated as sensitive in downstream workflows |

## Verification plan and known limitations

The existing VIA CI runs `npm run typecheck`, `npm run lint`, `npm run test` and `npm run build` on pull requests, with no production credentials required. New Vitest scenarios cover PT-BR/EN-US output, nonviability, low route confidence and absence of sensitive raw labels/fields. **CI does not validate actual clipboard permission prompts or assistive-technology behavior.** Before acceptance, manually verify keyboard activation, focus visibility, clipboard success/error messages, stale disablement and no unrequested network transmission with synthetic data.

The local GitHub PR is **not** proof that a Codex host, Polaris routing or an independent comparison workflow executed this feature. Treat this as a candidate adopter implementation for the subsequent A0 pilot validation, not as a passed Constellation G1–G6 gate or a measurement of improvement over ordinary coding agents.

## Non-goals / approvals

No new export format, payment, backend, database, data retention, medical recommendation, deployment or authentication change. Any merge/deployment is a separate human-controlled decision. Preserve VIA's original `AGENTS.md` policies and domain/React separation.
