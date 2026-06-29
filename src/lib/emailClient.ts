export const sendTransactionalEmail = async (to: string, eventType: string, metadata: any) => {
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
  }
};

export const sendWelcomeEmail = (to: string, name: string) => sendTransactionalEmail(to, "WELCOME", { name });
export const sendSecurityAlert = (to: string, metadata: any) => sendTransactionalEmail(to, "SECURITY_ALERT", metadata);
export const sendDepositEmail = (to: string, metadata: any) => sendTransactionalEmail(to, "DEPOSIT_SUCCESS", metadata);
export const sendWithdrawalEmail = (to: string, metadata: any) => sendTransactionalEmail(to, "WITHDRAWAL_SUCCESS", metadata);
export const sendProfitEmail = (to: string, metadata: any) => sendTransactionalEmail(to, "PROFIT_DISTRIBUTION", metadata);
export const sendCopyTradeEmail = (to: string, metadata: any) => sendTransactionalEmail(to, "COPY_TRADE_ACTIVE", metadata);
