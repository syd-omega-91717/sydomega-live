# Status: APPROVED-BY-CODEX

> **Round 3 — 2026-09-27: retention rule, privacy notice, consent, withdrawal, owner switch.** Owner request: "a retention rule and a privacy notice for ID documents … do all the needs correctly."
> - **Rule:** a document is kept only while it waits for review. A verdict hands its path back (`review_kyc` → `purge`), the owner page deletes it through the Storage API, and `kyc_document_purged()` clears the record only once `storage.objects` no longer holds it. `kyc_queue().purge` lists every verdict whose file still exists, with DELETE NOW. SQL cannot delete a Storage object (`storage.protect_delete`, measured), which is why the server confirms rather than deletes.
> - **Consent:** `submit_kyc(p_doc_path, p_consent)`; the one-argument form is dropped; `kyc_consent_at` is recorded. The page has a required checkbox linking to the notice.
> - **Withdraw:** the member deletes their own pending document (`withdraw_kyc`, refuses `still_stored` until the file is gone).
> - **Notice:** `privacy.html#identity-documents` — what, why, who sees it, how long, withdrawal, rights. Same pass corrected the page's false "Supabase EU region" (the project is `ap-southeast-1`).
> - **Erasure and deletion never strand a document** (`20260927142646`): both refuse while one exists and return its path; `OmegaStorage.clearIdentityDocThen` deletes it and retries.
> - **Found and fixed on the way (live, measured):** `request_account_erasure` and `deactivate_account` failed for every member (guard trigger `text[] || 'x'` → 22P02), and **`approve_member` failed for every approval** (all 10 notification writers omit NOT NULL `title`/`type` → 23502; `notifications` had 0 rows ever). Migrations `20260927142829`, `20260927143525`, `20260927143903`.
> - **Owner switch:** OPEN/CLOSE INTAKE on approvals.html (`owner_set_kyc_intake`). Intake is still **closed**; opening it is the owner's decision.
> - Verified live in rolled-back blocks; tests `scripts/tests/test_kyc_intake.py` (29).

# Plan: KYC document intake that actually saves, dormant behind a flag

Decision record for `grill-me-codex` (Mode 1, `type=auth` + `type=schema`). The audit
trail is in `CODEX_REVIEW.md` next to this file. The owner delegated the decision on
2026-09-27: "You take the right decision … a real asset, not a demo."

## Goal

`profile.html`'s passport section lets a member upload an identity document and mark
their verification as submitted. **Every submission fails today.** Measured live on
2026-09-27:
- `authenticated` holds UPDATE on 14 `profiles` columns, and none of them is `kyc_*`.
- The page writes `kyc_status`/`kyc_doc_path`/`kyc_submitted_at` directly, so PostgREST
  returns `42501`.
- The upload runs **before** that write. A failed submission would therefore leave an
  identity document in storage with no record pointing to it. The `uploads` bucket holds
  0 objects today, so nothing is orphaned yet.
- No owner surface exists to review a submission. `kyc_status` is `none` on 9/9 profiles.

The lock on those columns is correct: a member who can write `kyc_status` can mark
themselves `verified`.

The goal is a complete, honest loop: submit → owner review → verdict. Every rule is
enforced on the server. Intake stays **off** until the owner has settled the legal
side.

## Threat surface (the eight classes)

| # | class | applies? | how |
|---|---|---|---|
| 1 | Stored XSS | yes | Display names reach the owner's review list; rendered with `textContent` only. |
| 2 | Silent-failure writes | **yes, and it is the bug** | Every RPC call checks `.error` **and** `data.ok`. The upload is removed when the record fails. |
| 3 | RLS gaps | yes | No policy or grant is loosened. Writes go only through definer bodies that name their own row. |
| 4 | Column names | yes | Columns verified live: `kyc_status text default 'none'`, `kyc_doc_path text`, `kyc_submitted_at timestamptz`. |
| 5 | Module boundary | low | Listeners are wired with `addEventListener`; no inline handler is added (the CSP ratchet holds). |
| 6 | Unguarded RPCs | **yes** | `review_kyc` and `kyc_queue` check `private.is_platform_owner()` first. `submit_kyc` acts only on `auth.uid()`. EXECUTE is revoked from `public` and `anon` (§8.1 class 6a). |
| 7 | Races | yes | `select … for update` on the member's row. A verdict applies only while the status is still `submitted`. |
| 8 | Edge cases | yes | Intake closed, signed out, not approved, path outside own folder, object missing, already verified, resubmission while pending, verdict on a non-submitted row. |

## Approach

The shape follows `20260926223027_owner_security_checklist.sql`: a `private` SECURITY
DEFINER body behind a `public` SECURITY INVOKER wrapper, so the exposed schema holds no
definer function (advisor lint 0029). Every function returns
`{ok:false,error:<code>}` rather than raising, so the page can say exactly what happened.

1. **Flag.** A `platform_settings` row `kyc_intake_enabled = false`, inserted with
   `on conflict do nothing`.
2. **`submit_kyc(p_doc_path)`, called by the member.** It refuses when:
   - the flag is off (`intake_closed`);
   - the caller is signed out;
   - the caller is neither approved nor an owner (`not_approved`);
   - the path does not match `^<auth.uid()>/[^/]{1,255}$` (`bad_path`);
   - no `storage.objects` row exists in `uploads` with that name **and** `owner_id = auth.uid()`
     (`no_document`);
   - the status is already `verified` (`already_verified`).

   Otherwise it sets `kyc_status='submitted'`, `kyc_doc_path`, `kyc_submitted_at=now()`
   and returns the previous path, so the page can delete a superseded document.
3. **`review_kyc(p_member, p_verdict)`, called by the owner.**
   - The verdict must be `verified` or `rejected`.
   - It updates only a row whose status is currently `submitted`.
   - It writes a `raise log` line naming the actor, the target and the verdict.
4. **`kyc_queue()`, called by the owner.** It lists submitted rows: id, display name,
   submitted time and path. It returns nothing to non-owners.
5. **Client.**
   - `profile.html` reads the flag before uploading. When closed, it shows why and
     disables the button.
   - On **any** `ok:false` (including a flag flipped mid-flight) it removes the uploaded file (the member may DELETE in their own
     folder: the policy was verified live).
   - It deletes a superseded document after a successful resubmission.
6. **Owner review.** `approvals.html` gets a KYC section listing the queue:
   - VIEW opens a **60-second** signed URL (the owner may read `uploads` under the live
     storage policy);
   - VERIFY and REJECT call `review_kyc` and check the result.

## Key decisions

- **Dormant by default.** Identity documents are special-risk personal data. §9 says a
  legally sensitive feature ships behind a flag, with copy in the future tense until it
  is on. This change makes the machinery correct. It does not decide that the platform
  should collect IDs.
- **No column grant.** Granting UPDATE on `kyc_*` would let a member set `verified`
  themselves. The definer body is the only write path.
- **The owner is the reviewer, never a machine.** The existing copy already says
  verification "requires a licensed KYC/AML provider" and is "not verified
  automatically". This change keeps that.
- **No audit-table write.** `access_audit` feeds the approvals history (`approvals.js`),
  and a KYC verdict is not an access change. The verdict goes to the Postgres log instead.
  A dedicated KYC audit table is a follow-up if intake is switched on.

## Risks / open questions (for the owner)

- **Retention.** How long is a document kept after the verdict? Data minimisation says:
  delete it once reviewed. The owner cannot delete a member's object under the current
  storage policy, and deleting `storage.objects` rows in SQL orphans the bytes. Settle
  this before switching intake on.
- **Lawful basis and notice.** A privacy notice for ID collection is needed before the
  flag is flipped.
- Until then the flag stays `false`, and members see why intake is closed.

## Out of scope

Automated verification, liveness checks, address proof, and any payment or token unlock
tied to `verified`. Those tables stay dormant.

## Success criteria

1. With the flag off, `submit_kyc` returns `intake_closed` and the page never uploads.
2. With the flag on, as an impersonated approved member (`SET LOCAL ROLE authenticated`
   plus JWT claims, inside a rolled-back block):
   - a path in another member's folder returns `bad_path`;
   - a missing object returns `no_document`;
   - a real object returns `ok`, with status `submitted`.
3. The member calling `review_kyc` gets `forbidden`, and so does anyone calling
   `kyc_queue`. The owner gets the row, and `verified` applies once. A second verdict
   returns `not_submitted`.
4. `anon` holds EXECUTE on none of the six functions. The security advisor reports
   nothing new.
