"use client";

import clsx from "clsx";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import { IconButton } from "@/components/ui/button";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Palette-style dialogs sit high on screen instead of centred. */
  align?: "center" | "top";
  showClose?: boolean;
}

/**
 * A small modal. Handles Escape, backdrop clicks, body scroll locking and
 * returning focus to whatever was focused before it opened.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  align = "center",
  showClose = true,
}: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      // Keep Tab inside the dialog.
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first meaningful control once the panel has painted.
    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(
        'input, textarea, [data-autofocus="true"], button',
      );
      target?.focus();
    }, 20);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={clsx(
        "animate-fade-in fixed inset-0 z-50 flex justify-center p-4",
        align === "top" ? "items-start pt-[12vh]" : "items-center",
      )}
    >
      <button
        aria-label="Close dialog"
        tabIndex={-1}
        className="bg-canvas/70 absolute inset-0 cursor-default backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={clsx(
          "glass rounded-panel animate-rise relative z-10 w-full",
          className ?? "max-w-lg",
        )}
      >
        {(title || showClose) && (
          <header className="flex items-start justify-between gap-4 border-b border-white/5 px-5 py-4">
            <div className="min-w-0">
              {title && <h2 className="text-ink truncate text-sm font-semibold">{title}</h2>}
              {description && <p className="text-muted mt-1 text-xs">{description}</p>}
            </div>
            {showClose && (
              <IconButton label="Close" onClick={onClose} className="-mt-1 -mr-1 size-8">
                <X className="size-4" />
              </IconButton>
            )}
          </header>
        )}
        {children}
      </div>
    </div>
  );
}
