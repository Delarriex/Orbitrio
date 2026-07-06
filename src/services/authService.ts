import { ADMIN_EMAILS, DEFAULT_ACCOUNT_TYPE, DEFAULT_COUNTRY, DEFAULT_CURRENCY } from "../constants";
import { USER_STATUSES } from "../constants/statuses";
import type { SimulatedUser, UserState } from "../types";

export interface RegisterAdditionalData {
  username?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  phone?: string;
  accountType?: string;
  country?: string;
  currency?: string;
  password?: string;
}

export const isAdminEmail = (email?: string | null) => {
  const normalized = email?.toLowerCase();
  return !!normalized && ADMIN_EMAILS.includes(normalized as (typeof ADMIN_EMAILS)[number]);
};

export const createLoggedOutUser = (): UserState => ({
  isLoggedIn: false,
  email: null,
  name: null,
  balance: 0.00,
  portfolioValue: 0.00,
  activeInvestments: [],
  copyTrades: [],
  portfolio: [],
  transactions: [],
  tickets: [],
  status: USER_STATUSES.ACTIVE,
  role: "user",
  referralCount: 0,
  points: 0
});

export const createSignedOutUser = (): UserState => ({
  isLoggedIn: false,
  email: null,
  name: null,
  balance: 0.00,
  portfolioValue: 0,
  activeInvestments: [],
  copyTrades: [],
  portfolio: [],
  transactions: [],
  tickets: [],
  status: USER_STATUSES.ACTIVE,
  role: "user"
});

export const buildRegistrationUserDoc = (
  name: string,
  email: string,
  additionalData?: RegisterAdditionalData
) => {
  const isOwner = isAdminEmail(email);
  return {
    email,
    name: name.toUpperCase(),
    balance: 0.00,
    portfolioValue: 0.00,
    status: USER_STATUSES.ACTIVE,
    activeInvestments: [],
  copyTrades: [],
  portfolio: [],
    transactions: [],
    tickets: [],
    loginHistory: [{ date: new Date().toISOString().replace("T", " ").substring(0, 19), ip: "127.0.0.1", device: "Browser Registration" }],
    registrationDate: new Date().toISOString(),
    role: isOwner ? ("admin" as const) : ("user" as const),
    username: additionalData?.username || email.split("@")[0],
    firstName: additionalData?.firstName || name.split(" ")[0] || "Trader",
    lastName: additionalData?.lastName || name.split(" ").slice(1).join(" ") || "",
    gender: additionalData?.gender || "Male",
    phone: additionalData?.phone || "",
    accountType: additionalData?.accountType || DEFAULT_ACCOUNT_TYPE,
    country: additionalData?.country || DEFAULT_COUNTRY,
    currency: additionalData?.currency || DEFAULT_CURRENCY
  };
};

export const buildSimulatedUserFromRegistration = (
  name: string,
  email: string,
  additionalData?: RegisterAdditionalData
): SimulatedUser => ({
  email,
  name: name.toUpperCase(),
  balance: 0.00,
  portfolioValue: 0,
  status: USER_STATUSES.ACTIVE,
  activeInvestments: [],
  copyTrades: [],
  portfolio: [],
  transactions: [],
  tickets: [],
  loginHistory: [{ date: new Date().toISOString().replace("T", " ").substring(0, 19), ip: "127.0.0.1", device: "Desktop / Browser Session" }],
  registrationDate: new Date().toISOString(),
  username: additionalData?.username,
  firstName: additionalData?.firstName,
  lastName: additionalData?.lastName,
  gender: additionalData?.gender,
  phone: additionalData?.phone,
  accountType: additionalData?.accountType,
  country: additionalData?.country,
  currency: additionalData?.currency
});

