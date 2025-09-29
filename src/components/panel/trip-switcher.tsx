"use client";

import clsx from "clsx";
import { Check, ChevronDown, Copy, Plus, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { TextInput } from "@/components/ui/field";
import { activeTripOf, useTripsStore } from "@/store/trips";

/** Switch between saved trips, and rename the current one in place. */
export function TripSwitcher() {
  const trips = useTripsStore((state) => state.trips);
  const trip = useTripsStore(activeTripOf);
  const setActiveTrip = useTripsStore((state) => state.setActiveTrip);
  const createTrip = useTripsStore((state) => state.createTrip);
  const deleteTrip = useTripsStore((state) => state.deleteTrip);
  const duplicateTrip = useTripsStore((state) => state.duplicateTrip);
  const renameTrip = useTripsStore((state) => state.renameTrip);

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

  if (!trip) return null;

  return (
    <div ref={containerRef} className="relative border-b border-white/5 px-3 py-2.5">
      <button
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-white/5"
      >
        <span className="min-w-0 flex-1">
          <span className="text-ink block truncate text-sm font-semibold">{trip.name}</span>
          <span className="text-faint block text-[11px]">
            {trips.length} {trips.length === 1 ? "trip" : "trips"} saved on this device
          </span>
        </span>
        <ChevronDown
          className={clsx("text-faint size-4 shrink-0 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="glass animate-rise absolute inset-x-3 top-[calc(100%-2px)] z-30 rounded-xl p-2">
          <TextInput
            value={trip.name}
            aria-label="Trip name"
            maxLength={60}
            onChange={(event) => renameTrip(trip.id, event.target.value)}
            className="mb-2 h-8 text-[13px]"
          />

          <ul className="max-h-52 space-y-0.5 overflow-y-auto">
            {trips.map((candidate) => (
              <li key={candidate.id} className="group flex items-center gap-1">
                <button
                  onClick={() => {
                    setActiveTrip(candidate.id);
                    setOpen(false);
                  }}
                  className={clsx(
                    "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors",
                    candidate.id === trip.id
                      ? "text-accent"
                      : "text-muted hover:text-ink hover:bg-white/5",
                  )}
                >
                  <Check
                    className={clsx(
                      "size-3 shrink-0",
                      candidate.id === trip.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="truncate">{candidate.name}</span>
                  <span className="text-faint ml-auto shrink-0 font-mono text-[10px]">
                    {candidate.markers.length}
                  </span>
                </button>

                {trips.length > 1 && (
                  <button
                    onClick={() => deleteTrip(candidate.id)}
                    aria-label={`Delete ${candidate.name}`}
                    className="text-faint/40 hover:bg-danger/10 hover:text-danger flex size-6 shrink-0 items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100"
                  >
                    <Trash2 className="size-3" />
                  </button>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-2 flex gap-1 border-t border-white/5 pt-2">
            <button
              onClick={() => {
                createTrip();
                setOpen(false);
              }}
              className="text-muted hover:text-ink flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-2 py-1.5 text-[11px] transition-colors hover:bg-white/10"
            >
              <Plus className="size-3" />
              New trip
            </button>
            <button
              onClick={() => {
                duplicateTrip(trip.id);
                setOpen(false);
              }}
              className="text-muted hover:text-ink flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white/5 px-2 py-1.5 text-[11px] transition-colors hover:bg-white/10"
            >
              <Copy className="size-3" />
              Duplicate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
