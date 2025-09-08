"use client";

import clsx from "clsx";
import { Bike, Car, Footprints, Repeat } from "lucide-react";
import { useMemo } from "react";

import { formatDistance, formatDuration } from "@/lib/geo";
import { buildRoute } from "@/lib/route";
import { activeTripOf, useTripsStore } from "@/store/trips";
import type { TravelMode } from "@/types";

const MODES: { id: TravelMode; label: string; Icon: typeof Bike }[] = [
  { id: "walk", label: "Walk", Icon: Footprints },
  { id: "cycle", label: "Cycle", Icon: Bike },
  { id: "drive", label: "Drive", Icon: Car },
];

/** Distance, time estimate and the two settings that change them. */
export function RouteStats() {
  const trip = useTripsStore(activeTripOf);
  const setTravelMode = useTripsStore((state) => state.setTravelMode);
  const setRoundTrip = useTripsStore((state) => state.setRoundTrip);

  const summary = useMemo(
    () => buildRoute(trip?.markers ?? [], trip?.travelMode ?? "walk", trip?.roundTrip ?? false),
    [trip?.markers, trip?.travelMode, trip?.roundTrip],
  );

  const stops = trip?.markers.length ?? 0;

  return (
    <section className="border-b border-white/5 px-4 py-3.5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-ink font-mono text-2xl leading-none tracking-tight">
            {formatDistance(summary.totalDistance)}
          </p>
          <p className="text-faint mt-1.5 text-[11px]">
            {stops} {stops === 1 ? "stop" : "stops"} &middot; {formatDuration(summary.duration)} by{" "}
            {trip?.travelMode ?? "walk"}
          </p>
        </div>

        <button
          onClick={() => setRoundTrip(!trip?.roundTrip)}
          aria-pressed={trip?.roundTrip ?? false}
          title="Return to the first stop"
          className={clsx(
            "inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] transition-colors",
            trip?.roundTrip
              ? "bg-accent/15 text-accent ring-accent/30 ring-1"
              : "text-faint hover:text-muted ring-1 ring-white/10",
          )}
        >
          <Repeat className="size-3" />
          Round trip
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-white/[0.04] p-1">
        {MODES.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTravelMode(id)}
            aria-pressed={trip?.travelMode === id}
            className={clsx(
              "flex h-7 items-center justify-center gap-1.5 rounded-md text-[11px] font-medium transition-all",
              trip?.travelMode === id
                ? "text-ink bg-white/10 shadow-sm"
                : "text-faint hover:text-muted",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <p className="text-faint/70 mt-2 text-[10px] leading-relaxed">
        Straight-line distances — no routing service, so nothing leaves your browser.
      </p>
    </section>
  );
}
