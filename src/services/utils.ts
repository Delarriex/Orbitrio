export const todayIsoDate = () => new Date().toISOString().split("T")[0];

export const timestampId = (prefix: string) => `${prefix}-${Date.now()}`;

export const roundMoney = (value: number) => +value.toFixed(2);

export const safeParse = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};
