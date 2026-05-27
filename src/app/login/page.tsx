import Image from "next/image";
import { redirect } from "next/navigation";
import { SectionLabel } from "@/components/ui/SectionLabel";
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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-void px-4 py-12">
      <div className="gradient-brand-radial pointer-events-none absolute -top-1/3 left-1/2 h-[720px] w-[720px] -translate-x-1/2 opacity-60" />
      <div className="noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      <section className="animate-rise relative w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Image
            alt="Startup Rev"
            className="mb-8 h-9 w-auto"
            height={36}
            priority
            src="/sr-summit-logo-for-dark.svg"
            width={180}
          />
          <SectionLabel tone="dark">Admin Console</SectionLabel>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-cream">
            <span className="text-gradient">Sign in</span>
          </h1>
          <p className="mt-3 max-w-xs text-sm text-cream/55">
            Restricted access. Ticket sync, attendee management, and Shopify
            controls.
          </p>
        </div>
        <div className="rounded-2xl border border-cream/10 bg-ash/60 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
