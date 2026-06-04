import Image from "next/image";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { labelClass } from "@/components/ui/classes";

export default function ClaimTicketLoading() {
  return (
    <main className="relative flex min-h-screen items-start justify-center overflow-hidden bg-void px-4 py-12 text-cream">
      <div className="gradient-brand-radial pointer-events-none absolute -top-1/3 left-1/2 h-[820px] w-[820px] -translate-x-1/2 opacity-50" />
      <div className="noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      <section className="animate-rise relative mx-auto flex w-full max-w-xl flex-col gap-8">
        <div className="flex flex-col items-center text-center">
          <Image
            alt="Startup Rev"
            className="mb-6 h-8 w-auto"
            height={32}
            priority
            src="/sr-summit-logo-for-dark.svg"
            width={160}
          />
          <SectionLabel tone="dark">Ticket Assignment</SectionLabel>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
            <span className="text-gradient">Claim your seat</span>
          </h1>
        </div>

        <div className="rounded-2xl border border-cream/10 bg-ash/60 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="border-b border-cream/10 pb-5">
            <p className={labelClass}>Event</p>
            <div className="mt-2 h-6 w-52 animate-pulse rounded bg-cream/10" />
            <div className="mt-3 h-3 w-40 animate-pulse rounded bg-cream/10" />
            <div className="mt-4 h-4 w-64 animate-pulse rounded bg-cream/10" />
          </div>

          <div className="flex flex-col gap-4 pt-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-11 animate-pulse rounded-lg bg-cream/10" />
              <div className="h-11 animate-pulse rounded-lg bg-cream/10" />
            </div>
            <div className="h-11 animate-pulse rounded-lg bg-cream/10" />
            <div className="h-11 animate-pulse rounded-lg bg-cream/10" />
            <div className="h-11 animate-pulse rounded-lg bg-cream/10" />
            <div className="mt-2 h-12 w-full animate-pulse rounded-lg bg-cream/10" />
          </div>
        </div>
      </section>
    </main>
  );
}
