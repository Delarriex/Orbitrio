# Release the KYC update through GitHub and Vercel

This checkout is `Orbitrio-git`, on `feature/kyc-image-review`. Its `origin` is an
offline bundle, not GitHub. A separate `github` remote points to
`https://github.com/Delarriex/Orbitrio.git`. Use `git status` and `git log` to check
which changes are already committed before following the commands below.

The live site is connected to `Delarriex/Orbitrio` on Vercel, as confirmed by the
repository owner. The GitHub remote has been added and fetched. On 15 October 2026, `github/main`
matched the feature base `dc9dd09`; there were no upstream commits to merge.
Push, pull-request, and production-release steps below have not been performed.

## 1. Prepare Vercel Preview before pushing

In the existing Vercel project, confirm the production branch is `main` and that
`feature/kyc-image-review` will create a Preview deployment.

Set these variables for **Preview only**, optionally scoped to this feature branch:

- `VITE_CLERK_PUBLISHABLE_KEY`: the test Clerk publishable key.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: the test Supabase values.
- `VITE_LOCAL_DEV=true` (stubs app transactional emails).
- `VITE_USE_MOCK_DATA=false`.
- `VITE_MAINTENANCE_MODE=false`.

Check that Preview is not inheriting production database credentials. The KYC
migration and helper fix have already been applied to the test database. Leave
Production environment variables pointing to the existing live services. Keep
`.env` local and untracked; do not copy it into GitHub.

Vercel documentation:
- https://vercel.com/docs/deployments/environments
- https://vercel.com/docs/environment-variables

## 2. Save the work and compare with current GitHub main

Run from the extracted package directory:

```bash
cd Orbitrio-git
git status --short --branch
git diff --check
git diff
```

Review any untracked files too, since plain `git diff` does not display them.
If the worktree has changes, record them with the commands below. Skip this
commit step if `git status` is clean and the latest commit includes the fixes:

```bash
git add KYC_LOCAL_SETUP.md KYC_RELEASE.md kyc_image_review.sql kyc_admin_helper_fix.sql src/components/KycImageInput.tsx src/components/admin/tabs/AdminKycTab.tsx src/pages/DashboardKYC.tsx tests/kyc-image-review.test.ts
git diff --cached --stat
git commit -m "Fix KYC admin authorization and simplify mobile ID uploads"
```

Add the real repository under a separate remote name to preserve the bundle:

```bash
git remote add github https://github.com/Delarriex/Orbitrio.git
git fetch github
git log --oneline HEAD..github/main
git diff --stat github/main...HEAD
```

If `github` already exists, inspect `git remote -v` instead of adding it again.
Verify the owner/repository and production branch before proceeding. GitHub may
have changed since this bundle was created. Incorporate the current main branch
into the feature branch, resolve any conflicts, and review the resulting diff:

```bash
git merge github/main
npm test
npm run lint
npm run build
git diff --check
git diff --stat github/main...HEAD
```

Do not overwrite newer live-site work, force-push, or push this work directly to
main. If a merge reports conflicts, resolve them before continuing.

## 3. Push the feature branch and test the Preview

```bash
git push -u github feature/kyc-image-review
```

On GitHub, open a pull request from `feature/kyc-image-review` to `main`. Follow
the Vercel Preview link for that PR. Test regular-user and admin login, front/back
uploads, passport upload, rejection, resubmission, approval, and mobile layout.
Use dummy images and test accounts. Confirm the preview uses the test services.

The local browser test user is already Approved. To repeat the complete flow,
use another regular test account; approved KYC is intentionally not replaceable.

Vercel Git deployment behavior: https://vercel.com/docs/git

## 4. Coordinate the production database and frontend release

After Preview passes, record the current production deployment and verify a
recoverable production database backup. Compare production's users schema,
existing KYC table, policies, storage bucket settings, and is_admin() definition
against the tested setup. In particular, read this before replacing the helper:

```sql
SELECT pg_get_functiondef('public.is_admin()'::regprocedure) AS definition;
```

`kyc_admin_helper_fix.sql` matches the original Orbitrio admin rule. If production
has additional/custom admin rules, preserve those when adapting the fix.

During the release window, run these files in the **production Supabase SQL
Editor**, in this order, checking that each succeeds:

1. `kyc_admin_helper_fix.sql` (after comparing the existing helper).
2. `kyc_image_review.sql`.

Run only these KYC-related scripts, not every SQL file in the repository. The
migration preserves existing records; it stops if an existing KYC storage bucket
has incompatible settings. Investigate such an error rather than disabling RLS.

The new database rules require images and the newer submission payload, so the
old frontend's KYC submissions can fail between the SQL update and frontend
release. Keep that interval short and pause KYC submissions during the transition
using the site's available maintenance process. Other application-wide changes
should not be introduced as part of this KYC release.

Keep Production Clerk/Supabase variables set to the live services, with
`VITE_LOCAL_DEV=false`, `VITE_USE_MOCK_DATA=false`, and normally
`VITE_MAINTENANCE_MODE=false`. Build using Production values; do not manually
promote a bundle built with test VITE_* credentials.

## 5. Merge, verify, and retain a recovery path

Merge the reviewed PR into Vercel's configured production branch. With Git
continuous deployment enabled, this starts a Production deployment. Wait for it
to finish, then verify sign-in, the KYC form, existing records, and admin image
viewing on the real domain. Any production test submissions must use designated
accounts and clearly marked dummy images.

A Git revert or Vercel frontend rollback does not undo Supabase SQL changes.
Because the earlier KYC frontend may not work with the new validation rules,
coordinate database compatibility if a rollback becomes necessary. Preserve
uploaded evidence and submissions; do not delete them to recover from a release.

## Known verification limits

The core upload/review flow passed against test services. The redesigned form
passed mobile/desktop layout and input checks. The build has its existing large
chunk warning. A separate notifications-table HTTP 403 observed during earlier
testing remains undiagnosed; do not describe notification persistence as verified.
