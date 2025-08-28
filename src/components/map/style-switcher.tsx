"use client";

import clsx from "clsx";
import { Layers } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { IconButton } from "@/components/ui/button";
import { MAP_STYLES } from "@/lib/map-styles";
import { useUiStore } from "@/store/ui";

const SWATCHES: Record<string, string> = {
  dark: "linear-gradient(135deg,#0b1220,#1e293b)",
  light: "linear-gradient(135deg,#f1f5f9,#cbd5e1)",
  voyager: "linear-gradient(135deg,#dbeafe,#fbcfe8)",
  satellite: "linear-gradient(135deg,#14532d,#78350f)",
};

/** Basemap picker. Every option here is keyless and free to use. */
export function StyleSwitcher() {
  const current = useUiStore((state) => state.mapStyle);
  const setMapStyle = useUiStore((state) => state.setMapStyle);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {open && (
        <div
          role="listbox"
          aria-label="Basemap"
          className="glass animate-rise absolute right-0 bottom-[calc(100%+8px)] w-44 rounded-xl p-1.5"
        >
          {MAP_STYLES.map((style) => (
            <button
              key={style.id}
              role="option"
              aria-selected={style.id === current}
              onClick={() => {
                setMapStyle(style.id);
                setOpen(false);
              }}
              className={clsx(
                "flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                style.id === current
                  ? "bg-accent/15 text-accent"
                  : "text-muted hover:text-ink hover:bg-white/5",
              )}
            >
              <span
                aria-hidden
                className="size-5 shrink-0 rounded-md ring-1 ring-white/15"
                style={{ background: SWATCHES[style.id] }}
              />
              {style.label}
            </button>
          ))}
        </div>
      )}

      <div className="glass rounded-xl p-1">
        <IconButton label="Change basemap" active={open} onClick={() => setOpen((value) => !value)}>
          <Layers className="size-4" />
        </IconButton>
      </div>
    </div>
  );
}
