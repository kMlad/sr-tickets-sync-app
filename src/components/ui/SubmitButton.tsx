"use client";

import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

function Spinner() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        d="M4 12a8 8 0 0 1 8-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="4"
      />
    </svg>
  );
}

export function SubmitButton({
  children,
  disabled,
  ...rest
}: ComponentProps<typeof Button>) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} type="submit" {...rest}>
      {pending ? <Spinner /> : children}
    </Button>
  );
}
