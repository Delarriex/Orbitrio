import assert from "node:assert/strict";
import test from "node:test";
import { changeAccountStatus } from "../src/services/accountStatusService";
import { buildEmail } from "../api/send-email";
import { useNotifications } from "../src/hooks/data/useNotifications";

const account = { id: "user_1", email: "Trader@example.com", name: "Trader", status: "active" };
function fixture(response = { data: { ...account, status: "suspended" }, error: null } as any, displayedStatus = "active") {
  const calls: string[] = [];
  const client = { from(table: string) {
    assert.equal(table, "users");
    return { update(values: any) {
      calls.push(`update:${values.status}`);
      const query = {
        eq(column: string, value: string) {
          assert.equal(value, column === "id" ? account.id : displayedStatus);
          return query;
        },
        select: () => ({ single: async () => response })
      };
      return query;
    } };
  } } as any;
  const delivery = {
    async saveNotification(notification: any) {
      calls.push("notification");
      assert.equal(notification.recipientEmail, account.email);
      assert.equal(notification.audience, "user");
      assert.equal(notification.read, false);
      assert.match(notification.message, /account has been suspended/);
    },
    async sendSuspensionEmail(email: string, metadata: any) {
      calls.push("email");
      assert.equal(email, account.email);
      assert.equal(metadata.status, "suspended");
      assert.match(metadata.eventId, /^account:suspended:user_1:/);
      return { success: true };
    }
  };
  return { client, calls, delivery };
}

test("suspension confirms persistence before notifying the affected user through both channels", async () => {
  const { client, calls, delivery } = fixture();
  assert.deepEqual(await changeAccountStatus(client, account, "suspended", delivery), { changed: true, failedDeliveries: [] });
  assert.deepEqual(calls, ["update:suspended", "notification", "email"]);
});

test("failed, stale, denied or unconfirmed updates do not send alerts", async () => {
  for (const response of [
    { data: null, error: { message: "Permission denied" } },
    { data: null, error: null },
    { data: account, error: null }
  ]) {
    const { client, calls, delivery } = fixture(response);
    await assert.rejects(changeAccountStatus(client, account, "suspended", delivery));
    assert.deepEqual(calls, ["update:suspended"]);
  }
});

test("already suspended accounts do not send duplicate messages; activation does not send a suspension email", async () => {
  const f = fixture({ data: account, error: null });
  assert.equal((await changeAccountStatus(f.client, { ...account, status: "suspended" }, "suspended", f.delivery)).changed, false);
  assert.deepEqual(f.calls, []);
  const activation = fixture({ data: account, error: null }, "suspended");
  await changeAccountStatus(activation.client, { ...account, status: "suspended" }, "active", activation.delivery);
  assert.deepEqual(activation.calls, ["update:active"]);
});

test("delivery failures report the affected channel without skipping the other or undoing suspension", async () => {
  const f = fixture();
  f.delivery.saveNotification = async () => { throw new Error("Notification unavailable"); };
  assert.deepEqual((await changeAccountStatus(f.client, account, "suspended", f.delivery)).failedDeliveries, ["in-app notification"]);
  assert.ok(f.calls.includes("email"));
  const g = fixture();
  g.delivery.sendSuspensionEmail = async () => ({ success: false });
  assert.deepEqual((await changeAccountStatus(g.client, account, "suspended", g.delivery)).failedDeliveries, ["email"]);
  assert.ok(g.calls.includes("notification"));
});

test("suspension email includes account, support details and escaped user data", () => {
  const email = buildEmail("ACCOUNT_SUSPENDED", {
    companyName: "Orbitrio", name: "<script>alert(1)</script>",
    email: account.email, supportEmail: "help@example.com", status: "suspended"
  });
  assert.match(email.subject, /account has been suspended - Orbitrio/);
  assert.match(email.html, /Your account has been suspended/);
  assert.match(email.html, /Trader@example.com/);
  assert.match(email.html, /help@example.com/);
  assert.ok(!email.html.includes("<script>"));
});

test("notification fetch handles mixed-case email without treating address characters as wildcards", async () => {
  const client = { from: () => ({ select: () => ({ ilike(column: string, pattern: string) {
    assert.equal(column, "recipient_email");
    assert.equal(pattern, "Trader\\_100\\%@example.com");
    return { order: async () => ({ data: [], error: null }) };
  } }) }) } as any;
  assert.deepEqual(await useNotifications(client).fetchNotifications("Trader_100%@example.com"), []);
});
