import { verifyAdminSession } from "@/lib/auth";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await verifyAdminSession();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">Startup Rev</p>
            <p className="text-base font-semibold text-zinc-950">
              Tickets Sync
            </p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-zinc-600 sm:block">
              {session.email}
            </p>
            <form action={logout}>
              <button
                className="h-9 rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50"
                type="submit"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
