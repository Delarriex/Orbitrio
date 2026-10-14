# Orbitrio KYC upload update — local testing

This package is for local testing. Nothing has been pushed, merged, deployed,
or applied to any hosted database.

Base: `Delarriex/Orbitrio`, main commit `dc9dd096f7abb2cc70ec8df8343e11921f9a5941`.
Feature branch: `feature/kyc-image-review`.

## What changed

- Users select and preview ID images: front required; back required for Government
  ID and Driver's License; passport photo page only for Passport. Proof of address
  is optional. No selfie requirement was added.
- JPEG, PNG and WebP, at most 5 MB per image. File type, size and basic image
  signatures are checked before upload; the private bucket enforces MIME and size.
- Images are uploaded to `kyc-documents` under the signed-in Clerk user ID, using
  generated filenames. The database stores private paths, never public image URLs.
- A submission is saved only after every selected image has uploaded successfully.
  Retrying in the same form reuses completed uploads after a partial failure.
- Admins expand View to see previews and open full-size images. Signed links last
  five minutes and refresh while the viewer is open. Failed images can be retried.
- Approve and Reject save the review decision. Rejection requires an explanation.
  Users can refresh their status and resubmit rejected documents.
- The database blocks users approving themselves, foreign or missing image paths,
  changes to pending/approved submissions, changes to identity details during a
  review, and admin reviews using a stale revision. Admins cannot review their
  own KYC.
- Old records remain. An old pending record without images must be rejected with
  a request for images; it cannot be newly approved without the required uploads.
  Existing approved records are retained.
- KYC details are no longer persisted in the application's `orbitrio_user` browser
  cache. Other account-cache behaviour is unchanged.

## 1. Prepare the test services

Use your separate Supabase project and separate Clerk application.

The test database must already have the Orbitrio application schema, including
`public.users`, the trusted `public.is_admin()` function, and the existing user
profile RLS policies. An empty Supabase project is not a full Orbitrio test setup.
The repository's README and MIGRATION_NOTES explain the original schema; some
core setup SQL was not preserved in the original repository. This update does
not invent or replace that missing application schema.

Connect your **test** Clerk instance to your **test** Supabase project using
Clerk's Supabase integration and Supabase's Third-Party Auth integration. The app
already sends Clerk session tokens. Use the test Clerk user IDs in test users
rows; production and test Clerk user IDs are different.

Official setup reference:
https://supabase.com/docs/guides/auth/third-party/clerk

## 2. Run the KYC migration in the TEST database

Open your test Supabase project's SQL Editor. Run the complete contents of:

`kyc_image_review.sql`

It creates the private bucket and KYC table if absent, adds the revision/reviewer
fields, installs access policies and validation, and adds the review RPC. It
preserves existing rows and leaves balances and authentication configuration
alone. If an existing `kyc-documents` bucket has different settings, the migration
stops and rolls back instead of silently changing those settings. Review the
reported mismatch in the test project before retrying.

Do not run this migration against production as part of the local test.
Do not apply every older SQL file just to install this update.

## 3. Configure your local environment

Use Node.js 22 or newer. From the `Orbitrio` directory:

```bash
npm ci
```

Copy `.env.example` to `.env` (Windows PowerShell: `Copy-Item .env.example .env`;
macOS/Linux: `cp .env.example .env`). Edit these values:

```dotenv
VITE_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_TEST_KEY
VITE_SUPABASE_URL=https://YOUR_TEST_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_TEST_PROJECT_ANON_KEY
VITE_LOCAL_DEV=true
VITE_USE_MOCK_DATA=false
VITE_MAINTENANCE_MODE=false
PORT=5173
```

`VITE_LOCAL_DEV=true` stubs app transactional emails. Keep mock data **false** so
KYC actually reads and writes your test database. Clerk's authentication emails
remain managed by Clerk. Leave Resend and the service-role key empty for KYC
validation; the KYC feature uses the signed-in user's token and the public anon
key, not a service-role key. Other unrelated app features may need their usual
configuration.

No credentials are included in this package. Keep `.env` local and untracked.
Restart the development server whenever you change environment values.

## 4. Start and test

```bash
npm run dev
```

Open http://localhost:5173. Use a normal test user in one browser profile and an
admin test user in another. The test admin must have `role = 'admin'` in your test
`public.users` table; a Clerk account by itself does not grant admin privileges.
The existing app routes admins to `/admin`; ordinary users use `/dashboard/kyc`.

1. Sign in as an ordinary user. Fill in identity details and attach images. Use
   dummy images with no real identity documents for development tests.
2. Confirm previews, replacing/removing a file, missing-required-image errors,
   oversized files, and unsupported formats. Passport should omit the back field.
3. Submit. Expect Pending; reload and verify persistence. Further submissions
   while pending should be blocked.
4. Sign in as admin. Open ID Verifications and **Refresh submissions**, then
   expand **View**. Inspect each image and its full-size link. Approval becomes
   available after expanding a record that has the required image paths.
5. Enter a rejection reason and reject. On the user page, **Refresh status**.
   Expect Rejected and the reason. Attach replacement images and resubmit.
6. Refresh the admin list, inspect the replacement images, and approve. Refresh
   the user page; expect Approved with the recorded review notes/time.
7. Use two admin tabs: review in one, then attempt a decision from the old tab.
   The old revision must fail and ask you to refresh.
8. In a second ordinary user's session, verify they cannot read the first user's
   KYC or sign that user's storage paths. Test an unauthenticated session too.
9. Interrupt an upload and retry. Completed uploads within the same mounted form
   should not be uploaded again. If the connection drops during the final save,
   refresh the status first: the database may have saved it despite the timeout.
10. Leave the admin image viewer open for over five minutes and confirm links
    refresh. Test retrying an image after a temporary network failure.

Status changes use the explicit Refresh buttons; this update does not add
background polling or Supabase Realtime.

## 5. Checks included in this build

```bash
npm test
npx tsc --noEmit
npm run build
```

The automated tests use mocked storage/client responses and embedded PostgreSQL
(PGlite) to execute the actual migration, policies, trigger and review RPC. They
cover invalid files, partial-upload retries, missing/foreign paths, owner/admin/
anonymous access, state transitions, stale reviews, and legacy records. Existing
deposit/gift-card tests are also run.

These checks do not replace your local browser tests against actual Clerk and
Supabase. No live service credentials were available during preparation, and no
end-to-end browser/auth/storage test is claimed.

The build reports a bundle-size warning for a chunk larger than 500 kB. See the included verification log for the exact build output.

## Storage and migration notes

The new bucket uses append-only client uploads. Client replacement/deletion of
stored evidence is blocked, including when other permissive storage policies
exist. This intentionally retains evidence after review and avoids deleting an
image after an uncertain network response. Unreferenced uploads can remain after
a cancelled form; establish a retention/cleanup process with the Storage API,
checking that paths are unreferenced before removal. Do not delete storage
metadata with SQL. No automatic retention cleanup or malware scanning is added.

The basic browser signature check is usability validation, not a server malware
scanner. Database rules verify ownership, path and stored object existence;
Supabase Storage applies bucket MIME/size restrictions.

The migration adds restrictive policies so older broad permissive policies cannot
expose KYC. An older restrictive policy may still block a valid operation. If the
test database rejects a valid request, inspect its actual policies rather than
disabling RLS. The migration assumes the existing KYC field names/types used by
this repository; an independently altered schema may require adjustment.

## Preserve version control and merge later

The outer package includes `Orbitrio-kyc.bundle` with the feature branch and its
base history, plus a patch and the complete source folder. To use Git locally,
run this from the extracted package directory instead of editing the source copy:

```bash
git clone -b feature/kyc-image-review Orbitrio-kyc.bundle Orbitrio-git
cd Orbitrio-git
git log -2 --oneline
```

A bundle is offline Git history. Its `origin` points to the local bundle, so it
cannot automatically push to production. To compare changes:

```bash
git diff dc9dd096f7abb2cc70ec8df8343e11921f9a5941 HEAD
```

Alternatively, the repository owner can apply the included patch on a new branch
based on the same main commit using `git am Orbitrio-kyc.patch`. If main has moved,
resolve conflicts and rerun tests before creating a pull request. Share this
package with the repository owner only when you are ready for their review.
Do not merge until the local tests above pass and the production migration/release
order has been reviewed. A future production release needs both the SQL migration
and the matching frontend; Git merging alone does not install database changes.
