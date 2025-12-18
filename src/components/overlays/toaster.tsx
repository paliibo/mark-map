"use client";

import clsx from "clsx";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";

import { useUiStore, type ToastTone } from "@/store/ui";

const TONES: Record<ToastTone, { icon: typeof Info; className: string }> = {
  info: { icon: Info, className: "text-accent" },
  success: { icon: CircleCheck, className: "text-positive" },
  error: { icon: CircleAlert, className: "text-danger" },
};

/** Transient feedback, bottom-centre, above the panel on mobile. */
export function Toaster() {
  const toasts = useUiStore((state) => state.toasts);
  const dismissToast = useUiStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
    >
      {toasts.map((toast) => {
        const { icon: Icon, className } = TONES[toast.tone];

        return (
          <div
            key={toast.id}
            role="status"
            className="glass animate-rise pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-xl px-3.5 py-2.5"
          >
            <Icon className={clsx("mt-0.5 size-4 shrink-0", className)} />
            <div className="min-w-0 flex-1">
              <p className="text-ink text-[13px] font-medium">{toast.title}</p>
              {toast.description && (
                <p className="text-muted mt-0.5 text-[11px] leading-relaxed">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss"
              className="text-faint hover:text-ink transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
