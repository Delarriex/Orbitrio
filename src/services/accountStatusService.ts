import type { SupabaseClient } from "@supabase/supabase-js";
import { buildNotification, type NotificationItem } from "./notificationsService";
import type { UserStatus } from "../types/domain";

type Account = { id: string; email: string; name: string | null; status: string };

export async function changeAccountStatus(
  client: SupabaseClient,
  account: Account,
  status: UserStatus,
  delivery: {
    saveNotification: (notification: NotificationItem) => Promise<void>;
    sendSuspensionEmail: (email: string, metadata: Record<string, string>) => Promise<{ success: boolean }>;
  }
) {
  if (account.status === status) return { changed: false, failedDeliveries: [] as string[] };

  // Require a returned row: RLS may reject an update by matching zero rows.
  // Matching the displayed status also prevents concurrent admins sending duplicates.
  const { data, error } = await client.from("users")
    .update({ status }).eq("id", account.id).eq("status", account.status)
    .select("id, email, name, status").single();
  if (error) throw new Error(error.message || "Unable to change account status. Refresh and try again.");
  if (!data || data.status !== status) throw new Error("Account status was not updated. Refresh and try again.");
  if (status !== "suspended") return { changed: true, failedDeliveries: [] as string[] };

  const eventKey = `account:suspended:${account.id}:${crypto.randomUUID()}`;
  const notification = buildNotification({
    title: "Account suspended",
    message: "Your account has been suspended by an administrator. Your active investments and copy trades are paused, including earnings and maturity countdowns. Trading and withdrawals are disabled. Please contact support for assistance.",
    type: "warning",
    recipientEmail: data.email,
    audience: "user",
    eventKey,
    action: { label: "Contact support", view: "dashboard-support" }
  });

  // Attempt both channels even when one fails. The status change is already saved.
  const results = await Promise.allSettled([
    Promise.resolve().then(() => delivery.saveNotification(notification)),
    Promise.resolve().then(async () => {
      const result = await delivery.sendSuspensionEmail(data.email, {
        name: data.name || data.email.split("@")[0], email: data.email,
        status, eventId: eventKey, date: notification.timestamp
      });
      if (!result?.success) throw new Error("Email delivery failed.");
    })
  ]);
  return {
    changed: true,
    failedDeliveries: results.flatMap((result, index) => result.status === "rejected" ? [index === 0 ? "in-app notification" : "email"] : [])
  };
}
