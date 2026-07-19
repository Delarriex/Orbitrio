// Admin access is DB-role-driven: register, then set the user's role to 'admin'
// in Supabase (the client gate is useCurrentUser → users.role, and the server
// gate is the is_admin() RLS function). This hardcoded list is intentionally
// empty — no admin is granted by email. isAdminEmail() therefore always returns
// false, so every check falls back to role === 'admin'.
export const ADMIN_EMAILS: readonly string[] = [];

export const STORAGE_KEYS = {
  USER: "orbitrio_user",
  LOCAL_USERS: "orbitrio_local_users",
  ADMIN_WALLETS: "orbitrio_admin_wallets",
  ANNOUNCEMENTS: "orbitrio_announcements",
  AUDIT_LOGS: "orbitrio_audit_logs",
  NOTIFICATIONS: "orbitrio_notifications"
} as const;

export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_COUNTRY = "United States";
export const DEFAULT_ACCOUNT_TYPE = "Bronze";
export const FALLBACK_GUEST_EMAIL = "guest@gmail.com";
