import type { VercelRequest, VercelResponse } from "@vercel/node";
import crypto from "crypto";

// Helper function to generate an OAuth2 Access Token from a Service Account Key
async function getFirebaseAccessToken(serviceAccount: any): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/identitytoolkit",
    aud: "https://oauth2.googleapis.com/token",
    exp,
    iat
  };

  const encodeB64 = (obj: any) => Buffer.from(JSON.stringify(obj)).toString("base64url");
  const signatureInput = `${encodeB64(header)}.${encodeB64(claim)}`;
  
  const sign = crypto.createSign("RSA-SHA256");
  sign.update(signatureInput);
  const signature = sign.sign(serviceAccount.private_key, "base64url");
  
  const jwt = `${signatureInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`
  });

  const data = await res.json();
  if (!res.ok) throw new Error("Failed to generate access token: " + JSON.stringify(data));
  return data.access_token;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ success: false, error: "Method not allowed" });
    }

    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ success: false, error: "Email is required" });
    }

    // 1. We completely bypassed firebase-admin to avoid Vercel Serverless ESM crashes!
    // We use Node's native crypto to generate an admin token, granting us permission to use returnOobLink=true
    const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountStr) {
      return res.status(500).json({ success: false, error: "FIREBASE_SERVICE_ACCOUNT_KEY is not configured in Vercel." });
    }
    
    let serviceAccount;
    try {
      serviceAccount = JSON.parse(serviceAccountStr);
    } catch(e) {
      return res.status(500).json({ success: false, error: "FIREBASE_SERVICE_ACCOUNT_KEY is invalid JSON." });
    }

    const accessToken = await getFirebaseAccessToken(serviceAccount);
    const projectId = serviceAccount.project_id;

    // Make request to Firebase REST API as an ADMIN
    const firebaseRes = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:sendOobCode`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        requestType: "PASSWORD_RESET",
        email: email,
        returnOobLink: true
      })
    });

    const firebaseData = await firebaseRes.json();
    
    if (!firebaseRes.ok) {
      return res.status(400).json({ success: false, error: firebaseData.error?.message || "Failed to generate Firebase reset link" });
    }

    const resetLink = firebaseData.oobLink;
    if (!resetLink) {
      return res.status(500).json({ success: false, error: "Firebase succeeded but did not return an oobLink." });
    }

    // 2. Call Resend directly to wrap the secure link in a premium HTML template
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
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #030509; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #030509; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 520px; background-color: #0b101a; border: 1px solid #1a2233; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                <!-- Header -->
                <tr>
                  <td style="padding: 40px 40px 20px 40px; text-align: center;">
                    <div style="font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      orbit<span style="color: #F7931A;">rio</span>trades
                    </div>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding: 10px 40px 30px 40px;">
                    <h1 style="color: #f8fafc; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; text-align: center;">Reset your password</h1>
                    <p style="color: #94a3b8; font-size: 15px; line-height: 24px; margin: 0 0 24px 0; text-align: center;">
                      A request to reset the password for <strong style="color: #e2e8f0; font-weight: 600;">${email}</strong> has been initiated from a terminal node.
                    </p>
                    <p style="color: #94a3b8; font-size: 15px; line-height: 24px; margin: 0 0 32px 0; text-align: center;">
                      Use the secure link below to authenticate your identity and configure a new access key.
                    </p>
                    <!-- Button -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td align="center">
                          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #F7931A 0%, #e88209 100%); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(247, 147, 26, 0.25);">
                            Authenticate &amp; Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                    
                    <div style="margin-top: 32px; padding: 16px; background-color: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.1); border-radius: 8px;">
                      <p style="color: #fca5a5; font-size: 13px; line-height: 20px; margin: 0; text-align: center;">
                        <strong>Did not request this?</strong> If you did not initiate this reset protocol, please ignore this email. Your assets remain secured.
                      </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 24px 40px 40px 40px; border-top: 1px solid #1a2233; text-align: center;">
                    <p style="color: #64748b; font-size: 12px; line-height: 18px; margin: 0;">
                      Having trouble with the button?<br/>
                      <a href="${resetLink}" style="color: #3b82f6; word-break: break-all; text-decoration: underline;">Copy this secure manual link</a>
                    </p>
                    <p style="color: #475569; font-size: 12px; margin: 24px 0 0 0;">
                      &copy; ${new Date().getFullYear()} Orbitrio Trades. Automated Cryptographic Subsystem.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
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
    return res.status(500).json({ success: false, error: String(error.message || error) });
  }
}
