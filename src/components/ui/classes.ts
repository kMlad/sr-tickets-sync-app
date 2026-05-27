export const inputClass =
  "h-11 rounded-lg border border-cream/15 bg-void/60 px-3 text-sm text-cream placeholder:text-cream/35 outline-none transition focus:border-orange focus:ring-2 focus:ring-orange/30";

export const selectClass = `${inputClass} appearance-none pr-10 select-chevron`;

export const labelClass =
  "font-mono text-[11px] uppercase tracking-[0.18em] text-cream/55";

export const cardClass =
  "rounded-2xl border border-cream/10 bg-ash/60 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm";

export const cardHeaderClass =
  "border-b border-cream/10 px-6 py-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between";

export const h2Class =
  "font-display text-lg font-semibold tracking-tight text-cream";

export const subtleTextClass = "text-sm leading-6 text-cream/65";

export const tableClass = "w-full text-left text-sm";

export const tableTheadClass =
  "border-b border-cream/10 font-mono text-[10px] uppercase tracking-[0.2em] text-cream/55";

export const tableTbodyClass = "divide-y divide-cream/5";

export const tableThClass = "px-6 py-3.5 font-medium whitespace-nowrap";

export const tableThNumClass = `${tableThClass} text-right`;

export const tableTdClass = "px-6 py-4 align-middle text-cream/75";

export const tableTdPrimaryClass =
  "px-6 py-4 align-middle font-medium text-cream whitespace-nowrap";

export const tableTdNumClass =
  "px-6 py-4 align-middle text-right font-mono text-xs text-cream/70 tabular-nums whitespace-nowrap";

export const tableTdMetaClass =
  "px-6 py-4 align-middle font-mono text-xs text-cream/55 tabular-nums whitespace-nowrap";

export function statusBadgeClass(status: string) {
  const base =
    "inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-mono uppercase tracking-[0.14em] whitespace-nowrap";
  switch (status) {
    case "assigned":
    case "completed":
    case "active":
      return `${base} border-forest/30 bg-forest/10 text-forest`;
    case "cancelled":
    case "failed":
    case "error":
      return `${base} border-magenta/30 bg-magenta/10 text-magenta`;
    case "pending":
    case "draft":
      return `${base} border-orange/30 bg-orange/10 text-orange`;
    default:
      return `${base} border-cream/15 bg-cream/5 text-cream/70`;
  }
}

export const infoMessageClass =
  "rounded-md border border-cobalt/30 bg-cobalt/10 px-3 py-2 text-sm text-cobalt";

export const successMessageClass =
  "rounded-md border border-forest/30 bg-forest/10 px-3 py-2 text-sm text-forest";

export const errorMessageClass =
  "rounded-md border border-magenta/30 bg-magenta/10 px-3 py-2 text-sm text-magenta";
