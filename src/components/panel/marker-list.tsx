"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MapPinPlus } from "lucide-react";
import { useMemo } from "react";

import { MarkerRow } from "@/components/panel/marker-row";
import { buildRoute } from "@/lib/route";
import { activeTripOf, useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

/** The ordered stop list. Drag to reorder; the route follows immediately. */
export function MarkerList() {
  const trip = useTripsStore(activeTripOf);
  const selectedMarkerId = useTripsStore((state) => state.selectedMarkerId);
  const reorderMarkers = useTripsStore((state) => state.reorderMarkers);
  const setAddMode = useUiStore((state) => state.setAddMode);

  const markers = useMemo(() => trip?.markers ?? [], [trip]);
  const legs = useMemo(
    () => buildRoute(markers, trip?.travelMode ?? "walk", false).legs,
    [markers, trip?.travelMode],
  );

  const sensors = useSensors(
    // A small threshold so a click still reads as a click, not a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = markers.findIndex((marker) => marker.id === active.id);
    const to = markers.findIndex((marker) => marker.id === over.id);
    if (from !== -1 && to !== -1) reorderMarkers(from, to);
  };

  if (markers.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
        <span className="text-faint flex size-11 items-center justify-center rounded-full bg-white/5">
          <MapPinPlus className="size-5" />
        </span>
        <div>
          <p className="text-muted text-[13px] font-medium">No stops yet</p>
          <p className="text-faint mt-1 text-[11px] leading-relaxed">
            Search for a place, or drop one straight onto the map.
          </p>
        </div>
        <button
          onClick={() => setAddMode(true)}
          className="text-muted hover:text-ink rounded-lg bg-white/5 px-3 py-1.5 text-[11px] transition-colors hover:bg-white/10"
        >
          Drop a stop
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto overscroll-contain px-2 py-2">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={markers.map((marker) => marker.id)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-0.5">
            {markers.map((marker, index) => (
              <MarkerRow
                key={marker.id}
                marker={marker}
                index={index}
                selected={selectedMarkerId === marker.id}
                leg={legs[index]}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}
