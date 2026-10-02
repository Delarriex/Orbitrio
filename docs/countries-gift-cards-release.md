# Countries and gift-card deposits

Prepared from `main` at `a065906b65dd88c05b6d9b55dd1227b1c98c8554`.
Branch: `feature/countries-gift-card-deposits`.

## Changes

- Registration offers 249 ISO country/territory entries plus Kosovo, sorted by English display name. Profile values remain names, matching existing saved profiles.
- Both the wallet page and quick-deposit modal offer gift cards.
- The reference-style form groups Deposit Details, Gift Card Details and Upload Proof into separate panels. Gift Card Type is a dropdown with Amazon, Apple, Steam, Google Play, Razer Gold and Visa. Users supply card face value/currency, the USD deposit amount, and 1–4 JPG/PNG/WebP images (maximum 5 MB each).
- Submissions remain pending. Admins see the original card value, requested USD amount and private images, then approve or reject using the existing deposit RPCs. Approval credits the displayed requested USD amount; admins must verify it and reject incorrect requests. There is no automatic conversion, card redemption or promise to accept a particular brand.
- Images live in a separate private bucket with owner/admin read access and owner-only upload access. The database validates that referenced objects exist and belong to the submitting user. No user overwrite/delete policies are added.
- Admins can also open existing crypto proofs stored as valid private object paths. Old placeholder filenames cannot be recovered as images.
- Deposit submission now awaits database success. Failed uploads/inserts preserve gift-card form details, and retries reuse completed image uploads. Admin feedback also waits for the approval/rejection response.

## Release order

1. Confirm the Vercel production branch and which Supabase project each preview/production environment uses. This work did not read deployment configuration from Vercel or access the live database.
2. On an isolated preview/staging Supabase project, run `gift_card_deposits.sql` in SQL Editor. It depends on the existing `transactions` table, Clerk third-party authentication and `public.is_admin()`. It is additive and can be run again safely. The existing transaction RLS and admin deposit RPCs must already be installed.
3. Install and verify the branch:

   ```bash
   npm ci
   npm test
   npm run lint
   npm run build
   ```

4. Open the branch preview with a regular test user and a separate admin account. Register with a newly listed country; submit a gift card with two images; reload the user history and admin deposits; open both images; approve one request and reject another; verify balance changes only on approval. Confirm an unrelated account cannot read the images. Check a crypto deposit still works.
5. Before releasing the frontend to production, run the same additive SQL migration against the production Supabase project. Then merge/deploy after review. Keep the existing production deployment available for rollback.

Do not deploy the gift-card frontend before its migration: uploads/inserts will fail until the bucket, columns and policies exist. No additional environment variables are needed. Admins can use the Refresh button to load newly submitted requests; this does not add realtime subscriptions.

## Verification performed

- TypeScript (`npm run lint`) and production build passed.
- `npm test`: five suites cover country coverage/name compatibility, file and amount validation, owner-scoped upload paths/failures, crypto regression, and the SQL migration/policies/approval RPCs in an isolated PGlite database.
- Database checks included repeatable migration, another user's image/transaction isolation, missing/foreign image references, invalid amounts, non-admin approval rejection, duplicate approval crediting once, rejection without credit, and preservation of existing crypto records.
- Local browser tests with mocked Clerk/Supabase verified the 375px layout, both gift-card entry points, image preview, upload failure, database failure, retry reuse, successful reset, and admin image viewing/approval feedback.
- Live Clerk/Supabase/Vercel integration is still a pre-release check. The test database models the documented schema; it cannot prove the actual deployed policies match it.

## Rollback and retention

Revert the frontend commit or restore the preceding Vercel deployment. Keep the additive columns, private bucket and submitted evidence: dropping them would delete payment history. After a rollback, existing gift-card requests need review through the updated admin UI or an authorized database workflow before their evidence can be viewed. Uploads abandoned before submission may remain in the private bucket; any future cleanup should remove only objects confirmed unreferenced by transactions.
