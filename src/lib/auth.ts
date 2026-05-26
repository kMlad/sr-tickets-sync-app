import "server-only";

import type { JwtPayload } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { cache } from "react";
import { env } from "@/env";
import { createClient } from "@/lib/supabase/server";

export type AdminSession = {
  claims: JwtPayload;
  email: string;
  userId: string;
};

export function isAdminClaims(claims: JwtPayload | null | undefined) {
  if (!claims) {
    return false;
  }

  const email = claims.email?.toLowerCase();
  const adminEmails = new Set(env.SUPABASE_ADMIN_EMAILS);
  const appRole = claims.app_metadata?.role;
  const appRoles = claims.app_metadata?.roles;

  return (
    (email ? adminEmails.has(email) : false) ||
    appRole === "admin" ||
    (Array.isArray(appRoles) && appRoles.includes("admin"))
  );
}

export const verifyAdminSession = cache(async (): Promise<AdminSession> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims || !isAdminClaims(data.claims)) {
    redirect("/login");
  }

  return {
    claims: data.claims,
    email: data.claims.email ?? "admin",
    userId: data.claims.sub,
  };
});
