"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { GripVertical, X } from "lucide-react";

import { useMapActions } from "@/components/map/use-map-actions";
import { MarkerEditor } from "@/components/panel/marker-editor";
import { categoryColor } from "@/lib/categories";
import { compassPoint, formatDistance } from "@/lib/geo";
import { useTripsStore } from "@/store/trips";
import type { MapMarker, RouteLeg } from "@/types";

interface MarkerRowProps {
  marker: MapMarker;
  index: number;
  selected: boolean;
  /** The hop from this stop to the next one, when there is one. */
  leg?: RouteLeg;
}

export function MarkerRow({ marker, index, selected, leg }: MarkerRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: marker.id,
  });
  const selectMarker = useTripsStore((state) => state.selectMarker);
  const removeMarker = useTripsStore((state) => state.removeMarker);
  const { flyTo } = useMapActions();

  const color = categoryColor(marker.category);

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={clsx(
        "group relative rounded-xl border transition-colors",
        isDragging && "z-10 opacity-90 shadow-2xl",
        selected
          ? "border-accent/40 bg-accent/[0.07]"
          : "border-transparent hover:border-white/10 hover:bg-white/[0.03]",
      )}
    >
      <div className="flex items-center gap-1 py-1 pr-1.5 pl-1">
        <button
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${marker.name}`}
          className="text-faint/50 hover:text-muted flex size-6 shrink-0 cursor-grab items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical className="size-3.5" />
        </button>

        <button
          onClick={() => {
            selectMarker(selected ? null : marker.id);
            if (!selected) flyTo(marker);
          }}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-lg py-1.5 pr-1 text-left"
        >
          <span
            aria-hidden
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ring-2 ring-white/15"
            style={{ backgroundColor: color }}
          >
            {index + 1}
          </span>

          <span className="min-w-0 flex-1">
            <span className="text-ink block truncate text-[13px] font-medium">{marker.name}</span>
            {marker.note && (
              <span className="text-faint block truncate text-[11px]">{marker.note}</span>
            )}
          </span>
        </button>

        <button
          onClick={() => removeMarker(marker.id)}
          aria-label={`Remove ${marker.name}`}
          className="text-faint/50 hover:bg-danger/10 hover:text-danger flex size-6 shrink-0 items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {selected && <MarkerEditor marker={marker} />}

      {/* The hop to the next stop, drawn as a connector under the row. */}
      {leg && !isDragging && (
        <div className="pointer-events-none flex items-center gap-2 pt-0.5 pb-1 pl-[1.85rem]">
          <span aria-hidden className="h-3 w-px bg-gradient-to-b from-white/20 to-transparent" />
          <span className="text-faint/80 font-mono text-[10px]">
            {formatDistance(leg.distance)} &middot; {compassPoint(leg.bearing)}
          </span>
        </div>
      )}
    </li>
  );
}
