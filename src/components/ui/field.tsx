"use client";

import clsx from "clsx";
import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

const BASE =
  "w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-ink " +
  "placeholder:text-faint transition-colors hover:border-white/15 " +
  "focus:border-accent/60 focus:bg-white/[0.06] focus:outline-none";

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={clsx(BASE, "h-9 py-0", className)} {...props} />;
  },
);

export const TextArea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextArea({ className, ...props }, ref) {
  return <textarea ref={ref} className={clsx(BASE, "resize-none", className)} {...props} />;
});

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-faint mb-1.5 block text-[11px] font-medium tracking-wider uppercase"
    >
      {children}
    </label>
  );
}
