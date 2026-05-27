import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";
import {
  infoMessageClass,
  labelClass,
  successMessageClass,
} from "@/components/ui/classes";
import { SectionLabel } from "@/components/ui/SectionLabel";
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
    <main className="relative mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <div className="gradient-brand-radial pointer-events-none absolute -top-1/3 left-1/2 h-[820px] w-[820px] -translate-x-1/2 opacity-40" />
      <div className="noise pointer-events-none absolute inset-0 opacity-[0.06] mix-blend-overlay" />
      <section className="animate-rise relative rounded-2xl border border-cream/10 bg-ash/60 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        <Image
          alt="Startup Rev"
          className="mb-6 h-7 w-auto"
          height={28}
          priority
          src="/sr-summit-logo-for-dark.svg"
          width={140}
        />
        <SectionLabel tone="dark">Shopify Connection</SectionLabel>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-cream">
          <span className="text-gradient">
            {isConnected ? "Connected" : "Not connected"}
          </span>
        </h1>
        <p className="mt-3 text-sm leading-6 text-cream/65">
          Store: <span className="font-mono text-cream">{shop}</span>
        </p>

        {params.installed === "1" ? (
          <p className={`mt-4 ${successMessageClass}`}>
            Shopify OAuth completed successfully.
          </p>
        ) : null}

        {params.connected === "1" ? (
          <p className={`mt-4 ${infoMessageClass}`}>
            This store already has an active installation.
          </p>
        ) : null}

        <dl className="mt-6 grid gap-3 text-sm">
          <div className="flex justify-between gap-4 border-b border-cream/5 pb-2">
            <dt className={labelClass}>Status</dt>
            <dd className="font-medium text-cream">
              {installation?.status ?? "missing"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-cream/5 pb-2">
            <dt className={labelClass}>Scopes</dt>
            <dd className="text-right font-mono text-xs text-cream">
              {installation?.scope ?? "none"}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-cream/5 pb-2">
            <dt className={labelClass}>Last verified</dt>
            <dd className="font-mono text-xs text-cream">
              {installation?.lastVerifiedAt ?? "never"}
            </dd>
          </div>
          {installation?.shopName ? (
            <div className="flex justify-between gap-4">
              <dt className={labelClass}>Shop name</dt>
              <dd className="font-medium text-cream">
                {installation.shopName}
              </dd>
            </div>
          ) : null}
        </dl>

        {!isConnected ? (
          <ButtonLink
            className="mt-8"
            href={getShopifyAuthUrl(shop).toString()}
          >
            Install / reconnect app
          </ButtonLink>
        ) : null}
      </section>
    </main>
  );
}
