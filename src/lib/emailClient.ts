const localDev = import.meta.env.VITE_LOCAL_DEV === "true";

export type TransactionalEmailEvent =
  | "WELCOME"
  | "EMAIL_VERIFICATION"
  | "SECURITY_ALERT"
  | "DEPOSIT_SUBMITTED"
  | "DEPOSIT_APPROVED"
  | "DEPOSIT_REJECTED"
  | "DEPOSIT_SUCCESS"
  | "WITHDRAWAL_SUBMITTED"
  | "WITHDRAWAL_APPROVED"
  | "WITHDRAWAL_REJECTED"
  | "WITHDRAWAL_SUCCESS"
  | "INVESTMENT_STARTED"
  | "INVESTMENT_COMPLETED"
  | "PROFIT_DISTRIBUTION"
  | "COPY_TRADE_STARTED"
  | "COPY_TRADE_COMPLETED"
  | "COPY_TRADE_ACTIVE"
  | "KYC_SUBMITTED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "AIRDROP_CLAIM_SUBMITTED"
  | "AIRDROP_CLAIM_APPROVED"
  | "AIRDROP_CLAIM_REJECTED"
  | "ANNOUNCEMENT"
  | "TOPUP_SUCCESS";

export const sendTransactionalEmail = async (to: string, eventType: TransactionalEmailEvent, metadata: any = {}) => {
  if (localDev) {
    return { success: true, message: "Local dev mail stubbed." };
  }

  try {
    const response = await fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ to, eventType, metadata }),
    });
    const data = await response.json();
    if (!data.success) {
      console.error(`Email sending failed for ${eventType}:`, data.error);
    }
    return data;
  } catch (error) {
    console.error(`Email sending failed for ${eventType}:`, error);
    return { success: false, error };
  }
};

export const sendPasswordResetRequestEmail = async (email: string, metadata: any = {}) => {
  if (localDev) {
    return { success: true, message: "Local dev password reset mail stubbed." };
  }

  try {
    const response = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, metadata })
    });
    const data = await response.json();
    if (!data.success) {
      console.error("Password reset email failed:", data.error);
    }
    return data;
  } catch (error) {
    console.error("Password reset email failed:", error);
    return { success: false, error };
  }
};

export const sendWelcomeEmail = (to: string, name: string, metadata: any = {}) => sendTransactionalEmail(to, "WELCOME", { ...metadata, name, email: to });
export const sendSecurityAlert = (to: string, metadata: any) => sendTransactionalEmail(to, "SECURITY_ALERT", metadata);
export const sendDepositEmail = (to: string, metadata: any) => sendTransactionalEmail(to, "DEPOSIT_APPROVED", metadata);
export const sendWithdrawalEmail = (to: string, metadata: any) => sendTransactionalEmail(to, "WITHDRAWAL_APPROVED", metadata);
export const sendProfitEmail = (to: string, metadata: any) => sendTransactionalEmail(to, "INVESTMENT_COMPLETED", metadata);
export const sendCopyTradeEmail = (to: string, metadata: any) => sendTransactionalEmail(to, "COPY_TRADE_STARTED", metadata);
export const sendTopUpEmail = (to: string, metadata: any) => sendTransactionalEmail(to, "TOPUP_SUCCESS", metadata);


