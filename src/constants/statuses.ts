export const PLAN_STATUSES = {
  ACTIVE: "active",
  PAUSED: "paused"
} as const;

export const INVESTMENT_STATUSES = {
  ACTIVE: "active",
  COMPLETED: "completed",
  CANCELLED: "cancelled"
} as const;

export const USER_STATUSES = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
  BANNED: "banned"
} as const;

export const TRANSACTION_STATUSES = {
  COMPLETED: "completed",
  PENDING: "pending",
  FAILED: "failed",
  REJECTED: "rejected",
  APPROVED: "approved"
} as const;

export const KYC_STATUSES = {
  UNVERIFIED: "unverified",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected"
} as const;

export const TICKET_STATUSES = {
  OPEN: "open",
  RESOLVED: "resolved",
  PENDING: "pending"
} as const;

export const AirdropClaimStatuses = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected"
} as const;

export const AirdropStatuses = {
  LIVE: "Live",
  ACTIVE: "active",
  DISABLED: "disabled",
  ENDED: "ended"
} as const;
