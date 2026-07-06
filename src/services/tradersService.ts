import type { TraderProfile } from "../types";

export const incrementTraderFollowers = (traders: TraderProfile[], traderId: string) =>
  traders.map(trader => trader.id === traderId ? { ...trader, followers: trader.followers + 1 } : trader);

export const decrementTraderFollowers = (traders: TraderProfile[], traderId: string) =>
  traders.map(trader => trader.id === traderId ? { ...trader, followers: Math.max(trader.followers - 1, 0) } : trader);
