export const ADMIN_EMAILS = ["henrikaram1@gmail.com", "testuser@gmail.com"] as const;

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
