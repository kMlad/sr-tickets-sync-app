import "server-only";

import { sendTransactionalEmail } from "@/lib/email/resend";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function linkHtml(url: string, label: string) {
  return `<a href="${escapeHtml(url)}" style="display:inline-block;border-radius:6px;background:#18181b;color:#fff;padding:12px 16px;text-decoration:none;font-weight:600">${escapeHtml(label)}</a>`;
}

function emailShell(content: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f4f4f5;padding:24px;font-family:Arial,sans-serif;color:#18181b">
    <div style="margin:0 auto;max-width:560px;border:1px solid #e4e4e7;border-radius:8px;background:#fff;padding:24px">
      ${content}
    </div>
  </body>
</html>`;
}

export async function sendBuyerTicketManagementEmail(args: {
  to: string;
  buyerName: string | null;
  orderName: string | null;
  manageUrl: string;
  ticketCount: number;
  idempotencyKey: string;
}) {
  const greeting = args.buyerName ? `Hi ${args.buyerName},` : "Hi,";
  const ticketLabel = args.ticketCount === 1 ? "ticket" : "tickets";
  const subject = args.orderName
    ? `Manage attendees for ${args.orderName}`
    : "Manage your Startup Rev tickets";
  const text = `${greeting}

Thanks for your Startup Rev ticket purchase. You have ${args.ticketCount} ${ticketLabel}.

Use this private link to send each attendee their ticket assignment link:
${args.manageUrl}

Each attendee will be able to fill in their own information.`;

  const html = emailShell(`
    <p style="margin:0 0 16px">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px">Thanks for your Startup Rev ticket purchase. You have ${args.ticketCount} ${ticketLabel}.</p>
    <p style="margin:0 0 24px">Use this private link to send each attendee their ticket assignment link.</p>
    <p style="margin:0 0 24px">${linkHtml(args.manageUrl, "Manage attendees")}</p>
    <p style="margin:0;color:#52525b;font-size:14px">Each attendee will be able to fill in their own information.</p>
  `);

  return sendTransactionalEmail({
    to: args.to,
    subject,
    text,
    html,
    idempotencyKey: args.idempotencyKey,
  });
}

export async function sendAttendeeRegistrationConfirmationEmail(args: {
  to: string;
  attendeeName: string | null;
  eventName: string | null;
  passTypeName: string | null;
  eventStartsAt: string | null;
  idempotencyKey: string;
}) {
  const eventName = args.eventName ?? "Startup Rev";
  const passTypeName = args.passTypeName ?? "pass";
  const greeting = args.attendeeName ? `Hi ${args.attendeeName},` : "Hi,";
  const eventDate = formatEventDate(args.eventStartsAt);
  const subject = `You're confirmed for ${eventName}`;
  const text = `${greeting}

Your ${passTypeName} for ${eventName} is confirmed. 

There is nothing else you need to do for now. We'll send the event ticket over once it's ready.

Excited to see you there!

Best, 
The Startup Revolution Team`;

  const html = emailShell(`
    <p style="margin:0 0 16px">${escapeHtml(greeting)}</p>
    <p style="margin:0 0 16px">Your <strong>${escapeHtml(passTypeName)}</strong> for ${escapeHtml(eventName)} is confirmed.</p>
    ${eventDate ? `<p style="margin:0 0 16px">When: ${escapeHtml(eventDate)}</p>` : ""}
    <p style="margin:0 0 24px">There is nothing else you need to do — we already have your details.</p>
    <p style="margin:0;color:#52525b;font-size:14px">See you there.</p>
  `);

  return sendTransactionalEmail({
    to: args.to,
    subject,
    text,
    html,
    idempotencyKey: args.idempotencyKey,
  });
}

function formatEventDate(value: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(date);
}

export async function sendAttendeeTicketClaimEmail(args: {
  to: string;
  eventName: string | null;
  orderName: string | null;
  ticketName: string | null;
  claimUrl: string;
  idempotencyKey: string;
}) {
  const eventName = args.eventName ?? "Startup Rev";
  const ticketName = args.ticketName ?? "ticket";
  const subject = `Your ${eventName} ticket`;
  const text = `You have been sent a ${ticketName}.

Use this link to fill in your attendee details:
${args.claimUrl}`;

  const html = emailShell(`
    <p style="margin:0 0 16px">You have been sent a ${escapeHtml(ticketName)}${args.orderName ? ` from ${escapeHtml(args.orderName)}` : ""}.</p>
    <p style="margin:0 0 24px">Use this link to fill in your attendee details.</p>
    <p style="margin:0 0 24px">${linkHtml(args.claimUrl, "Fill attendee details")}</p>
    <p style="margin:0;color:#52525b;font-size:14px">${escapeHtml(eventName)}</p>
  `);

  return sendTransactionalEmail({
    to: args.to,
    subject,
    text,
    html,
    idempotencyKey: args.idempotencyKey,
  });
}
