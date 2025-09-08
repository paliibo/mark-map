"use client";

import clsx from "clsx";
import { Crosshair, Trash2 } from "lucide-react";

import { useMapActions } from "@/components/map/use-map-actions";
import { Button } from "@/components/ui/button";
import { FieldLabel, TextArea, TextInput } from "@/components/ui/field";
import { CATEGORIES } from "@/lib/categories";
import { formatLngLat } from "@/lib/geo";
import { useTripsStore } from "@/store/trips";
import type { MapMarker } from "@/types";

/** Inline editor that unfolds under the selected stop. */
export function MarkerEditor({ marker }: { marker: MapMarker }) {
  const updateMarker = useTripsStore((state) => state.updateMarker);
  const removeMarker = useTripsStore((state) => state.removeMarker);
  const { flyTo } = useMapActions();

  return (
    <div className="animate-rise space-y-3 border-t border-white/5 bg-white/[0.02] px-3 py-3">
      <div>
        <FieldLabel htmlFor={`name-${marker.id}`}>Name</FieldLabel>
        <TextInput
          id={`name-${marker.id}`}
          value={marker.name}
          maxLength={80}
          onChange={(event) => updateMarker(marker.id, { name: event.target.value })}
        />
      </div>

      <div>
        <FieldLabel htmlFor={`note-${marker.id}`}>Note</FieldLabel>
        <TextArea
          id={`note-${marker.id}`}
          rows={2}
          value={marker.note}
          maxLength={280}
          placeholder="Opening hours, who recommended it, what to order…"
          onChange={(event) => updateMarker(marker.id, { note: event.target.value })}
        />
      </div>

      <div>
        <FieldLabel>Category</FieldLabel>
        <div className="flex flex-wrap gap-1">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => updateMarker(marker.id, { category: category.id })}
              aria-pressed={marker.category === category.id}
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] transition-all",
                marker.category === category.id
                  ? "text-ink bg-white/10 ring-1 ring-white/20"
                  : "text-faint hover:text-muted hover:bg-white/5",
              )}
            >
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              {category.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <code className="text-faint font-mono text-[10px]">{formatLngLat(marker)}</code>

        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => flyTo(marker, 16)}>
            <Crosshair className="size-3.5" />
            Center
          </Button>
          <Button size="sm" variant="danger" onClick={() => removeMarker(marker.id)}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
