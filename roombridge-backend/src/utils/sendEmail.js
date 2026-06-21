const nodemailer = require("nodemailer");

/**
 * Create a nodemailer transporter.
 *
 * Original used `parseInt(process.env.EMAIL_PORT) || 587` but
 * parseInt('465') === 465 which is truthy, so the fallback never applies —
 * that's actually fine. The real bug: `secure` was set as a string comparison
 * `process.env.EMAIL_PORT === '465'` which works, but the check for a numeric
 * env var that's been parsed is unreliable. Normalise to a number before comparing.
 */
const createTransporter = () => {
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const secure = port === 465; // 465 uses SMTPS (TLS from start), 587 uses STARTTLS

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Add connection timeout to prevent hanging forever on bad SMTP config
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
};

/* ── Base sender ─────────────────────────────────────────── */

/**
 * Send an email.
 *
 * Original swallowed ALL errors via console.error. This means
 * forgotPassword emails failing silently would leave users unable to reset
 * their password with no feedback. Now we throw errors so the caller
 * (auth.controller forgotPassword) can catch and respond appropriately.
 *
 * Callers that want fire-and-forget (welcome emails) should catch errors
 * themselves:  sendEmail({...}).catch(err => console.error(err.message));
 *
 * @param {object} options
 * @param {string} options.to      - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html    - HTML body
 * @throws {Error} if mail delivery fails
 */
const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: `"RoomBridge" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
  console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  return info;
};

/* ── Shared layout wrapper ───────────────────────────────── */
const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>RoomBridge</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:#1A3A5C;padding:24px 32px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">RoomBridge</h1>
              <p style="margin:4px 0 0;color:#93c5fd;font-size:12px;">Smart Room Rental &amp; Roommate Matching</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;border:1px solid #e5e7eb;border-top:none;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;text-align:center;border-radius:0 0 12px 12px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                &copy; ${new Date().getFullYear()} RoomBridge Pakistan. All rights reserved.<br>
                <a href="${process.env.CLIENT_URL || "http://localhost:5173"}"
                   style="color:#2C5F8A;text-decoration:none;">roombridge.pk</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/* ── Email templates ─────────────────────────────────────── */

/**
 * Welcome email after successful registration.
 * @param {string} name
 */
const welcomeEmail = (name) =>
  layout(`
    <h2 style="color:#1A3A5C;margin-top:0;">Welcome, ${name}! 🎉</h2>
    <p style="color:#6b7280;line-height:1.7;">
      Your RoomBridge account is ready. Browse thousands of verified rooms
      across Pakistan, find compatible roommates, and connect with owners — all in one place.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/listings"
         style="background:#1A3A5C;color:#ffffff;padding:14px 32px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Browse Rooms
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;">
      If you didn't create this account, please contact us immediately.
    </p>
  `);

/**
 * Email verification email with a time-limited link.
 * @param {string} name
 * @param {string} verifyURL
 */
const verificationEmail = (name, verifyURL) =>
  layout(`
    <h2 style="color:#1A3A5C;margin-top:0;">Verify Your Email Address</h2>
    <p style="color:#6b7280;line-height:1.7;">Hi ${name},</p>
    <p style="color:#6b7280;line-height:1.7;">
      Thanks for signing up for RoomBridge! Please verify your email address
      by clicking the button below. <strong>This link expires in 24 hours.</strong>
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${verifyURL}"
         style="background:#1A3A5C;color:#ffffff;padding:14px 32px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Verify My Email
      </a>
    </div>
    <p style="color:#9ca3af;font-size:13px;">
      If the button doesn't work, copy and paste this link:<br>
      <a href="${verifyURL}" style="color:#2C5F8A;word-break:break-all;">${verifyURL}</a>
    </p>
    <p style="color:#9ca3af;font-size:13px;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  `);

/**
 * Password reset email with a time-limited link.
 * @param {string} name
 * @param {string} resetURL
 */
const resetPasswordEmail = (name, resetURL) =>
  layout(`
    <h2 style="color:#1A3A5C;margin-top:0;">Reset Your Password</h2>
    <p style="color:#6b7280;line-height:1.7;">Hi ${name},</p>
    <p style="color:#6b7280;line-height:1.7;">
      You requested a password reset. Click the button below to set a new password.
      <strong>This link expires in 15 minutes.</strong>
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${resetURL}"
         style="background:#1A3A5C;color:#ffffff;padding:14px 32px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color:#6b7280;font-size:13px;">
      Or copy this link:<br>
      <a href="${resetURL}" style="color:#2C5F8A;word-break:break-all;">${resetURL}</a>
    </p>
    <p style="color:#9ca3af;font-size:13px;">
      If you didn't request this, you can safely ignore this email. Your password won't change.
    </p>
  `);

/**
 * Booking accepted notification to the seeker.
 * @param {string} seekerName
 * @param {string} listingTitle
 */
const bookingAcceptedEmail = (seekerName, listingTitle) =>
  layout(`
    <h2 style="color:#10b981;margin-top:0;">✅ Booking Accepted!</h2>
    <p style="color:#6b7280;line-height:1.7;">Hi ${seekerName},</p>
    <p style="color:#6b7280;line-height:1.7;">
      Great news! The owner has <strong>accepted</strong> your booking request for:
    </p>
    <div style="background:#f0fdf4;border:1px solid #10b981;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;color:#065f46;font-weight:600;font-size:16px;">🏠 ${listingTitle}</p>
    </div>
    <p style="color:#6b7280;line-height:1.7;">
      You can now contact the owner directly through your dashboard to arrange move-in details.
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/seeker/requests"
         style="background:#1A3A5C;color:#ffffff;padding:14px 32px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        View My Bookings
      </a>
    </div>
  `);

/**
 * Booking rejected notification to the seeker.
 * @param {string} seekerName
 * @param {string} listingTitle
 * @param {string} [reason]
 */
const bookingRejectedEmail = (seekerName, listingTitle, reason = "") =>
  layout(`
    <h2 style="color:#ef4444;margin-top:0;">Booking Update</h2>
    <p style="color:#6b7280;line-height:1.7;">Hi ${seekerName},</p>
    <p style="color:#6b7280;line-height:1.7;">
      Unfortunately, the owner has <strong>declined</strong> your booking request for:
    </p>
    <div style="background:#fef2f2;border:1px solid #ef4444;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;color:#991b1b;font-weight:600;font-size:16px;">🏠 ${listingTitle}</p>
    </div>
    ${
      reason
        ? `<p style="color:#6b7280;line-height:1.7;"><strong>Reason from owner:</strong> ${reason}</p>`
        : ""
    }
    <p style="color:#6b7280;line-height:1.7;">
      Don't be discouraged — there are thousands of other verified rooms on RoomBridge!
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${process.env.CLIENT_URL || "http://localhost:5173"}/listings"
         style="background:#1A3A5C;color:#ffffff;padding:14px 32px;border-radius:8px;
                text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Browse More Rooms
      </a>
    </div>
  `);

/**
 * Admin general broadcast notification email.
 * @param {string} name - Recipient name
 * @param {string} subject - Notification subject
 * @param {string} message - Notification body
 */
const adminNotificationEmail = (name, subject, message) =>
  layout(`
    <h2 style="color:#012D1D;margin-top:0;">📢 ${subject}</h2>
    <p style="color:#6b7280;line-height:1.7;">Hi ${name},</p>
    <div style="background:#F7F4EF;border-left:4px solid #FFAB69;border-radius:4px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;color:#374151;line-height:1.8;white-space:pre-wrap;">${message}</p>
    </div>
    <p style="color:#9ca3af;font-size:13px;">
      This notification was sent by the RoomBridge admin team.
    </p>
  `);

/**
 * Scheduled maintenance notification email.
 * @param {string} name
 * @param {string} startTime
 * @param {string} endTime
 * @param {string} reason
 * @param {string} affectedServices
 */
const maintenanceEmail = (name, { startTime, endTime, reason, affectedServices }) =>
  layout(`
    <h2 style="color:#92400E;margin-top:0;">⚠️ Scheduled Maintenance Notice</h2>
    <p style="color:#6b7280;line-height:1.7;">Hi ${name},</p>
    <p style="color:#6b7280;line-height:1.7;">
      We want to inform you about scheduled maintenance on the RoomBridge platform.
    </p>
    <div style="background:#FFFBEB;border:1px solid #FCD34D;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#92400E;font-weight:600;padding:4px 0;width:140px;">Start Time:</td><td style="color:#374151;">${startTime}</td></tr>
        ${endTime ? `<tr><td style="color:#92400E;font-weight:600;padding:4px 0;">End Time:</td><td style="color:#374151;">${endTime}</td></tr>` : ""}
        <tr><td style="color:#92400E;font-weight:600;padding:4px 0;vertical-align:top;">Reason:</td><td style="color:#374151;">${reason}</td></tr>
        ${affectedServices ? `<tr><td style="color:#92400E;font-weight:600;padding:4px 0;vertical-align:top;">Affected:</td><td style="color:#374151;">${affectedServices}</td></tr>` : ""}
      </table>
    </div>
    <p style="color:#6b7280;line-height:1.7;">
      We apologize for any inconvenience and will restore full service as quickly as possible.
    </p>
    <p style="color:#9ca3af;font-size:13px;">— The RoomBridge Team</p>
  `);

/**
 * System error alert email (sent to admins only).
 * @param {string} name
 * @param {string} errorType
 * @param {string} description
 * @param {string} severity
 * @param {string} affectedFeatures
 */
const errorAlertEmail = (name, { errorType, description, severity, affectedFeatures }) => {
  const sevColor = { low: "#6B7280", medium: "#D97706", high: "#DC2626", critical: "#7C3AED" }[severity] || "#DC2626";
  return layout(`
    <h2 style="color:#DC2626;margin-top:0;">🚨 System Error Alert</h2>
    <p style="color:#6b7280;line-height:1.7;">Hi ${name},</p>
    <div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:8px;padding:16px 20px;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#991B1B;font-weight:600;padding:4px 0;width:140px;">Error Type:</td><td style="color:#374151;">${errorType}</td></tr>
        <tr>
          <td style="color:#991B1B;font-weight:600;padding:4px 0;">Severity:</td>
          <td><span style="background:${sevColor}20;color:${sevColor};padding:2px 10px;border-radius:99px;font-size:12px;font-weight:700;text-transform:uppercase;">${severity}</span></td>
        </tr>
        <tr><td style="color:#991B1B;font-weight:600;padding:4px 0;vertical-align:top;">Description:</td><td style="color:#374151;line-height:1.7;">${description}</td></tr>
        ${affectedFeatures ? `<tr><td style="color:#991B1B;font-weight:600;padding:4px 0;vertical-align:top;">Affected:</td><td style="color:#374151;">${affectedFeatures}</td></tr>` : ""}
      </table>
    </div>
    <p style="color:#9ca3af;font-size:13px;">This alert was generated by the RoomBridge admin panel.</p>
  `);
};

module.exports = {
  sendEmail,
  welcomeEmail,
  verificationEmail,
  resetPasswordEmail,
  bookingAcceptedEmail,
  bookingRejectedEmail,
  adminNotificationEmail,
  maintenanceEmail,
  errorAlertEmail,
};
