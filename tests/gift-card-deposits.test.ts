import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { COUNTRIES } from "../src/constants/countries";
import { buildDepositTransaction } from "../src/services/walletService";
import { validateGiftCard, uploadGiftCardImage, MAX_GIFT_CARD_IMAGE_BYTES } from "../src/services/giftCardService";

const details = { brand: "Test card", faceValue: 100, currency: "USD" };
const image = new File([new Uint8Array([1, 2, 3])], "card.png", { type: "image/png" });

test("country coverage includes all 249 ISO regions plus Kosovo, without duplicates", () => {
  assert.equal(COUNTRIES.length, 250);
  assert.equal(new Set(COUNTRIES.map(c => c.code)).size, 250);
  assert.equal(new Set(COUNTRIES.map(c => c.name)).size, 250);
  for (const code of ["NG", "GH", "KE", "TZ", "UG", "CM", "NZ", "PS", "TW", "XK", "SS", "VA"]) {
    assert.ok(COUNTRIES.some(country => country.code === code), code);
  }
  for (const name of ["United States", "United Kingdom", "Nigeria", "United Arab Emirates"]) {
    assert.ok(COUNTRIES.some(country => country.name === name), `Preserve ${name}`);
  }
  assert.deepEqual(COUNTRIES, [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name, "en")));
});

test("gift card validation rejects missing images, invalid amounts and unsafe files", () => {
  assert.equal(validateGiftCard(details, 90, [image]), null);
  for (const amount of [0, -1, NaN, Infinity]) assert.ok(validateGiftCard(details, amount, [image]));
  assert.ok(validateGiftCard({ ...details, faceValue: -1 }, 90, [image]));
  assert.ok(validateGiftCard({ ...details, brand: " " }, 90, [image]));
  assert.ok(validateGiftCard({ ...details, currency: "US" }, 90, [image]));
  assert.ok(validateGiftCard(details, 90, []));
  assert.ok(validateGiftCard(details, 90, Array(5).fill(image)));
  assert.ok(validateGiftCard(details, 90, [new File(["<svg />"], "card.svg", { type: "image/svg+xml" })]));
  assert.ok(validateGiftCard(details, 90, [new File([], "empty.png", { type: "image/png" })]));
  assert.ok(validateGiftCard(details, 90, [new File([new Uint8Array(MAX_GIFT_CARD_IMAGE_BYTES + 1)], "big.png", { type: "image/png" })]));
});

test("uploads use a private bucket and generated owner-scoped paths; failures propagate", async () => {
  let uploadedPath = "";
  const client = { storage: { from(bucket: string) {
    assert.equal(bucket, "gift-card-proofs");
    return { async upload(path: string, file: File, options: any) {
      uploadedPath = path;
      assert.equal(file, image);
      assert.equal(options.upsert, false);
      return { error: null };
    } };
  } } } as any;
  assert.equal(await uploadGiftCardImage(client, "user_a", image), uploadedPath);
  assert.match(uploadedPath, /^user_a\/[0-9a-f-]+\.png$/);
  await assert.rejects(uploadGiftCardImage(client, "", image));
  const failing = { storage: { from: () => ({ upload: async () => ({ error: new Error("Upload failed") }) }) } } as any;
  await assert.rejects(uploadGiftCardImage(failing, "user_a", image), /Upload failed/);
});

test("crypto deposits stay pending and never invent receipts or transaction hashes", () => {
  const { transaction } = buildDepositTransaction(100, "USDT", "test@example.com", {});
  assert.equal(transaction.status, "pending");
  assert.equal(transaction.proofFile, undefined);
  assert.equal(transaction.txHash, undefined);
});

test("migration, private storage policies, ownership validation and admin-only credit", async () => {
  const db = new PGlite();
  try {
    // Minimal model of the existing live schema/auth contract. No live data.
    await db.exec(`
      create role authenticated;
      create schema auth; create schema storage;
      create function auth.jwt() returns jsonb language sql stable as
        $$ select coalesce(nullif(current_setting('test.jwt', true), ''), '{}')::jsonb $$;
      create function public.is_admin() returns boolean language sql stable as
        $$ select coalesce(auth.jwt()->>'sub' = 'admin', false) $$;
      create function storage.foldername(name text) returns text[] language sql immutable as
        $$ select string_to_array(name, '/') $$;
      create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
      create table storage.objects (bucket_id text, name text, primary key(bucket_id, name));
      alter table storage.objects enable row level security;
      create table public.users (id text primary key, balance numeric default 0);
      insert into public.users(id) values ('user_a'), ('user_b'), ('admin');
      create table public.transactions (id text primary key, user_id text, type text, amount numeric, currency text, status text, notes text);
      alter table public.transactions enable row level security;
      create policy own_insert on public.transactions for insert to authenticated
        with check(user_id = auth.jwt()->>'sub' and status = 'pending');
      create policy own_read on public.transactions for select to authenticated
        using(user_id = auth.jwt()->>'sub' or public.is_admin());
      grant usage on schema auth, storage, public to authenticated;
      grant select, insert on storage.objects, public.transactions to authenticated;
      insert into public.transactions values ('old_crypto', 'user_a', 'deposit', 20, 'USDT', 'pending', null);
    `);
    const migration = await readFile(new URL("../gift_card_deposits.sql", import.meta.url), "utf8");
    await db.exec(migration);
    await db.exec(migration); // Safe to re-run.
    const rpc = await readFile(new URL("../transaction_functions.sql", import.meta.url), "utf8");
    await db.exec(rpc.slice(0, rpc.indexOf("-- User requests a withdrawal")));
    const bucket = (await db.query<any>("select * from storage.buckets where id = 'gift-card-proofs'")).rows[0];
    assert.equal(bucket.public, false);
    assert.equal(Number(bucket.file_size_limit), MAX_GIFT_CARD_IMAGE_BYTES);
    assert.deepEqual(bucket.allowed_mime_types, ["image/jpeg", "image/png", "image/webp"]);
    const asUser = async (id: string) => {
      await db.exec("reset role");
      await db.query("select set_config('test.jwt', $1, false)", [JSON.stringify({ sub: id })]);
      await db.exec("set role authenticated");
    };
    const insertGift = (id: string, paths = ["user_a/card.png"], amount = "90", card = details) => db.query(
      `insert into public.transactions(id,user_id,type,amount,currency,status,payment_method,gift_card_details,gift_card_image_paths)
       values($1,'user_a','deposit',$2,'USD','pending','gift_card',$3,$4)`,
      [id, amount, JSON.stringify(card), paths]
    );
    await asUser("user_a");
    await db.exec("insert into storage.objects values ('gift-card-proofs','user_a/card.png')");
    await assert.rejects(db.exec("insert into storage.objects values ('gift-card-proofs','user_b/card.png')"), /row-level security/);
    await insertGift("gift_1");
    await assert.rejects(insertGift("missing", []), /between 1 and 4/);
    await assert.rejects(insertGift("too_many", Array(5).fill("user_a/card.png")), /between 1 and 4/);
    await assert.rejects(insertGift("not_uploaded", ["user_a/missing.png"]), /existing upload/);
    await assert.rejects(insertGift("negative", undefined, "-2"), /positive USD/);
    await assert.rejects(insertGift("nonfinite", undefined, "NaN"), /positive USD/);
    await assert.rejects(insertGift("invalid_card", undefined, "90", { ...details, faceValue: -1 }), /face value/);
    await assert.rejects(db.exec("select approve_deposit_transaction('gift_1')"), /Only an admin/);
    await assert.rejects(db.exec("select complete_own_deposit_transaction('gift_1')"), /self-completion is disabled/);
    await asUser("user_b");
    assert.equal((await db.query("select * from storage.objects")).rows.length, 0);
    assert.equal((await db.query("select * from public.transactions")).rows.length, 0);
    await db.exec("insert into storage.objects values ('gift-card-proofs','user_b/card.png')");
    await asUser("user_a");
    await assert.rejects(insertGift("other_user", ["user_b/card.png"]), /belonging to this user/);
    await asUser("admin");
    assert.equal((await db.query("select * from storage.objects")).rows.length, 2);
    await db.exec("select approve_deposit_transaction('gift_1'); select approve_deposit_transaction('gift_1');");
    await db.exec("reset role");
    assert.equal((await db.query<any>("select balance from users where id='user_a'")).rows[0].balance, "90");
    assert.equal((await db.query<any>("select status from transactions where id='gift_1'")).rows[0].status, "completed");
    assert.equal((await db.query<any>("select payment_method from transactions where id='old_crypto'")).rows[0].payment_method, "crypto");
    await asUser("user_a");
    await insertGift("gift_reject");
    await asUser("admin");
    await db.exec("select reject_deposit_transaction('gift_reject', 'Card could not be verified')");
    await db.exec("reset role");
    assert.equal((await db.query<any>("select balance from users where id='user_a'")).rows[0].balance, "90");
  } finally {
    await db.close();
  }
});
