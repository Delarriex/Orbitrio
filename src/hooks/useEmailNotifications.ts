import { 
  sendWelcomeEmail, 
  sendSecurityAlert, 
  sendDepositEmail, 
  sendWithdrawalEmail,
  sendProfitEmail,
  sendCopyTradeEmail,
  sendTopUpEmail
} from "../lib/emailClient";

export const useEmailNotifications = () => {
  return { 
    sendWelcomeEmail, 
    sendSecurityAlert, 
    sendDepositEmail, 
    sendWithdrawalEmail,
    sendProfitEmail,
    sendCopyTradeEmail,
    sendTopUpEmail
  };
};
