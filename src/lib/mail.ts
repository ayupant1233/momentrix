import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM ?? "noreply@example.com";

const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmailVerificationCode(to: string, code: string) {
  if (!resendClient || !resendApiKey) {
    throw new Error("Resend API key missing. Set RESEND_API_KEY to send emails.");
  }

  const subject = "Your Momentrix verification code";
  const html = `
    <div style="font-family: Arial, sans-serif;">
      <h2>Verify your email</h2>
      <p>Use the one-time code below to verify your email address. The code expires in 10 minutes.</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${code}</p>
      <p>If you didn't request this, you can ignore this email.</p>
      <p>— The Momentrix Team</p>
    </div>
  `;

  await resendClient.emails.send({
    from: emailFrom,
    to,
    subject,
    html,
  });
}
