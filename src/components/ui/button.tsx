"use client";

import clsx from "clsx";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-accent text-canvas font-semibold hover:bg-sky-300 active:bg-sky-400 shadow-[0_8px_24px_-12px] shadow-accent/80",
  ghost: "text-muted hover:text-ink hover:bg-white/5 active:bg-white/10",
  outline:
    "border border-white/10 bg-white/[0.03] text-ink hover:bg-white/[0.07] hover:border-white/20",
  danger: "text-danger hover:bg-danger/10 border border-transparent hover:border-danger/30",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-2.5 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-3 text-sm gap-2 rounded-lg",
  lg: "h-11 px-5 text-sm gap-2 rounded-xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "ghost", size = "md", type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={clsx(
        "inline-flex items-center justify-center whitespace-nowrap transition-all duration-150 select-none",
        "disabled:pointer-events-none disabled:opacity-40",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  active?: boolean;
}

/** A square, icon-only button. `label` becomes both tooltip and accessible name. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { className, label, active = false, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      title={label}
      aria-label={label}
      className={clsx(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg transition-all duration-150",
        "disabled:pointer-events-none disabled:opacity-35",
        active
          ? "bg-accent/15 text-accent ring-accent/40 ring-1"
          : "text-muted hover:text-ink hover:bg-white/5 active:bg-white/10",
        className,
      )}
      {...props}
    />
  );
});
