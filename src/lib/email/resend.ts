import "server-only";

import { Resend } from "resend";
import { env } from "@/env";

let resend: Resend | null = null;

function getResend() {
  if (!env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required to send transactional email.");
  }

  resend ??= new Resend(env.RESEND_API_KEY);
  return resend;
}

export function assertEmailConfigured() {
  if (!env.RESEND_FROM_EMAIL) {
    throw new Error(
      "RESEND_FROM_EMAIL is required to send transactional email.",
    );
  }

  getResend();
}

export async function sendTransactionalEmail(args: {
  to: string;
  subject: string;
  text: string;
  html: string;
  idempotencyKey?: string;
}) {
  assertEmailConfigured();

  const result = await getResend().emails.send(
    {
      from: env.RESEND_FROM_EMAIL as string,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    },
    args.idempotencyKey ? { idempotencyKey: args.idempotencyKey } : undefined,
  );

  if (result.error) {
    throw new Error(`Resend failed to send email: ${result.error.message}`);
  }

  return result.data;
}
