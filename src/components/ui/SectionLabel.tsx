import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Tone = "light" | "dark";
type Accent = "orange" | "gold";

export function SectionLabel({
  children,
  tone = "dark",
  accent = "orange",
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  accent?: Accent;
  className?: string;
}) {
  const accentClass = accent === "gold" ? "via-[#a8823a]" : "via-orange";
  return (
    <div
      className={cn(
        "flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.22em]",
        tone === "dark" ? "text-cream/65" : "text-plum/60",
        className,
      )}
    >
      <span
        className={cn(
          "h-px w-8 bg-gradient-to-r from-transparent to-transparent",
          accentClass,
        )}
      />
      {children}
    </div>
  );
}
