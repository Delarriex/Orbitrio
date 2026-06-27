import { 
  sendWelcomeEmail, 
  sendSecurityAlert, 
  sendDepositEmail, 
  sendWithdrawalEmail
} from "../lib/emailClient";

export const useEmailNotifications = () => {
  return { 
    sendWelcomeEmail, 
    sendSecurityAlert, 
    sendDepositEmail, 
    sendWithdrawalEmail
  };
};
