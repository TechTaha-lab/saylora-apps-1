import nodemailer from "nodemailer";

// Create transporter lazily on each call so env vars are read at send-time,
// not at module-load time (important for Replit Secrets picked up after start).
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function getFrom() {
  return `"${process.env.SMTP_FROM_NAME ?? "Saylora"}" <${process.env.SMTP_FROM_EMAIL ?? "noreply@saylora.store"}>`;
}

export async function sendVerificationEmail(email: string, otp: string): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFrom(),
    to: email,
    replyTo: process.env.AUTH_REPLY_TO_EMAIL,
    subject: "Verify your Saylora email",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0D0D14;color:#fff;border-radius:12px">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:700;color:#7C3AED">saylora</span>
        </div>
        <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">Verify your email</h1>
        <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6">
          Enter the code below to verify your email address and activate your Saylora store.
        </p>
        <div style="background:#1A1A2E;border:1px solid #2d2d4a;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#7C3AED">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0">This code expires in 10 minutes.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, otp: string): Promise<void> {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: getFrom(),
    to: email,
    replyTo: process.env.AUTH_REPLY_TO_EMAIL,
    subject: "Reset your Saylora password",
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#0D0D14;color:#fff;border-radius:12px">
        <div style="margin-bottom:24px">
          <span style="font-size:22px;font-weight:700;color:#7C3AED">saylora</span>
        </div>
        <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">Reset your password</h1>
        <p style="color:#94a3b8;margin:0 0 24px;line-height:1.6">
          Use the code below to reset your Saylora password.
        </p>
        <div style="background:#1A1A2E;border:1px solid #2d2d4a;border-radius:10px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:700;letter-spacing:10px;color:#7C3AED">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:13px;margin:0">This code expires in 10 minutes.</p>
      </div>
    `,
  });
}
