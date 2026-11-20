# SYD OMEGA 91717 — Existing Source Registry Reconciliation

**Audit date:** 2026-11-20  
**Repository baseline:** `edee02a7659f4a9be707532eac8d9fc1473cb364`  
**Scope:** reconcile the existing source-corpus indexes and 999-point registry with the five uploaded source documents and the 2026-11-20 source reconciliation audit.

## 1. Decision

Do not create a parallel requirements registry. The repository already has source registers and traceability artifacts. Preserve those artifacts and reconcile their counts, definitions, provenance, and freshness.

This audit is documentation-only. It does not change runtime code, database schema, provider configuration, or authorization.

## 2. 999-point registry: exact accounting

The existing `docs/OMEGA_999_CONCEPT_REGISTRY.json` was generated on 2026-10-04. Its current fields and entries reconcile as follows:

| Measure | Count | Meaning |
|---|---:|---|
| Blueprint declared framework | 999 | The source document's declared point framework |
| Unique numbered source records extracted | 391 | Distinct explicit source point labels represented in the source register |
| Repeated source-number occurrences | 8 | Additional occurrences caused by repeated source labels |
| Numbered source occurrences | 399 | 391 unique source records plus 8 repeated occurrences |
| Appended registry nodes | 14 | Later registry additions; not original numbered source records |
| Total registry entries | 413 | 391 + 8 + 14 |
| Distinct point identifiers across registry entries | 396 | Includes appended nodes that reuse identifiers |
| Point identifiers appearing more than once | 17 | 8 source-repeat identifiers plus 9 appended-node identifier collisions |
| Declared point numbers without a discrete source record | 608 | A structural gap in the source corpus, not 608 missing implemented features |

The 8 repeated source labels are **100, 101, 102, 103, 104, 112, 113 and 133**. The registry preserves 8 corresponding records with status `RESTORED_DUPLICATE_NUMBER`.

The 14 appended nodes use the status `APPENDIX_NODE`. Nine of those appended nodes reuse an identifier already present in the source-derived records: **89, 93, 97, 155, 212, 250, 545, 812 and 999**. These collisions are not additional repeated source statements; they are registry namespace collisions introduced by appended nodes.

### Required interpretation

- `total_extracted=391` is consistent with the 391 unique source records, not the 399 occurrence count.
- `entries.length=413` includes restored repeated occurrences and appended nodes.
- The 608 absent numbers are not requirements to invent, and they are not proof that 608 product features are missing.
- A point number is a source locator, not a stable canonical requirement identity.
- Do not silently collapse repeated source records or treat appendix nodes as original blueprint points.

## 3. Current registry integrity risks

1. **Mixed identity namespaces:** source point labels and appended-node labels share the same `point` field. A consumer that keys entries only by `point` can overwrite or conflate records.
2. **Ambiguous totals:** `total_declared`, `total_extracted`, `missing_points` and `entries.length` describe different populations. Their semantics need to be explicit in schema documentation and generated reports.
3. **Generated artifact freshness:** the registry date is 2026-10-04. Any changes to source files or extraction logic require deterministic regeneration and review.
4. **Status semantics:** `REQUIRES_CURRENT_RUNTIME_MAPPING`, `RESTORED_DUPLICATE_NUMBER`, `APPENDIX_NODE`, `R&D_OR_LORE` and `DO_NOT_IMPLEMENT_AS_WRITTEN` are different dimensions. They should not be flattened into one generic completion status.
5. **No inferred completion:** `ledger_status=SHIPPED` or `PARTIAL` in a source concept registry is not production proof without a current capability, test, deployment and evidence reference.

## 4. Existing 18-module traceability artifact freshness

The existing `docs/OMEGA_18_MODULE_REPOSITORY_TRACEABILITY_2026-11-11.md` is based on main commit `5537d5baabdbd4eaac1d7fa3619981a62b437208` and reports a 241-page contract estate. The 2026-11-20 repository README reports 242 pages under governance.

Therefore the November 11 module traceability counts are a **historical baseline**, not a current November 20 status assertion. Refresh the module-to-page, domain-to-capability, authoritative-data, owner, acceptance-test and release-evidence mappings before using those counts for current release decisions.

The 18-module source register remains a useful source transcription. It is not itself proof that all 18 domains are implemented.

## 5. Source corpus count correction

The current five uploaded source files total **4,068 lines**:

| Source | Current line count |
|---|---:|
| 999-point blueprint | 1,231 |
| Master Prompt | 1,847 |
| 18-module product document | 363 |
| Enterprise research prompt | 553 |
| Absolute response-method guide | 74 |
| **Total** | **4,068** |

The older `docs/OMEGA_SOURCE_COVERAGE_AUDIT.md` and `config/omega-source-coverage.json` reported 1,846, 362 and 552 lines for the Master Prompt, 18-module document and enterprise research prompt respectively. Those values counted newline characters rather than logical text lines. The correct logical counts are 1,847, 363 and 553. The source coverage contract test now asserts these values and the counting convention.

## 6. Canonical repair path

1. Preserve every source occurrence with immutable provenance: source file, line range, section heading, original point label and exact source text.
2. Assign a new stable canonical requirement ID independent of the source point number, for example `SRC-BP-000001`.
3. Add `record_kind`: `SOURCE_REQUIREMENT`, `SOURCE_DUPLICATE`, or `APPENDIX_PROPOSAL`.
4. Add `source_occurrence_id` so repeated text/labels remain individually addressable.
5. Keep `source_point_label` as a non-unique locator; never use it as a primary key.
6. Store classification, implementation state, risk, accountable domain, candidate page/capability, authorization, data source, dependencies, acceptance tests, evidence and release state as separate fields.
7. Validate counts with deterministic tests: 391 unique source records, 399 source occurrences, 14 appended nodes and 413 total current entries.
8. Re-run source-to-repository traceability against the current page, domain, capability, task, event/evidence and release registries.
9. Do not promote speculative, unsafe, legally sensitive or unsupported financial concepts to implementation without the required decision gates.

## 7. Acceptance criteria for a future registry repair

- [ ] All 399 numbered source occurrences are preserved with source line references.
- [ ] The 8 repeated source labels remain distinct source occurrences and are explicitly linked.
- [ ] The 14 appended nodes are marked as appendices and cannot collide with source-record primary keys.
- [ ] Every record has a stable canonical ID.
- [ ] Missing point numbers are reported as source-structure gaps, not fabricated requirements.
- [ ] Counts are generated from data and asserted by automated tests.
- [ ] Every accepted requirement links to a current page/domain/capability and authoritative data source.
- [ ] Every implementation status links to current test and release evidence.
- [ ] No credentials or unnecessary personal data are copied into the registry.

**Conclusion:** the repository already contains the right source-register foundations. The next task is not to recreate them; it is to normalize identity, clarify counting semantics, refresh stale module traceability, and enforce evidence-backed mappings.
