import type { VercelRequest, VercelResponse } from "@vercel/node";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    // Initialize Firebase Admin if not already initialized
    if (!getApps().length) {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (!serviceAccountKey) {
        return res.status(500).json({ success: false, error: "FIREBASE_SERVICE_ACCOUNT_KEY is not configured in Vercel environment variables." });
      }

      initializeApp({
        credential: cert(JSON.parse(serviceAccountKey)),
      });
    }

    // Generate the secure password reset link mathematically without triggering the default Firebase email
    const resetLink = await getAuth().generatePasswordResetLink(email);

    // Call Resend directly to wrap the secure link in a premium Orbitrio Trades HTML template
    const { Resend } = await import("resend");
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return res.status(500).json({ success: false, error: "RESEND_API_KEY is not configured." });
    }

    const resend = new Resend(resendApiKey);
    const sender = process.env.RESEND_FROM_EMAIL || "Orbitrio Trades <onboarding@resend.dev>";
    const recipient = email;
    const subject = "Password Reset Request - Orbitrio Trades";

    const html = `
      <div style="font-family: sans-serif; background-color: #07090e; color: #ffffff; padding: 40px; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #1a2233;">
        <div style="text-align: center; margin-bottom: 30px;">
          <span style="font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; text-transform: lowercase;">orbit<span style="color: #F7931A;">rio</span>trades</span>
        </div>
        <h2 style="color: #ffffff; font-size: 22px; font-weight: 700; margin-bottom: 16px;">Password Reset Request</h2>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          We received a request to reset the password for your Orbitrio Trades account associated with <strong>${email}</strong>.
        </p>
        <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
          Click the secure button below to choose a new password. This link will expire shortly.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}" style="background-color: #F7931A; color: #ffffff; padding: 14px 28px; font-size: 15px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Reset Password</a>
        </div>
        <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; margin-bottom: 24px; text-align: center;">
          If the button doesn't work, copy and paste this secure link into your browser:<br/>
          <a href="${resetLink}" style="color: #3b82f6; word-break: break-all;">${resetLink}</a>
        </p>
        <p style="color: #ef4444; font-size: 13px; line-height: 1.6; margin-bottom: 24px; font-weight: bold;">
          If you did not request a password reset, please ignore this email or contact support immediately to lock your account.
        </p>
        <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b; padding-top: 20px;">
          Secure Auth Infrastructure by Orbitrio Trades.
        </p>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: sender,
      to: [recipient],
      subject,
      html,
    });

    return res.status(200).json({ success: true, message: "Password reset email dispatched successfully.", data: emailResponse });

  } catch (error: any) {
    console.error("Failed to generate or send password reset link:", error);
    return res.status(500).json({ success: false, error: error.message || String(error) });
  }
}
