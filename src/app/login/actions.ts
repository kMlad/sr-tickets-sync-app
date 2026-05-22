"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminClaims } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type LoginState = {
  message?: string;
};

export async function login(
  _state: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { message: "Enter an email and password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { message: "Invalid email or password." };
  }

  const { data, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !isAdminClaims(data?.claims)) {
    await supabase.auth.signOut();
    return { message: "This account is not allowed to access the dashboard." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
