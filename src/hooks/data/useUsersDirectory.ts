import { useState, useEffect, useCallback } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CoreUserProfile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  gender: string | null;
  phone: string | null;
  accountType: string | null;
  country: string | null;
  currency: string | null;
  balance: number;
  portfolioValue: number;
  status: string;
  role: "user" | "admin";
  connectedWalletName: string | null;
  referralCount: number;
  points: number;
  registrationDate: string | null;
}

function rowToProfile(row: any): CoreUserProfile {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
    gender: row.gender,
    phone: row.phone,
    accountType: row.account_type,
    country: row.country,
    currency: row.currency,
    balance: row.balance,
    portfolioValue: row.portfolio_value,
    status: row.status,
    role: row.role,
    connectedWalletName: row.connected_wallet_name,
    referralCount: row.referral_count,
    points: row.points,
    registrationDate: row.registration_date
  };
}

/**
 * Read-only admin directory of ALL users — core profile fields only
 * (name, email, balance, status, role). Sourced entirely from Supabase's
 * `users` table.
 *
 * IMPORTANT: this does NOT include transactions, investments, copy trades,
 * or tickets — those are still embedded on the old Firebase-backed
 * `adminUsers` array and stay there until the full Users+Transactions
 * migration happens together (see project notes). This hook is purely
 * additive — it does not replace `adminUsers` or touch any
 * balance/transaction logic. Safe for admin browsing/search UI only.
 */
export function useUsersDirectory(supabase: SupabaseClient, authReady: boolean, isAdmin: boolean) {
  const [usersDirectory, setUsersDirectory] = useState<CoreUserProfile[]>([]);
  const [isLoadingDirectory, setIsLoadingDirectory] = useState(true);

  const refreshUsersDirectory = useCallback(async () => {
    if (!authReady || !isAdmin) {
      setUsersDirectory([]);
      setIsLoadingDirectory(false);
      return;
    }

    setIsLoadingDirectory(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("registration_date", { ascending: false });

    if (error) {
      console.error("Failed to load users directory:", error);
      setIsLoadingDirectory(false);
      return;
    }

    setUsersDirectory((data || []).map(rowToProfile));
    setIsLoadingDirectory(false);
  }, [supabase, authReady, isAdmin]);

  useEffect(() => {
    refreshUsersDirectory();
  }, [refreshUsersDirectory]);

  return { usersDirectory, isLoadingDirectory, refreshUsersDirectory };
}