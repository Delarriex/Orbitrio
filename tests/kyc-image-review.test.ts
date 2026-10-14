import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { KycUploadBatch, uploadKycImage, validateKycFile, validateKycSubmission, signKycImage, saveKycSubmission, reviewKycSubmission, MAX_KYC_IMAGE_BYTES } from "../src/services/kycService";
import type { KycSubmission } from "../src/types";

const png = (name: string) => new File([new Uint8Array([137,80,78,71,13,10,26,10])], name, { type: "image/png" });
const submission: KycSubmission = { idType: "Government ID", documentType: "Government ID", idNumber: "TEST-123", dob: "1990-01-01", address: "12 Test Street", city: "Lagos", country: "Nigeria", frontImage: "user_a/abc.png", backImage: "user_a/def.png", status: "pending" };

test("KYC validation rejects missing fields, invalid dates and unsupported images", async () => {
  assert.equal(validateKycSubmission(submission), null);
  for (const change of [{ idNumber: " " }, { country: "" }, { documentType: "Unknown" }, { dob: "2099-01-01" }, { dob: "2000-02-30" }, { address: "x".repeat(501) }]) assert.ok(validateKycSubmission({ ...submission, ...change }));
  for (const file of [new File([], "empty.png", { type: "image/png" }), new File(["<svg />"], "x.svg", { type: "image/svg+xml" }), new File([new Uint8Array(MAX_KYC_IMAGE_BYTES + 1)], "large.png", { type: "image/png" })]) assert.ok(validateKycFile(file));
  const neverUpload = { storage: { from() { throw Error("must not upload"); } } } as any;
  await assert.rejects(uploadKycImage(neverUpload, "user_a", new File(["renamed pdf"], "file.png", { type: "image/png" })), /format/);
  await assert.rejects(uploadKycImage(neverUpload, "other/path", png("front.png")), /sign in/);
});

test("partial uploads retry only unfinished files, require confirmed paths, and skip passport backs", async () => {
  const front = png("front.png"), back = png("back.png");
  const calls: File[] = [];
  let failBack = true;
  const client = { storage: { from(bucket: string) {
    assert.equal(bucket, "kyc-documents");
    return { async upload(path: string, file: File, options: any) {
      assert.match(path, /^user_a\/[0-9a-f-]+\.png$/);
      assert.equal(options.upsert, false);
      calls.push(file);
      if (file === back && failBack) return { error: new Error("offline") };
      return { data: { path }, error: null };
    } };
  } } } as any;
  const batch = new KycUploadBatch(client, "user_a");
  const files = { frontImage: front, backImage: back, proofOfAddressImage: null };
  await assert.rejects(batch.upload({ ...files, backImage: null }, "Government ID"), /required/);
  assert.equal(calls.length, 0);
  await assert.rejects(batch.upload(files, "Government ID"), /offline/);
  failBack = false;
  const result = await batch.upload(files, "Government ID");
  assert.deepEqual(calls, [front, back, back]);
  assert.match(result.frontImage, /^user_a\//);
  assert.notEqual(result.frontImage, result.backImage);
  await batch.upload(files, "Government ID");
  assert.equal(calls.length, 3, "database-save retry reuses successful upload paths");
  const passport = await batch.upload(files, "Passport");
  assert.equal(passport.backImage, "");
  for (const response of [{ data: null }, { data: { path: "foreign/fake.png" } }]) {
    const broken = { storage: { from: () => ({ upload: async () => response }) } } as any;
    await assert.rejects(uploadKycImage(broken, "user_a", front), /confirm/);
  }
});

test("private viewer signs only owner-scoped paths, uses short expiry and exposes errors", async () => {
  let count = 0;
  const client = { storage: { from(bucket: string) {
    count++; assert.equal(bucket, "kyc-documents");
    return { async createSignedUrl(path: string, seconds: number) {
      assert.equal(seconds, 300);
      return { data: { signedUrl: `https://example.invalid/${path}?token=temporary` }, error: null };
    } };
  } } } as any;
  for (const path of ["https://example.org/file.png", "user_b/abc.png", "user_a/../abc.png", "user_a/abc.svg", "file.png"]) await assert.rejects(signKycImage(client, "user_a", path), /private image path/);
  assert.equal(count, 0);
  const signed = await signKycImage(client, "user_a", "user_a/abc.png");
  assert.ok(signed.url.includes("temporary"));
  assert.ok(signed.expiresAt > Date.now() && signed.expiresAt < Date.now() + 300_000);
  const failed = { storage: { from: () => ({ createSignedUrl: async () => ({ error: new Error("Access denied") }) }) } } as any;
  await assert.rejects(signKycImage(failed, "user_a", "user_a/abc.png"), /Access denied/);
});

test("service submits pending with cleared review fields and reviews the displayed revision", async () => {
  let payload: any;
  const client = { from: () => ({ upsert(row: any, options: any) {
    payload = row;
    assert.equal(options.onConflict, "user_id");
    return { select: () => ({ single: async () => ({ data: { ...row, revision: 3, submission_date: "2026-10-14T00:00:00Z" } }) }) };
  } }) } as any;
  const result = await saveKycSubmission(client, "user_a", { ...submission, status: "approved", adminNotes: "fake", reviewedAt: "2020-01-01" });
  assert.equal(payload.status, "pending"); assert.equal(payload.reviewed_at, null); assert.equal(payload.reviewed_by, null);
  assert.equal(payload.admin_notes, ""); assert.equal(result.revision, 3);
  await assert.rejects(saveKycSubmission(client, "user_b", submission), /required images/);
  const reviewer = { async rpc(name: string, args: any) {
    assert.equal(name, "review_kyc_submission"); assert.equal(args.p_expected_revision, 3);
    assert.equal(args.p_notes, "Readable");
    return { data: { ...payload, status: "approved", revision: 4 } };
  } } as any;
  assert.equal((await reviewKycSubmission(reviewer, "user_a", "approved", " Readable ", 3)).status, "approved");
  await assert.rejects(reviewKycSubmission(reviewer, "user_a", "rejected", " ", 3), /reason/);
  await assert.rejects(reviewKycSubmission(reviewer, "user_a", "approved", "", undefined as any), /Refresh/);
});

test("SQL: private storage, ownership, state transitions, resubmission, stale reviews and legacy records", async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role authenticated; create role anon;
      create schema auth; create schema storage;
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('test.jwt',true),''),'{}')::jsonb $$;
      create function public.is_admin() returns boolean language sql stable as $$ select coalesce(auth.jwt()->>'sub'='admin',false) $$;
      create function storage.foldername(name text) returns text[] language sql immutable as $$ select string_to_array(name,'/') $$;
      create table public.users(id text primary key);
      insert into users values ('user_a'),('user_b'),('admin'),('legacy');
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(bucket_id text,name text,primary key(bucket_id,name));
      alter table storage.objects enable row level security;
      -- Simulate a pre-existing broad storage policy. Restrictive guards must win.
      create policy old_broad_storage on storage.objects for all to public using(true) with check(true);
      grant usage on schema public,auth,storage to authenticated,anon;
      grant all on storage.objects to authenticated,anon;
    `);
    const migration = await readFile(new URL("../kyc_image_review.sql", import.meta.url), "utf8");
    await db.exec(migration);
    await db.exec(migration);
    const bucket = (await db.query<any>("select * from storage.buckets where id='kyc-documents'")).rows[0];
    assert.equal(bucket.public, false); assert.equal(Number(bucket.file_size_limit), 5242880);
    assert.deepEqual(bucket.allowed_mime_types, ["image/jpeg", "image/png", "image/webp"]);
    const asUser = async (id: string, role = "authenticated") => {
      await db.exec("reset role");
      await db.query("select set_config('test.jwt',$1,false)", [JSON.stringify(id ? { sub:id } : {})]);
      await db.exec(`set role ${role}`);
    };
    const save = (userId = "user_a", front = `${userId}/abc.png`, back = `${userId}/def.png`, type = "Government ID") => db.query(`
      insert into public.kyc_submissions(user_id,id_type,document_type,id_number,dob,address,city,country,front_image,back_image,status,admin_notes,rejection_reason,reviewed_at,reviewed_by)
      values($1,$4,$4,'TEST','1990-01-01','12 Test Street','Lagos','Nigeria',$2,$3,'pending','','',null,null)
      on conflict(user_id) do update set id_type=excluded.id_type,document_type=excluded.document_type,id_number=excluded.id_number,dob=excluded.dob,address=excluded.address,city=excluded.city,country=excluded.country,front_image=excluded.front_image,back_image=excluded.back_image,status='pending',admin_notes='',rejection_reason='',reviewed_at=null,reviewed_by=null
      returning *`, [userId,front,back,type]);
    const review = (id: string, status: string, notes: string, rev: number) => db.query<any>("select public.review_kyc_submission($1,$2,$3,$4) as result", [id,status,notes,rev]);
    await asUser("user_a");
    await db.exec("insert into storage.objects values ('kyc-documents','user_a/abc.png'),('kyc-documents','user_a/def.png'),('other-bucket','anything')");
    await assert.rejects(db.exec("insert into storage.objects values ('kyc-documents','user_b/abc.png')"), /row-level security/);
    await assert.rejects(db.exec("insert into storage.objects values ('kyc-documents','user_a/path.svg')"), /row-level security/);
    await assert.rejects(save("user_b"), /own pending/);
    await assert.rejects(save("user_a", "user_b/abc.png"), /belonging/);
    await assert.rejects(save("user_a", "user_a/aaa.png"), /existing upload/);
    await assert.rejects(save("user_a", "user_a/abc.png", ""), /Required identity images/);
    const first = (await save()).rows[0] as any;
    assert.equal(first.status, "pending"); assert.equal(first.revision, 1);
    await assert.rejects(save(), /cannot be replaced/);
    await assert.rejects(db.exec("update kyc_submissions set status='approved' where user_id='user_a'"), /own pending/);
    await assert.rejects(review("user_a", "approved", "", 1), /Only an admin/);
    assert.equal((await db.query("delete from storage.objects where bucket_id='kyc-documents' returning *")).rows.length, 0);
    assert.equal((await db.query("update storage.objects set name='user_a/aaa.png' where bucket_id='kyc-documents' returning *")).rows.length, 0);
    await asUser("user_b");
    assert.equal((await db.query("select * from kyc_submissions")).rows.length, 0);
    assert.equal((await db.query("select * from storage.objects where bucket_id='kyc-documents'")).rows.length, 0);
    await asUser("", "anon");
    assert.equal((await db.query("select * from storage.objects where bucket_id='kyc-documents'")).rows.length, 0);
    await assert.rejects(db.query("select * from kyc_submissions"), /permission denied/);
    await assert.rejects(review("user_a", "approved", "", 1), /permission denied/);
    await asUser("admin");
    assert.equal((await db.query("select * from storage.objects where bucket_id='kyc-documents'")).rows.length, 2);
    await assert.rejects(review("user_a", "rejected", " ", 1), /reason/);
    await assert.rejects(db.exec("update kyc_submissions set status='approved',id_number='modified' where user_id='user_a'"), /cannot change/);
    let reviewed = (await review("user_a", "rejected", "Image is blurred", 1)).rows[0].result;
    assert.equal(reviewed.revision, 2); assert.equal(reviewed.reviewed_by, "admin");
    await assert.rejects(review("user_a", "approved", "", 1), /changed/);
    await asUser("user_a");
    const resubmitted = (await save()).rows[0] as any;
    assert.equal(resubmitted.revision, 3); assert.equal(resubmitted.reviewed_at, null);
    assert.equal(resubmitted.reviewed_by, null); assert.equal(resubmitted.rejection_reason, "");
    await asUser("admin");
    await assert.rejects(review("user_a", "approved", "", 1), /changed/);
    reviewed = (await review("user_a", "approved", "Verified", 3)).rows[0].result;
    assert.equal(reviewed.status, "approved"); assert.equal(reviewed.revision, 4);
    await assert.rejects(review("user_a", "approved", "Verified", 3), /changed/);
    await asUser("user_a");
    await assert.rejects(save(), /cannot be replaced/);
    await asUser("user_b");
    await db.exec("insert into storage.objects values ('kyc-documents','user_b/abc.png')");
    assert.equal(((await save("user_b", "user_b/abc.png", "", "Passport")).rows[0] as any).status, "pending");
    await asUser("admin");
    await db.exec("insert into storage.objects values ('kyc-documents','admin/abc.png')");
    await save("admin", "admin/abc.png", "", "Passport");
    await assert.rejects(review("admin", "approved", "", 1), /own KYC/);
    await db.exec("reset role");
    // Model a pre-migration pending record without images, without changing it.
    await db.exec("alter table kyc_submissions disable trigger guard_kyc_submission; insert into kyc_submissions(user_id,id_type,document_type,id_number,dob,address,city,country,front_image,back_image,status) values('legacy','Passport','Passport','OLD','1990-01-01','Old address','Lagos','Nigeria','','','pending'); alter table kyc_submissions enable trigger guard_kyc_submission");
    await db.exec(migration);
    await asUser("admin");
    await assert.rejects(review("legacy", "approved", "", 0), /Required identity images/);
    assert.equal((await review("legacy", "rejected", "Please attach your passport photo page", 0)).rows[0].result.status, "rejected");
    await db.exec("reset role");
    assert.equal((await db.query("select * from kyc_submissions")).rows.length, 4);
    await db.exec("update storage.buckets set public=true where id='kyc-documents'");
    await assert.rejects(db.exec(migration), /bucket settings differ/);
    await db.exec("rollback");
  } finally { await db.close(); }
});
