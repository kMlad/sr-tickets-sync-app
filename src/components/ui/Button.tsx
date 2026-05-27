import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "secondary-dark" | "ghost";
type Size = "sm" | "md" | "lg";

const base =
  "group relative inline-flex items-center justify-center gap-2 font-display font-semibold tracking-tight transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-void";

const variants: Record<Variant, string> = {
  primary:
    "bg-orange text-char hover:bg-orange-hot shadow-[0_0_0_1px_rgba(255,147,30,0.35),0_14px_40px_-14px_rgba(255,147,30,0.6)] hover:shadow-[0_0_0_1px_rgba(255,107,0,0.5),0_20px_50px_-12px_rgba(255,107,0,0.7)] hover:-translate-y-0.5",
  secondary:
    "border border-cream/20 text-cream bg-cream/0 hover:bg-cream/5 hover:border-cream/40 backdrop-blur-sm",
  "secondary-dark":
    "border border-plum/20 text-plum bg-transparent hover:bg-plum/5 hover:border-plum/40",
  ghost: "text-cream/80 hover:text-cream",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-xs uppercase tracking-[0.14em]",
  md: "h-11 px-5 text-sm",
  lg: "h-14 px-7 text-base",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

type ButtonProps = CommonProps & ComponentPropsWithoutRef<"button">;
type AnchorProps = CommonProps & { href: string } & Omit<
    ComponentPropsWithoutRef<"a">,
    "href"
  >;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  ...rest
}: AnchorProps) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
