# Deposit proof upload verification

Verified against the user-confirmed **Orbitrio-test** project at
`https://bhlgakkqvcoegvfkmhxu.supabase.co`, through `http://localhost:5173`.
No production project, storage policy, bucket configuration, or deployed application was changed.

## Implementation

- Both crypto forms retain the selected `File`, upload it into `deposit-proofs`, and pass the confirmed storage response path to `deposit()`. A failed upload prevents transaction insertion. Successful uploads are reused if saving the transaction fails.
- Both gift-card entry points use `GiftCardDepositForm` and the same validated upload service, targeting `gift-card-proofs`. Partial multi-image uploads are retained for retry, scoped to the current authenticated client/user.
- The existing transaction hook already writes `proof_file` and `gift_card_image_paths` and maps them back into admin transactions. It always inserts deposits as pending. Approval/rejection RPCs and balance logic were left unchanged.
- The admin viewer signs owner-scoped paths with the current authenticated client for five minutes. It keeps valid links when images are hidden, refreshes expired links, and provides per-image failure states, retry, and full-size links. The cache resets on session/evidence changes. Original filenames containing consecutive dots are accepted when no path segment is `.` or `..`.
- The orange Confirm Deposit buttons and the existing mobile layout work are preserved.

## Remote test results

| Check | Result |
| --- | --- |
| Gift-card Wallet submission | Uploaded two PNGs; saved both actual paths; pending; balance unchanged |
| Gift-card modal submission | Uploaded two PNGs; saved both actual paths; pending; balance unchanged |
| Admin gift-card previews and full-size viewing | All four images loaded; full-size requests returned HTTP 200 |
| Reopen images | No additional signing requests while links remained valid |
| Approval and rejection | Approved only the new Wallet test; rejected only the new modal test; attached paths preserved |
| Fresh admin access after review | All four images signed again after approval/rejection; downloads returned HTTP 200 |
| Owner access after review | All four reviewed image paths could be signed by their owner |
| Unrelated-user access | Test user could neither sign nor download the admin-owned gift-card proof |
| Anonymous/public/expired access | Anonymous signing denied; public download and expired signed URL returned HTTP 400 |
| Non-admin approval | RPC denied; balance unchanged |
| Crypto Wallet and modal failure handling | Injected upload failure blocked insertion; retry against the real project returned `Bucket not found`; no crypto transaction created |

The two gift-card test records are `tx-dep-1790880454472` (approved, $1.11) and
`tx-dep-1790880484483` (rejected, $1.12). The test user's balance was $0 after
uploads and submissions, then $1.11 only after explicit admin approval; rejection
left it unchanged. One additional admin-owned PNG was uploaded solely to test
unrelated-user denial. These are clearly synthetic test artifacts, retained in the
test project because uploaded evidence is immutable. Existing unrelated records
were not reviewed or modified. Test transactional emails were suppressed in the browser.

## Local regression coverage

- `tests/deposit-proof-service.test.ts`: confirmed upload paths; failures and file validation in both buckets; partial signing results; cached reopening; expiry; forced refresh; broken-image invalidation; session/cache isolation; legacy and unsafe paths.
- `tests/gift-card-deposits.test.ts`: validation and pending transaction defaults, plus the actual migration/policy/RPC definitions executed in isolated PGlite. Covers both buckets, owner/admin reads, unrelated-user denial, owner-scoped inserts, no credit on submission, approval/rejection, and reviewed evidence access. The additive crypto migration is checked for repeatability, preservation of existing policies, and refusal to silently rewrite an existing public bucket.
- Isolated browser checks rendered the actual Wallet, modal, gift-card form, upload service, transaction hook, and admin viewer against an in-memory storage/database fixture. All four submission combinations passed upload failure, partial gift upload, insert failure, retry without reupload, exact-path persistence, and pending status checks. All six images remained viewable on reviewed records; signing errors, image errors, expiry refresh, and cache reuse passed.
- Browser screenshots and overflow checks passed at 375, 390, 430, 768, and 1440 pixels. Physical-device keyboards were not tested.
- `npm test`, both individual test files (10 named tests total), `npm run lint`, `npm run build`, and `git diff --check` passed. The build reports a large-chunk warning.
- Detailed browser results, screenshots, and test logs are in `/tmp/orbitrio-proof/` (no passwords or signed URLs in the reports).

## Setup still required

The test project has **no enabled crypto deposit wallets**, and `deposit-proofs`
is missing. For failure-path browser checks only, an explicitly labelled wallet
fixture was supplied in the browser; no remote wallet settings were changed.
Successful crypto uploads, real crypto admin signing, and crypto access denial
could therefore only be verified locally, not end-to-end against Supabase.

Review `deposit_proofs_storage_setup.sql` and all existing `storage.objects`
policies before applying it to **Orbitrio-test**. This separate additive migration
creates a missing private `deposit-proofs` bucket and missing named owner/admin
policies. It does not drop or overwrite policies, change existing bucket settings,
or touch transaction/balance logic. It has **not been executed remotely**.

After reviewing/applying the migration and configuring a test crypto wallet,
repeat both crypto entry points and admin/owner/unrelated-user checks on pending,
approved, and rejected crypto deposits. No gift-card storage migration is needed
for the tested project.
