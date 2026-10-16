import type { SupabaseClient } from "@supabase/supabase-js";

export const ACCOUNT_RESTRICTED_MESSAGE = "Your account is suspended or restricted. Trading, investing and withdrawals are disabled. Please contact support.";

// Always fetch current status: an already-open tab may predate the suspension.
// The database migration enforces this again atomically with the actual write.
export async function getFinancialAccessError(client: SupabaseClient, userId: string | null): Promise<string | null> {
  if (!userId) return "You must be signed in to continue.";
  try {
    const { data, error } = await client.from("users").select("status").eq("id", userId).single();
    if (error || !data) return "Unable to verify your account status. Please try again.";
    return data.status === "active" ? null : ACCOUNT_RESTRICTED_MESSAGE;
  } catch {
    return "Unable to verify your account status. Please try again.";
  }
}

export function financialActionError(error: unknown, fallback: string): string {
  const message = (error as { message?: unknown })?.message;
  return typeof message === "string" && message.includes("Trading, investing and withdrawals are disabled")
    ? ACCOUNT_RESTRICTED_MESSAGE : fallback;
}
