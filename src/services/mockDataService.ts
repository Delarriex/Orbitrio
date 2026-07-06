import type { Airdrop, AirdropClaim, DepositWallet, InvestmentPlan, TraderProfile } from "../types";
import { DEFAULT_INVESTMENT_PLANS, normalizeInvestmentPlan, sortInvestmentPlans } from "./investmentsService";
import { buildDepositWallet, sortDepositWallets } from "./walletService";
import { timestampId } from "./utils";

export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === "true";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value));

const mockStore = {
  investmentPlans: clone(DEFAULT_INVESTMENT_PLANS),
  traders: null as TraderProfile[] | null,
  depositWallets: null as DepositWallet[] | null,
  airdrops: [] as Airdrop[],
  airdropClaims: [] as AirdropClaim[]
};

export const getMockInvestmentPlans = () => sortInvestmentPlans(clone(mockStore.investmentPlans));

export const createMockInvestmentPlan = (plan: Omit<InvestmentPlan, "id">) => {
  const id = `plan-${Date.now()}`;
  const freshPlan = normalizeInvestmentPlan(id, { ...plan, id });
  mockStore.investmentPlans = sortInvestmentPlans([...mockStore.investmentPlans, freshPlan]);
  return clone(freshPlan);
};

export const saveMockInvestmentPlan = (plan: InvestmentPlan) => {
  const normalized = normalizeInvestmentPlan(plan.id, plan);
  mockStore.investmentPlans = sortInvestmentPlans(
    mockStore.investmentPlans.map(item => item.id === normalized.id ? normalized : item)
  );
  return clone(normalized);
};

export const deleteMockInvestmentPlan = (planId: string) => {
  mockStore.investmentPlans = mockStore.investmentPlans.filter(plan => plan.id !== planId);
};

export const setMockInvestmentPlanEnabled = (planId: string, enabled: boolean) => {
  const status = enabled ? "active" as const : "paused" as const;
  mockStore.investmentPlans = sortInvestmentPlans(
    mockStore.investmentPlans.map(plan => plan.id === planId ? { ...plan, enabled, status } : plan)
  );
};

export const getMockTraders = (fallback: TraderProfile[]) => {
  if (!mockStore.traders) mockStore.traders = clone(fallback);
  return clone(mockStore.traders);
};

export const saveMockTrader = (trader: TraderProfile) => {
  const existing = mockStore.traders || [];
  mockStore.traders = existing.some(item => item.id === trader.id)
    ? existing.map(item => item.id === trader.id ? trader : item)
    : [...existing, trader];
  return clone(trader);
};

export const deleteMockTrader = (traderId: string) => {
  mockStore.traders = (mockStore.traders || []).filter(trader => trader.id !== traderId);
};

export const getMockDepositWallets = (fallback: DepositWallet[] = []) => {
  if (!mockStore.depositWallets) mockStore.depositWallets = clone(fallback);
  return sortDepositWallets(clone(mockStore.depositWallets));
};

export const saveMockDepositWallet = (walletInput: DepositWallet | Omit<DepositWallet, "id">) => {
  const wallet = buildDepositWallet(walletInput as DepositWallet & { id?: string });
  const existing = mockStore.depositWallets || [];
  mockStore.depositWallets = sortDepositWallets(
    existing.some(item => item.id === wallet.id)
      ? existing.map(item => item.id === wallet.id ? wallet : item)
      : [...existing, wallet]
  );
  return clone(wallet);
};

export const deleteMockDepositWallet = (walletId: string) => {
  mockStore.depositWallets = (mockStore.depositWallets || []).filter(wallet => wallet.id !== walletId);
};

export const getMockAirdrops = () => clone(mockStore.airdrops);
export const getMockAirdropClaims = () => clone(mockStore.airdropClaims);

export const saveMockAirdrop = (airdrop: Airdrop) => {
  mockStore.airdrops = mockStore.airdrops.some(item => item.id === airdrop.id)
    ? mockStore.airdrops.map(item => item.id === airdrop.id ? airdrop : item)
    : [...mockStore.airdrops, airdrop];
  return clone(airdrop);
};

export const createMockAirdrop = (airdrop: Omit<Airdrop, "id">) => {
  const freshAirdrop = { ...airdrop, id: timestampId("airdrop") };
  mockStore.airdrops = [...mockStore.airdrops, freshAirdrop];
  return clone(freshAirdrop);
};

export const deleteMockAirdrop = (airdropId: string) => {
  mockStore.airdrops = mockStore.airdrops.filter(airdrop => airdrop.id !== airdropId);
};

export const saveMockAirdropClaim = (claim: AirdropClaim) => {
  mockStore.airdropClaims = mockStore.airdropClaims.some(item => item.id === claim.id)
    ? mockStore.airdropClaims.map(item => item.id === claim.id ? claim : item)
    : [...mockStore.airdropClaims, claim];
  return clone(claim);
};

export const updateMockAirdropClaimStatus = (claimId: string, status: AirdropClaim["status"]) => {
  mockStore.airdropClaims = mockStore.airdropClaims.map(claim => claim.id === claimId ? { ...claim, status } : claim);
};

