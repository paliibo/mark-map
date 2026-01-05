"use client";

import dynamic from "next/dynamic";

/**
 * MapLibre reaches for `window` as soon as it is imported, so the whole
 * workspace is loaded on the client only. The skeleton below is what the
 * static HTML actually contains.
 */
const MapWorkspace = dynamic(() => import("@/components/map/map-workspace"), {
  ssr: false,
  loading: () => (
    <div className="bg-canvas relative flex h-dvh w-full items-center justify-center overflow-hidden">
      <div className="grid-backdrop absolute inset-0 opacity-40" />
      <div className="relative flex flex-col items-center gap-3">
        <span className="relative flex size-8 items-center justify-center">
          <span className="animate-pulse-ring bg-accent/40 absolute inset-0 rounded-full" />
          <span className="bg-accent size-2.5 rounded-full" />
        </span>
        <p className="text-faint text-xs">Loading the map…</p>
      </div>
    </div>
  ),
});

export default function MapPage() {
  return <MapWorkspace />;
}
