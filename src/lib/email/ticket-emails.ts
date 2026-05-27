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
