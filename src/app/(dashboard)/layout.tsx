import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { verifyAdminSession } from "@/lib/auth";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

const navLinkClass =
  "relative rounded-md px-3 py-2 font-mono text-[11px] uppercase tracking-[0.18em] text-cream/70 transition hover:text-cream after:absolute after:left-3 after:right-3 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-orange after:transition-transform after:duration-300 hover:after:scale-x-100";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifyAdminSession();

  return (
    <div className="relative flex min-h-screen flex-col bg-void text-cream">
      <header className="sticky top-0 z-40 border-b hairline bg-void/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-10">
          <Link className="flex items-center gap-3" href="/">
            <Image
              alt="Startup Rev"
              className="h-7 w-auto"
              height={28}
              priority
              src="/sr-summit-logo-for-dark.svg"
              width={140}
            />
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.24em] text-cream/45 sm:inline-block">
              Tickets Sync
            </span>
          </Link>
          <div className="flex items-center gap-1 sm:gap-3">
            <nav className="hidden items-center gap-1 sm:flex">
              <Link className={navLinkClass} href="/">
                Dashboard
              </Link>
              <Link className={navLinkClass} href="/attendees">
                Attendees
              </Link>
              <Link className={navLinkClass} href="/config">
                Config
              </Link>
              <Link className={navLinkClass} href="/shopify">
                Shopify
              </Link>
            </nav>
            <span className="hidden font-mono text-[11px] text-cream/45 md:block">
              {session.email}
            </span>
            <form action={logout}>
              <Button size="sm" type="submit" variant="secondary">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
