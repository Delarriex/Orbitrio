import type { AuditLog, Transaction } from "../types";

export const buildAuditLog = (
  action: string,
  details: string,
  email: string,
  status: AuditLog["status"]
): AuditLog => ({
  id: `audit-${Date.now()}-${Math.floor(Math.random() * 100)}`,
  action,
  details,
  timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
  email,
  ip: "185.112.55.91",
  status
});

export const setTransactionStatus = (
  transactions: Transaction[],
  txId: string,
  status: Transaction["status"],
  notes?: string
) => transactions.map(tx => tx.id === txId ? { ...tx, status, ...(notes ? { notes } : {}) } : tx);
