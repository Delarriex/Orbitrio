import { DEFAULT_CURRENCY, FALLBACK_GUEST_EMAIL } from "../constants";
import { TRANSACTION_STATUSES } from "../constants/statuses";
import type { Transaction, TransactionType } from "../types";
import { timestampId } from "./utils";

type LedgerActor = {
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
};

type LedgerOptions = {
  relatedReferenceId?: string;
  timestamp?: string;
  currency?: string;
};

export const isoTimestamp = () => new Date().toISOString();

export const dateFromTimestamp = (timestamp: string) => timestamp.split("T")[0];

export const getLedgerUserId = (email?: string | null) => email || FALLBACK_GUEST_EMAIL;

export const getLedgerUserName = (name?: string | null, email?: string | null) =>
  name || email?.split("@")[0]?.toUpperCase() || "Guest User";

export const enrichTransaction = (
  transaction: Transaction,
  actor: LedgerActor = {},
  options: LedgerOptions = {}
): Transaction => {
  const timestamp = options.timestamp || transaction.timestamp || isoTimestamp();
  const userEmail = actor.userEmail || transaction.userEmail || actor.userId || FALLBACK_GUEST_EMAIL;
  const userId = actor.userId || transaction.userId || getLedgerUserId(userEmail);
  const userName = actor.userName || transaction.userName || getLedgerUserName(undefined, userEmail);
  const currency = options.currency || transaction.currency || transaction.asset || DEFAULT_CURRENCY;

  return {
    ...transaction,
    userId,
    userName,
    currency,
    asset: transaction.asset || currency,
    relatedReferenceId: options.relatedReferenceId || transaction.relatedReferenceId || transaction.txHash || transaction.id,
    timestamp,
    date: transaction.date || dateFromTimestamp(timestamp),
    userEmail
  };
};

export const buildTransaction = (
  prefix: string,
  type: TransactionType,
  amount: number,
  asset = DEFAULT_CURRENCY,
  overrides: Partial<Transaction> = {},
  actor: LedgerActor = {},
  options: LedgerOptions = {}
): Transaction => enrichTransaction({
  id: timestampId(prefix),
  type,
  amount,
  status: TRANSACTION_STATUSES.COMPLETED,
  asset,
  date: dateFromTimestamp(options.timestamp || isoTimestamp()),
  ...overrides
} as Transaction, actor, options);
