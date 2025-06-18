"use client";

import clsx from "clsx";

import { categoryColor } from "@/lib/categories";
import type { MapMarker } from "@/types";

interface MarkerPinProps {
  marker: MapMarker;
  /** 1-based position in the route. */
  index: number;
  selected: boolean;
  dragging?: boolean;
}

/**
 * The pin itself is a plain DOM node handed to MapLibre, which means it can be
 * styled, animated and made hoverable with ordinary CSS instead of being baked
 * into a sprite sheet.
 */
export function MarkerPin({ marker, index, selected, dragging = false }: MarkerPinProps) {
  const color = categoryColor(marker.category);

  return (
    <div className="group animate-pin-drop relative flex cursor-pointer flex-col items-center">
      {/* Name chip — always visible for the selected stop, on hover otherwise. */}
      <div
        className={clsx(
          "pointer-events-none absolute bottom-[calc(100%+6px)] max-w-44 truncate rounded-md px-2 py-1",
          "text-[11px] font-medium shadow-lg transition-all duration-150",
          "bg-canvas/90 text-ink ring-1 ring-white/10 backdrop-blur-sm",
          selected
            ? "translate-y-0 opacity-100"
            : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100",
        )}
      >
        {marker.name}
      </div>

      {selected && (
        <span
          aria-hidden
          className="animate-pulse-ring absolute top-1 size-8 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}

      <div
        className={clsx(
          "relative flex items-center justify-center rounded-full border-2 font-semibold text-white",
          "shadow-[0_6px_16px_-4px_rgba(0,0,0,0.8)] transition-all duration-200",
          selected
            ? "size-9 border-white text-xs"
            : "size-7 border-white/85 text-[11px] group-hover:size-8",
          dragging && "scale-110 ring-4 ring-white/25",
        )}
        style={{ backgroundColor: color }}
      >
        {index}
      </div>

      {/* Tail, tinted to match the pin. */}
      <span
        aria-hidden
        className="-mt-px size-0 border-x-[5px] border-t-[7px] border-x-transparent transition-colors"
        style={{ borderTopColor: color }}
      />
    </div>
  );
}
