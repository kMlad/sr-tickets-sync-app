"use client";

import { useFormStatus } from "react-dom";

export function AgorifyToggle({ checked }: { checked: boolean }) {
  const { pending } = useFormStatus();
  const label = checked
    ? "Remove attendee from Agorify"
    : "Mark attendee as added to Agorify";

  return (
    <button
      aria-checked={checked}
      aria-label={label}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:cursor-wait disabled:opacity-60 ${
        checked
          ? "border-forest/60 bg-forest"
          : "border-cream/20 bg-cream/10 hover:bg-cream/20"
      }`}
      disabled={pending}
      name="addedInAgorify"
      role="switch"
      title={label}
      type="submit"
      value={checked ? "false" : "true"}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-1 h-4 w-4 rounded-full bg-cream shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        } ${pending ? "animate-pulse" : ""}`}
      />
    </button>
  );
}
