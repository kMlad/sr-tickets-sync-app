import Link from "next/link";
import { getInstallationByShop } from "@/lib/shopify/installations";
import { getAllowedShopDomain } from "@/lib/shopify/shop";
import { getShopifyAuthUrl, hasRequiredScopes } from "@/lib/shopify/utils";

export const dynamic = "force-dynamic";

type ShopifyStatusPageProps = {
  searchParams: Promise<{
    installed?: string;
    connected?: string;
  }>;
};

export default async function ShopifyStatusPage({
  searchParams,
}: ShopifyStatusPageProps) {
  const params = await searchParams;
  const shop = getAllowedShopDomain();
  const installation = await getInstallationByShop(shop);
  const isConnected =
    installation?.status === "active" &&
    Boolean(installation.accessToken) &&
    hasRequiredScopes(installation.scope);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Shopify Connection
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-950">
          {isConnected ? "Connected" : "Not connected"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Store: <span className="font-medium text-zinc-900">{shop}</span>
        </p>

        {params.installed === "1" ? (
          <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            Shopify OAuth completed successfully.
          </p>
        ) : null}

        {params.connected === "1" ? (
          <p className="mt-4 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
            This store already has an active installation.
          </p>
        ) : null}

        <dl className="mt-6 grid gap-3 text-sm text-zinc-700">
          <div className="flex justify-between gap-4">
            <dt>Status</dt>
            <dd className="font-medium text-zinc-950">
              {installation?.status ?? "missing"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Scopes</dt>
            <dd className="text-right font-medium text-zinc-950">
              {installation?.scope ?? "none"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Last verified</dt>
            <dd className="font-medium text-zinc-950">
              {installation?.lastVerifiedAt ?? "never"}
            </dd>
          </div>
          {installation?.shopName ? (
            <div className="flex justify-between gap-4">
              <dt>Shop name</dt>
              <dd className="font-medium text-zinc-950">
                {installation.shopName}
              </dd>
            </div>
          ) : null}
        </dl>

        {!isConnected ? (
          <Link
            className="mt-6 inline-flex h-11 items-center justify-center rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
            href={getShopifyAuthUrl(shop).toString()}
          >
            Install / reconnect app
          </Link>
        ) : null}
      </section>
    </main>
  );
}
