import { redirect } from "next/navigation";
import { isAdminClaims } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (isAdminClaims(data?.claims)) {
    redirect("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-12">
      <section className="w-full max-w-sm">
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Startup Rev
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
            Admin sign in
          </h1>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
