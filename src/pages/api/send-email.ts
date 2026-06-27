import { Request, Response } from "express";
import { Resend } from "resend";

export async function sendTransactionalEmail(to: string, eventType: string, metadata: any) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY environment variable is not configured.");
    }

    const resend = new Resend(apiKey);
    
    // Default fallback recipient if none specified
    let recipient = to || "no-reply@orbitriotrades.com";
    if (eventType === "WELCOME" && !to) {
      recipient = "no-reply@orbitriotrades.com";
    }

    let subject = "";
    let htmlContent = "";

    switch (eventType) {
      case "WELCOME":
        subject = "Welcome to Orbitrio Trades - Institutional Crypto Trading";
        htmlContent = `
          <div style="font-family: sans-serif; background-color: #07090e; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1a2233;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: lowercase;">orbit<span style="color: #F7931A;">rio</span>trades</span>
            </div>
            <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin-bottom: 16px;">Welcome to the Future of Trading, ${metadata.name || "Trader"}!</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Your institutional-grade trading account on the Orbitrio Trades platform has been successfully registered and activated. You now have access to global crypto markets, high-ROI investment plans, copy-trading tools, and advanced technical analytics.
            </p>
            <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <h3 style="color: #F7931A; font-size: 16px; font-weight: 600; margin-top: 0; margin-bottom: 12px;">Next Steps to Start:</h3>
              <ul style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Secure your account using dynamic wallet connection.</li>
                <li style="margin-bottom: 8px;">Explore our flexible investment tiers (Starter, Professional, VIP).</li>
                <li style="margin-bottom: 8px;">Follow top traders using our premium Copy Trading module.</li>
              </ul>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px;">
              Need help? Contact support at <a href="mailto:support@orbitriotrades.com" style="color: #F7931A; text-decoration: none;">support@orbitriotrades.com</a>.
            </p>
          </div>
        `;
        break;

      case "SECURITY_ALERT":
        subject = "[Security Alert] New Login Attempt Detected - Orbitrio Trades";
        htmlContent = `
          <div style="font-family: sans-serif; background-color: #07090e; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #ef4444;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: lowercase;">orbit<span style="color: #F7931A;">rio</span>trades</span>
            </div>
            <h2 style="color: #ef4444; font-size: 22px; font-weight: 700; margin-bottom: 16px;">New Login Notification</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              An authentication login event was detected for your Orbitrio Trades account. Please review the details below to ensure this was you:
            </p>
            <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px; font-family: monospace;">
              <p style="margin: 4px 0; color: #94a3b8;"><strong style="color: #ffffff;">Time:</strong> ${metadata.time || new Date().toUTCString()}</p>
              <p style="margin: 4px 0; color: #94a3b8;"><strong style="color: #ffffff;">IP Address:</strong> ${metadata.ip || "Unknown IP"}</p>
              <p style="margin: 4px 0; color: #94a3b8;"><strong style="color: #ffffff;">Location:</strong> ${metadata.location || "Unknown Location"}</p>
              <p style="margin: 4px 0; color: #94a3b8;"><strong style="color: #ffffff;">Device/Browser:</strong> ${metadata.device || "Web Session"}</p>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
              If this login attempt was unauthorized, please change your password immediately and contact support to lock your withdrawal channels.
            </p>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px;">
              Need help? Contact support at <a href="mailto:support@orbitriotrades.com" style="color: #F7931A; text-decoration: none;">support@orbitriotrades.com</a>.
            </p>
          </div>
        `;
        break;

      case "DEPOSIT_SUCCESS":
        subject = "Deposit Successfully Credited - Orbitrio Trades";
        htmlContent = `
          <div style="font-family: sans-serif; background-color: #07090e; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #10b981;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: lowercase;">orbit<span style="color: #F7931A;">rio</span>trades</span>
            </div>
            <h2 style="color: #10b981; font-size: 22px; font-weight: 700; margin-bottom: 16px;">Deposit Confirmed</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Great news! Your deposit has been successfully credited to your main balance and is now ready for market allocation.
            </p>
            <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Amount:</td>
                  <td style="padding: 6px 0; color: #ffffff; text-align: right; font-weight: bold;">${metadata.amount || "$0.00"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Network / Asset:</td>
                  <td style="padding: 6px 0; color: #ffffff; text-align: right;">${metadata.asset || "USDT"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Transaction Hash:</td>
                  <td style="padding: 6px 0; color: #94a3b8; text-align: right; font-family: monospace; font-size: 11px;">${metadata.txHash || "Internal Transfer"}</td>
                </tr>
              </table>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
              You can now activate active investment cycles or leverage professional copy trading with our top-performing global leaders.
            </p>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px;">
              Need help? Contact support at <a href="mailto:support@orbitriotrades.com" style="color: #F7931A; text-decoration: none;">support@orbitriotrades.com</a>.
            </p>
          </div>
        `;
        break;

      case "WITHDRAWAL_SUCCESS":
        subject = "Withdrawal Processed Successfully - Orbitrio Trades";
        htmlContent = `
          <div style="font-family: sans-serif; background-color: #07090e; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #3b82f6;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: lowercase;">orbit<span style="color: #F7931A;">rio</span>trades</span>
            </div>
            <h2 style="color: #3b82f6; font-size: 22px; font-weight: 700; margin-bottom: 16px;">Withdrawal Completed</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Your requested withdrawal has been processed and broadcasted to the secure blockchain networks.
            </p>
            <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Amount:</td>
                  <td style="padding: 6px 0; color: #ffffff; text-align: right; font-weight: bold;">${metadata.amount || "$0.00"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Destination Wallet:</td>
                  <td style="padding: 6px 0; color: #94a3b8; text-align: right; font-family: monospace; font-size: 11px;">${metadata.walletAddress || "Stored Custody"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Asset:</td>
                  <td style="padding: 6px 0; color: #ffffff; text-align: right;">${metadata.asset || "BTC"}</td>
                </tr>
              </table>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
              Funds should settle shortly depending on network confirmations.
            </p>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px;">
              Need help? Contact support at <a href="mailto:support@orbitriotrades.com" style="color: #F7931A; text-decoration: none;">support@orbitriotrades.com</a>.
            </p>
          </div>
        `;
        break;

      case "COPY_TRADE_ACTIVE":
        subject = "Professional Copy Trading Active - Orbitrio Trades";
        htmlContent = `
          <div style="font-family: sans-serif; background-color: #07090e; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #a855f7;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: lowercase;">orbit<span style="color: #F7931A;">rio</span>trades</span>
            </div>
            <h2 style="color: #a855f7; font-size: 22px; font-weight: 700; margin-bottom: 16px;">Copy Trading Synced</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              Your portfolio is now mirroring a professional market master. All trades executed by your chosen leader will be proportionally duplicated in your account.
            </p>
            <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Trader Name:</td>
                  <td style="padding: 6px 0; color: #ffffff; text-align: right; font-weight: bold;">${metadata.traderName || "Master Elite Trader"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Mirrored Allocation:</td>
                  <td style="padding: 6px 0; color: #ffffff; text-align: right;">${metadata.allocation || "$500.00"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Risk Ratio:</td>
                  <td style="padding: 6px 0; color: #ffffff; text-align: right;">${metadata.riskRatio || "1:1 Standard"}</td>
                </tr>
              </table>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
              You can monitor open positions and revoke mirror synchronization parameters at any time from your interactive dashboard.
            </p>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px;">
              Need help? Contact support at <a href="mailto:support@orbitriotrades.com" style="color: #F7931A; text-decoration: none;">support@orbitriotrades.com</a>.
            </p>
          </div>
        `;
        break;

      case "PROFIT_DISTRIBUTION":
        subject = "Orbitrio Trades Yield Settlement Credited";
        htmlContent = `
          <div style="font-family: sans-serif; background-color: #07090e; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #f59e0b;">
            <div style="text-align: center; margin-bottom: 30px;">
              <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: lowercase;">orbit<span style="color: #F7931A;">rio</span>trades</span>
            </div>
            <h2 style="color: #f59e0b; font-size: 22px; font-weight: 700; margin-bottom: 16px;">Profit Settlement Distributed</h2>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
              An active yield cycle or successful copy trading position has reached its settlement date. Your portion of the profit distribution has been processed.
            </p>
            <div style="background-color: #0f172a; border: 1px solid #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Net Profit:</td>
                  <td style="padding: 6px 0; color: #10b981; text-align: right; font-weight: bold;">+${metadata.profit || "$0.00"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Source:</td>
                  <td style="padding: 6px 0; color: #ffffff; text-align: right;">${metadata.source || "Yield Portfolio Settlement"}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #94a3b8; font-weight: 600;">Settlement Account:</td>
                  <td style="padding: 6px 0; color: #ffffff; text-align: right;">Main Multi-Sig Wallet Balance</td>
                </tr>
              </table>
            </div>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">
              Profits are immediately withdrawable or compounding. Keep trading, elevate your parameters, reach new orbits!
            </p>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px;">
              Need help? Contact support at <a href="mailto:support@orbitriotrades.com" style="color: #F7931A; text-decoration: none;">support@orbitriotrades.com</a>.
            </p>
          </div>
        `;
        break;

      default:
        throw new Error(`Unknown eventType: ${eventType}`);
    }

    const sender = apiKey.startsWith("re_") ? "Orbitrio Trades <onboarding@resend.dev>" : "Orbitrio Trades <support@orbitriotrades.com>";

    const emailResponse = await resend.emails.send({
      from: sender,
      to: [recipient],
      subject: subject,
      html: htmlContent,
    });

    return emailResponse;
}

export async function handleSendEmail(req: Request, res: Response) {
  try {
    const { to, eventType, metadata = {} } = req.body;
    if (!eventType) {
      return res.status(400).json({ success: false, error: "Missing required field: eventType" });
    }

    const emailResponse = await sendTransactionalEmail(to, eventType, metadata);

    return res.status(200).json({
      success: true,
      message: `Transactional email for ${eventType} dispatched successfully.`,
      data: emailResponse,
    });

  } catch (error: any) {
    console.error("Resend transactional email delivery failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || error,
    });
  }
}
