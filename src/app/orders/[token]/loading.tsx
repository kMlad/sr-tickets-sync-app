import Image from "next/image";
import { SectionLabel } from "@/components/ui/SectionLabel";

export default function ManageOrderTicketsLoading() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-void px-4 py-12 text-cream">
      <div className="gradient-brand-radial pointer-events-none absolute -top-1/3 left-1/2 h-[820px] w-[820px] -translate-x-1/2 opacity-40" />
      <div className="noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      <section className="animate-rise relative mx-auto flex w-full max-w-3xl flex-col gap-8">
        <div className="flex flex-col items-center text-center">
          <Image
            alt="Startup Rev"
            className="mb-6 h-8 w-auto"
            height={32}
            priority
            src="/sr-summit-logo-for-dark.svg"
            width={160}
          />
          <SectionLabel tone="dark">Order Management</SectionLabel>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-cream sm:text-4xl">
            <span className="text-gradient">Manage attendees</span>
          </h1>
          <div className="mt-3 h-4 w-56 animate-pulse rounded bg-cream/10" />
        </div>

        <div className="rounded-2xl border border-cream/10 bg-ash/60 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
          <div className="border-b border-cream/10 px-6 py-5">
            <h2 className="font-display text-lg font-semibold text-cream">
              Tickets
            </h2>
          </div>

          <div className="divide-y divide-cream/10">
            {[0, 1, 2].map((index) => (
              <div className="grid gap-4 p-6" key={index}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <div className="h-3 w-16 animate-pulse rounded bg-cream/10" />
                    <div className="h-5 w-44 animate-pulse rounded bg-cream/10" />
                    <div className="h-4 w-60 animate-pulse rounded bg-cream/10" />
                  </div>
                  <div className="h-6 w-24 animate-pulse rounded-md bg-cream/10" />
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <div className="h-11 animate-pulse rounded-lg bg-cream/10" />
                  <div className="h-11 w-28 animate-pulse rounded-lg bg-cream/10" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
