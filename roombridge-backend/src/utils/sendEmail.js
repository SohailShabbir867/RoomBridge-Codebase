const nodemailer = require("nodemailer");

/* ── Brand tokens (matches Figma / site design) ───────────────── */
const BRAND = {
  darkGreen:  "#012D1D",   // header bg, sidebar
  midGreen:   "#024A32",   // header inner text, hr accents
  peach:      "#FFAB69",   // accent bar, highlights
  btnBrown:   "#8E4E14",   // primary CTA button
  btnBrownDk: "#783D01",   // hover (shown as shadow)
  cream:      "#F5F0E6",   // email body background
  cardBg:     "#FFFFFF",   // card white
  footerBg:   "#F0EDE9",   // footer area
  textDark:   "#1C1C1C",   // body heading
  textBody:   "#3D3D3D",   // body paragraph
  textMuted:  "#7A7A7A",   // muted/secondary
  border:     "#E0D8CE",   // subtle border
  success:    "#2D7A4F",   // success green (text)
  successBg:  "#EDFAF2",   // success background
  successBdr: "#A8DBBF",   // success border
  danger:     "#B91C1C",   // danger/error text
  dangerBg:   "#FEF2F2",   // danger background
  dangerBdr:  "#FECACA",   // danger border
  warn:       "#92400E",   // warning text
  warnBg:     "#FFFBEB",   // warning background
  warnBdr:    "#FCD34D",   // warning border
  infoBg:     "#F0F9FF",   // info background (booking request)
  infoBdr:    "#BAE6FD",   // info border
  gold:       "#FBBF24",   // footer heading gold
};

const APP_URL = () => process.env.CLIENT_URL || "http://localhost:5173";

/* ── Transporter ────────────────────────────────────────────── */
const createTransporter = () => {
  const port   = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const secure = port === 465;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 10000,
    greetingTimeout:   5000,
    socketTimeout:     10000,
  });
};

/* ── Core send function ─────────────────────────────────────── */
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

/**
 * Fire-and-forget email helper — logs errors, never blocks the request.
 */
const sendEmailSafe = (opts, label = "email") => {
  sendEmail(opts).catch((err) =>
    console.error(`❌ Failed to send ${label}:`, err.message)
  );
};

/* ── Shared layout wrapper ──────────────────────────────────── */
const layout = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>RoomBridge</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.cream};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.cream};padding:40px 16px;">
    <tr>
      <td align="center">

        <!-- ── Main Card ── -->
        <table width="600" cellpadding="0" cellspacing="0"
          style="max-width:600px;width:100%;background-color:${BRAND.cardBg};border:1px solid ${BRAND.border};border-radius:18px;overflow:hidden;box-shadow:0 12px 40px rgba(1,45,29,0.12);">

          <!-- Peach accent bar -->
          <tr>
            <td height="5" style="background:linear-gradient(90deg,${BRAND.peach} 0%,#FFD0A8 100%);font-size:0;line-height:0;margin:0;padding:0;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.darkGreen};padding:36px 40px;text-align:center;">
              <!-- Logo mark -->
              <div style="display:inline-block;background-color:${BRAND.peach};border-radius:12px;padding:8px 14px;margin-bottom:14px;">
                <span style="font-size:20px;font-weight:900;color:${BRAND.darkGreen};letter-spacing:-0.03em;font-family:'Inter',-apple-system,sans-serif;">RB</span>
              </div>
              <h1 style="margin:0;color:#FFFFFF;font-size:26px;font-weight:800;letter-spacing:-0.02em;font-family:'Inter',-apple-system,sans-serif;">RoomBridge</h1>
              <p style="margin:6px 0 0;color:${BRAND.peach};font-size:13px;font-weight:500;letter-spacing:0.04em;opacity:0.9;">Pakistan's Trusted Room Rental Portal</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="background-color:${BRAND.cardBg};padding:44px 40px;color:${BRAND.textBody};">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${BRAND.footerBg};padding:28px 40px;text-align:center;border-top:1px solid ${BRAND.border};">
              <p style="margin:0;color:${BRAND.textMuted};font-size:12px;line-height:1.7;">
                &copy; ${new Date().getFullYear()} RoomBridge Pakistan. All rights reserved.<br>
                Connecting seekers with verified rooms and compatible roommates.
              </p>
              <p style="margin:10px 0 0;font-size:12px;">
                <a href="${APP_URL()}" style="color:${BRAND.btnBrown};text-decoration:none;font-weight:700;letter-spacing:0.02em;">roombridge.pk</a>
              </p>
            </td>
          </tr>

        </table>
        <!-- /Main Card -->

      </td>
    </tr>
  </table>
</body>
</html>`;

/* ─────────────────────────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────────────────────────── */

/** Reusable CTA button */
const btn = (href, label, color = BRAND.btnBrown) => `
  <div style="text-align:center;margin:36px 0;">
    <a href="${href}"
       style="background-color:${color};color:#FFFFFF;padding:14px 34px;border-radius:10px;
              text-decoration:none;font-weight:700;font-size:15px;display:inline-block;
              letter-spacing:0.01em;box-shadow:0 4px 14px rgba(142,78,20,0.30);">
      ${label}
    </a>
  </div>`;

/** Coloured info card */
const card = (bg, bdr, children) => `
  <div style="background-color:${bg};border:1px solid ${bdr};border-radius:12px;padding:22px 24px;margin:22px 0;">
    ${children}
  </div>`;

/** Section heading inside a card */
const cardLabel = (text, color = BRAND.textMuted) =>
  `<p style="margin:0 0 10px;font-size:11px;font-weight:700;color:${color};text-transform:uppercase;letter-spacing:0.08em;">${text}</p>`;

/** Single data row */
const row = (label, value) =>
  `<p style="margin:0 0 5px;font-size:14px;color:${BRAND.textBody};"><strong style="color:${BRAND.textDark};">${label}:</strong> ${value}</p>`;

/** Section divider */
const divider = `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:28px 0;">`;

/** Greeting paragraph */
const greeting = (name) =>
  `<p style="margin:0 0 14px;line-height:1.7;font-size:15px;color:${BRAND.textBody};">Hi <strong style="color:${BRAND.textDark};">${name}</strong>,</p>`;

/** Body paragraph */
const para = (text) =>
  `<p style="margin:0 0 14px;line-height:1.7;font-size:15px;color:${BRAND.textBody};">${text}</p>`;

/* ─────────────────────────────────────────────────────────────────
   1. Welcome Email
───────────────────────────────────────────────────────────────── */
const welcomeEmail = (name) =>
  layout(`
    <h2 style="color:${BRAND.darkGreen};font-size:22px;font-weight:800;margin:0 0 18px;">Welcome to RoomBridge! 🎉</h2>
    ${greeting(name)}
    ${para(`Your RoomBridge account is ready. Browse thousands of <strong>verified rooms</strong> across Pakistan, find compatible roommates, and connect with trusted owners — all in one place.`)}
    ${card(BRAND.cream, BRAND.border, `
      ${cardLabel("What you can do now", BRAND.midGreen)}
      ${row("🔍 Browse Rooms", "Explore listings from verified owners")}
      ${row("🤝 Request Booking", "Submit booking requests instantly")}
      ${row("💬 Chat", "Message owners &amp; roommates directly")}
    `)}
    ${btn(`${APP_URL()}/explore`, "Browse Rooms Now")}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
      If you didn't create this account, please <a href="mailto:support@roombridge.pk" style="color:${BRAND.btnBrown};">contact us</a> immediately.
    </p>
  `);

/* ─────────────────────────────────────────────────────────────────
   2. Email Verification
───────────────────────────────────────────────────────────────── */
const verificationEmail = (name, verifyURL) =>
  layout(`
    <h2 style="color:${BRAND.darkGreen};font-size:22px;font-weight:800;margin:0 0 18px;">Verify Your Email Address ✉️</h2>
    ${greeting(name)}
    ${para(`Thanks for signing up! Please verify your email address to activate your RoomBridge account. <strong>This link expires in 24 hours.</strong>`)}
    ${btn(verifyURL, "Verify My Email")}
    ${card(BRAND.cream, BRAND.border, `
      ${cardLabel("Or copy and paste this link")}
      <a href="${verifyURL}" style="color:${BRAND.btnBrown};word-break:break-all;font-size:13px;text-decoration:underline;">${verifyURL}</a>
    `)}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
      If you didn't create this account, you can safely ignore this email.
    </p>
  `);

/* ─────────────────────────────────────────────────────────────────
   3. Password Reset
───────────────────────────────────────────────────────────────── */
const resetPasswordEmail = (name, resetURL) =>
  layout(`
    <h2 style="color:${BRAND.darkGreen};font-size:22px;font-weight:800;margin:0 0 18px;">Reset Your Password 🔒</h2>
    ${greeting(name)}
    ${para(`You requested a password reset for your RoomBridge account. Click the button below to set a new password. <strong>This link expires in 15 minutes.</strong>`)}
    ${btn(resetURL, "Reset Password", "#B91C1C")}
    ${card(BRAND.cream, BRAND.border, `
      ${cardLabel("Or copy and paste this link")}
      <a href="${resetURL}" style="color:${BRAND.btnBrown};word-break:break-all;font-size:13px;text-decoration:underline;">${resetURL}</a>
    `)}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
      If you didn't request this, your password will remain unchanged. You can safely ignore this email.
    </p>
  `);

/* ─────────────────────────────────────────────────────────────────
   4. Booking Accepted (to Seeker)
───────────────────────────────────────────────────────────────── */
const bookingAcceptedEmail = (seekerName, listingTitle) =>
  layout(`
    <h2 style="color:${BRAND.success};font-size:22px;font-weight:800;margin:0 0 18px;">Booking Approved! 🎉</h2>
    ${greeting(seekerName)}
    ${para(`Great news! The owner has <strong>accepted</strong> your booking request for:`)}
    ${card(BRAND.successBg, BRAND.successBdr, `
      <p style="margin:0;color:${BRAND.success};font-weight:700;font-size:17px;">🏠 ${listingTitle}</p>
    `)}
    ${para(`You can now contact the owner directly through your dashboard to arrange move-in details.`)}
    ${btn(`${APP_URL()}/seeker/requests`, "View My Bookings")}
  `);

/* ─────────────────────────────────────────────────────────────────
   5. Booking Rejected (to Seeker)
───────────────────────────────────────────────────────────────── */
const bookingRejectedEmail = (seekerName, listingTitle, reason = "") =>
  layout(`
    <h2 style="color:${BRAND.danger};font-size:22px;font-weight:800;margin:0 0 18px;">Booking Request Update</h2>
    ${greeting(seekerName)}
    ${para(`Unfortunately, the owner has <strong>declined</strong> your booking request for:`)}
    ${card(BRAND.dangerBg, BRAND.dangerBdr, `
      <p style="margin:0;color:${BRAND.danger};font-weight:700;font-size:17px;">🏠 ${listingTitle}</p>
      ${reason ? `<p style="margin:10px 0 0;font-size:14px;color:${BRAND.danger};line-height:1.6;"><strong>Owner's reason:</strong> "${reason}"</p>` : ""}
    `)}
    ${para(`Don't be discouraged — there are thousands of other verified rooms on RoomBridge!`)}
    ${btn(`${APP_URL()}/explore`, "Browse More Rooms")}
  `);

/* ─────────────────────────────────────────────────────────────────
   6. New Booking Request (to Owner)
───────────────────────────────────────────────────────────────── */
const newBookingRequestEmail = (ownerName, seekerName, listingTitle, city, rent, message, moveInDate) =>
  layout(`
    <h2 style="color:${BRAND.darkGreen};font-size:22px;font-weight:800;margin:0 0 18px;">New Booking Request 📬</h2>
    ${greeting(ownerName)}
    ${para(`<strong>${seekerName}</strong> is interested in your room and has submitted a booking request:`)}
    ${card(BRAND.infoBg, BRAND.infoBdr, `
      ${cardLabel("Listing Details", "#0369a1")}
      <p style="margin:0;font-weight:700;font-size:17px;color:#0369a1;">🏠 ${listingTitle}</p>
      <p style="margin:5px 0 0;font-size:13px;color:#0284c7;">📍 ${city} &nbsp;·&nbsp; PKR ${(rent || 0).toLocaleString()}/month</p>
    `)}
    ${card(BRAND.cream, BRAND.border, `
      ${cardLabel("Message from Seeker")}
      <p style="margin:0;font-style:italic;color:${BRAND.textBody};font-size:14px;line-height:1.7;">"${message.trim()}"</p>
      ${moveInDate ? `<p style="margin:12px 0 0;font-size:13px;color:${BRAND.textBody};"><strong>Preferred Move-in:</strong> ${new Date(moveInDate).toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</p>` : ""}
    `)}
    ${para(`Please log in to your owner dashboard to review and respond to this request.`)}
    ${btn(`${APP_URL()}/owner/bookings`, "Manage Booking Requests")}
  `);

/* ─────────────────────────────────────────────────────────────────
   7. Booking Cancelled (to Owner)
───────────────────────────────────────────────────────────────── */
const bookingCancelledEmail = (ownerName, seekerName, listingTitle) =>
  layout(`
    <h2 style="color:${BRAND.danger};font-size:22px;font-weight:800;margin:0 0 18px;">Booking Cancelled ❌</h2>
    ${greeting(ownerName)}
    ${para(`The seeker <strong>${seekerName}</strong> has cancelled their booking request for your listing:`)}
    ${card(BRAND.dangerBg, BRAND.dangerBdr, `
      <p style="margin:0;color:${BRAND.danger};font-weight:700;font-size:17px;">🏠 ${listingTitle}</p>
    `)}
    ${para(`Your listing is still active and available for new booking requests.`)}
    ${btn(`${APP_URL()}/owner/bookings`, "View Booking Requests")}
  `);

/* ─────────────────────────────────────────────────────────────────
   8. Listing Approved (to Owner)
───────────────────────────────────────────────────────────────── */
const listingApprovedEmail = (ownerName, listingTitle, listingId) =>
  layout(`
    <h2 style="color:${BRAND.success};font-size:22px;font-weight:800;margin:0 0 18px;">Your Listing is Live! 🎉</h2>
    ${greeting(ownerName)}
    ${para(`Great news! Your listing has been reviewed and <strong>approved</strong>. It's now live on RoomBridge and visible to seekers.`)}
    ${card(BRAND.successBg, BRAND.successBdr, `
      ${cardLabel("Approved Listing", BRAND.success)}
      <p style="margin:0;color:${BRAND.success};font-weight:700;font-size:17px;">🏠 ${listingTitle}</p>
    `)}
    ${para(`Seekers can now find and request bookings for your room. Keep your details up to date for the best results.`)}
    ${btn(`${APP_URL()}/listings/${listingId}`, "View Your Listing")}
  `);

/* ─────────────────────────────────────────────────────────────────
   9. Listing Rejected (to Owner)
───────────────────────────────────────────────────────────────── */
const listingRejectedEmail = (ownerName, listingTitle, reason) =>
  layout(`
    <h2 style="color:${BRAND.danger};font-size:22px;font-weight:800;margin:0 0 18px;">Listing Review Update ❌</h2>
    ${greeting(ownerName)}
    ${para(`Thank you for posting <strong>"${listingTitle}"</strong> on RoomBridge.`)}
    ${para(`Unfortunately, after our moderation review, your listing was <strong>declined</strong> as it did not comply with our guidelines.`)}
    ${card(BRAND.dangerBg, BRAND.dangerBdr, `
      ${cardLabel("Reason for Rejection", BRAND.danger)}
      <p style="margin:0;font-size:14px;color:${BRAND.danger};line-height:1.7;">${reason || "Does not comply with RoomBridge listing guidelines."}</p>
    `)}
    ${para(`You can fix the issues, edit your listing, and resubmit it for review.`)}
    ${btn(`${APP_URL()}/owner/listings`, "Edit My Listings")}
  `);

/* ─────────────────────────────────────────────────────────────────
   10. Listing Deactivated (to Owner)
───────────────────────────────────────────────────────────────── */
const listingDeactivatedEmail = (ownerName, listingTitle) =>
  layout(`
    <h2 style="color:${BRAND.warn};font-size:22px;font-weight:800;margin:0 0 18px;">Listing Deactivated ⚠️</h2>
    ${greeting(ownerName)}
    ${para(`Your listing <strong>"${listingTitle}"</strong> has been <strong>deactivated</strong> by an administrator and is no longer visible in search results.`)}
    ${card(BRAND.warnBg, BRAND.warnBdr, `
      ${cardLabel("What this means", BRAND.warn)}
      <p style="margin:0;font-size:14px;color:${BRAND.warn};line-height:1.7;">Your listing won't appear in searches and new bookings cannot be submitted until it is reactivated.</p>
    `)}
    ${para(`If you believe this was done in error or would like to appeal, please contact our support team at <a href="mailto:support@roombridge.pk" style="color:${BRAND.btnBrown};">support@roombridge.pk</a>.`)}
    ${btn(`${APP_URL()}/owner/listings`, "Manage My Listings", BRAND.warn)}
  `);

/* ─────────────────────────────────────────────────────────────────
   11. New Report Alert (to Admin)
───────────────────────────────────────────────────────────────── */
const newReportAdminEmail = (reporterName, reporterEmail, reporterRole, targetType, targetName, targetDetails, reason, description, reportId) =>
  layout(`
    <div style="background-color:${BRAND.dangerBg};border:1px solid ${BRAND.dangerBdr};border-radius:10px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;">
      <span style="font-size:22px;margin-right:10px;">🚨</span>
      <h2 style="color:${BRAND.danger};font-size:20px;font-weight:800;margin:0;">New Moderation Report</h2>
    </div>
    ${para(`A new user report has been submitted and requires your immediate moderation review.`)}

    ${card(BRAND.cream, BRAND.border, `
      ${cardLabel("Reporter Information")}
      ${row("Name", reporterName)}
      ${row("Email", reporterEmail)}
      ${row("Role", reporterRole)}
    `)}

    ${card(BRAND.infoBg, BRAND.infoBdr, `
      ${cardLabel(`Reported Target — ${targetType}`, "#0369a1")}
      ${row("Name / Title", targetName)}
      ${targetDetails}
    `)}

    ${card(BRAND.warnBg, BRAND.warnBdr, `
      ${cardLabel("Report Details", BRAND.warn)}
      ${row("Reason", `<span style="font-weight:700;color:${BRAND.warn};">${reason}</span>`)}
      ${row("Description", `"${description}"`)}
      ${row("Report ID", `<code style="font-size:12px;background:${BRAND.border};padding:2px 6px;border-radius:4px;">${reportId}</code>`)}
    `)}

    ${btn(`${APP_URL()}/admin/reports`, "Open Reports Dashboard")}
  `);

/* ─────────────────────────────────────────────────────────────────
   12. Report Acknowledgment (to Reporter)
───────────────────────────────────────────────────────────────── */
const reportAcknowledgmentEmail = (reporterName, reportId) =>
  layout(`
    <h2 style="color:${BRAND.darkGreen};font-size:22px;font-weight:800;margin:0 0 18px;">We Received Your Report 🛡️</h2>
    ${greeting(reporterName)}
    ${para(`Thank you for helping keep RoomBridge safe. Our safety team has received your report and is currently investigating the issue.`)}
    ${card(BRAND.cream, BRAND.border, `
      ${cardLabel("Report Summary")}
      ${row("Report ID", `<code style="font-size:12px;background:${BRAND.border};padding:2px 6px;border-radius:4px;">${reportId}</code>`)}
      ${row("Status", `<span style="color:${BRAND.warn};font-weight:700;">⏳ Pending Admin Review</span>`)}
    `)}
    ${para(`We take user safety and platform trust very seriously. We will take appropriate action and may notify you of the outcome.`)}
    ${btn(`${APP_URL()}/seeker/dashboard`, "Go to My Dashboard")}
  `);

/* ─────────────────────────────────────────────────────────────────
   13. Admin Broadcast / Notification
───────────────────────────────────────────────────────────────── */
const adminNotificationEmail = (name, subject, message) =>
  layout(`
    <h2 style="color:${BRAND.darkGreen};font-size:22px;font-weight:800;margin:0 0 18px;">📢 ${subject}</h2>
    ${greeting(name)}
    ${card(BRAND.cream, BRAND.peach + "55", `
      ${cardLabel("Message from RoomBridge Administration", BRAND.midGreen)}
      <p style="margin:0;color:${BRAND.textBody};line-height:1.8;white-space:pre-wrap;font-size:14px;">${message}</p>
    `)}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
      This notification was sent by the RoomBridge administration team.
    </p>
  `);

/* ─────────────────────────────────────────────────────────────────
   14. Scheduled Maintenance Notice
───────────────────────────────────────────────────────────────── */
const maintenanceEmail = (name, { startTime, endTime, reason, affectedServices }) =>
  layout(`
    <h2 style="color:${BRAND.warn};font-size:22px;font-weight:800;margin:0 0 18px;">⚠️ Scheduled Maintenance Notice</h2>
    ${greeting(name)}
    ${para(`We want to inform you about upcoming scheduled maintenance on the RoomBridge platform.`)}
    ${card(BRAND.warnBg, BRAND.warnBdr, `
      ${cardLabel("Maintenance Window", BRAND.warn)}
      ${row("Start Time", startTime)}
      ${endTime ? row("End Time", endTime) : ""}
      ${row("Reason", reason)}
      ${affectedServices ? row("Affected Services", affectedServices) : ""}
    `)}
    ${para(`We apologise for any inconvenience. Our team will restore full service as quickly as possible. Thank you for your patience.`)}
  `);

/* ─────────────────────────────────────────────────────────────────
   15. System Error Alert (Admin only)
───────────────────────────────────────────────────────────────── */
const errorAlertEmail = (name, { errorType, description, severity, affectedFeatures }) => {
  const sevColors = {
    low:      { text: "#4B5563", bg: "#F3F4F6", bdr: "#D1D5DB" },
    medium:   { text: BRAND.warn,    bg: BRAND.warnBg,  bdr: BRAND.warnBdr  },
    high:     { text: BRAND.danger,  bg: BRAND.dangerBg,bdr: BRAND.dangerBdr},
    critical: { text: "#7C3AED",     bg: "#F5F3FF",     bdr: "#C4B5FD"      },
  };
  const sv = sevColors[severity] || sevColors.high;
  return layout(`
    <h2 style="color:${BRAND.danger};font-size:22px;font-weight:800;margin:0 0 18px;">🚨 System Error Alert</h2>
    ${greeting(name)}
    ${card(BRAND.dangerBg, BRAND.dangerBdr, `
      ${cardLabel("Error Details", BRAND.danger)}
      ${row("Error Type", errorType)}
      ${row("Severity", `<span style="background-color:${sv.bg};color:${sv.text};border:1px solid ${sv.bdr};padding:2px 12px;border-radius:99px;font-size:12px;font-weight:700;text-transform:uppercase;">${severity}</span>`)}
      ${row("Description", description)}
      ${affectedFeatures ? row("Affected Features", affectedFeatures) : ""}
    `)}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
      This alert was automatically generated by the RoomBridge health monitoring service.
    </p>
  `);
};

/* ─────────────────────────────────────────────────────────────────
   16. Feedback Thank You
───────────────────────────────────────────────────────────────── */
const feedbackThankYouEmail = (name, rating, category) => {
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const categoryLabels = {
    general:         "General Feedback",
    bug_report:      "Bug Report",
    feature_request: "Feature Request",
    other:           "Other",
  };
  return layout(`
    <h2 style="color:${BRAND.darkGreen};font-size:22px;font-weight:800;margin:0 0 18px;">Thank You for Your Feedback! 💬</h2>
    ${greeting(name)}
    ${para(`We truly appreciate you taking the time to share your thoughts with us. Your feedback helps us make RoomBridge better for everyone.`)}
    ${card(BRAND.successBg, BRAND.successBdr, `
      ${cardLabel("Your Feedback Summary", BRAND.success)}
      ${row("Rating", `<span style="color:#FBBF24;font-size:18px;letter-spacing:2px;">${stars}</span> &nbsp;<span style="font-size:13px;color:${BRAND.textMuted};">(${rating}/5)</span>`)}
      ${row("Category", categoryLabels[category] || "General Feedback")}
    `)}
    ${para(`Our team reviews all feedback carefully. If you reported an issue or requested a feature, we'll work on it as quickly as we can.`)}
    ${btn(`${APP_URL()}/explore`, "Continue Exploring Rooms")}
    ${divider}
    <p style="margin:0;font-size:13px;color:${BRAND.textMuted};line-height:1.6;">
      If you have urgent concerns, reach us at <a href="mailto:contact.roombridge@gmail.com" style="color:${BRAND.btnBrown};">contact.roombridge@gmail.com</a>.
    </p>
  `);
};

/* ── Exports ────────────────────────────────────────────────── */
module.exports = {
  sendEmail,
  sendEmailSafe,
  welcomeEmail,
  verificationEmail,
  resetPasswordEmail,
  bookingAcceptedEmail,
  bookingRejectedEmail,
  newBookingRequestEmail,
  bookingCancelledEmail,
  listingApprovedEmail,
  listingRejectedEmail,
  listingDeactivatedEmail,
  newReportAdminEmail,
  reportAcknowledgmentEmail,
  adminNotificationEmail,
  maintenanceEmail,
  errorAlertEmail,
  feedbackThankYouEmail,
};
