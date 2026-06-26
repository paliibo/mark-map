"use client";

import { useCallback } from "react";
import { useMap } from "react-map-gl/maplibre";

import { boundsOf } from "@/lib/geo";
import { useUiStore } from "@/store/ui";
import type { LngLat } from "@/types";

/**
 * Room for the panel so `fitBounds` does not park half the route behind it.
 * The panel is a sidebar on wide screens and a bottom sheet on narrow ones, so
 * the sheet is measured rather than guessed — its height follows its content.
 */
function paddingFor(panelOpen: boolean) {
  if (typeof window === "undefined") return { top: 96, bottom: 96, left: 96, right: 96 };

  const { innerWidth, innerHeight } = window;

  if (innerWidth >= 1024) {
    return { top: 96, bottom: 96, right: 72, left: panelOpen ? 420 : 48 };
  }

  const sheet = document.querySelector('aside[aria-label="Trip planner"]');
  const sheetHeight = panelOpen && sheet ? sheet.getBoundingClientRect().height + 16 : 72;
  const top = 88;

  return {
    top,
    // MapLibre throws if the padding leaves no room, so always keep a band open.
    bottom: Math.min(sheetHeight, Math.max(48, innerHeight - top - 120)),
    left: 24,
    right: 24,
  };
}

/**
 * Camera moves, shared by the map, the side panel, the search box and the
 * command palette so every "take me there" behaves identically.
 */
export function useMapActions() {
  const { main: map } = useMap();
  const panelOpen = useUiStore((state) => state.panelOpen);

  const flyTo = useCallback(
    (position: LngLat, zoom?: number) => {
      map?.flyTo({
        center: [position.lng, position.lat],
        zoom: zoom ?? Math.max(map.getZoom(), 14),
        duration: 900,
        essential: true,
        padding: paddingFor(panelOpen),
      });
    },
    [map, panelOpen],
  );

  const fitTo = useCallback(
    (points: LngLat[]) => {
      if (!map) return;
      const bounds = boundsOf(points);
      if (!bounds) return;

      const [west, south, east, north] = bounds;

      // A single stop has no extent — fly to it instead of fitting a zero box.
      if (points.length === 1) {
        flyTo(points[0]!, 15);
        return;
      }

      map.fitBounds(
        [
          [west, south],
          [east, north],
        ],
        { padding: paddingFor(panelOpen), duration: 900, maxZoom: 16 },
      );
    },
    [map, panelOpen, flyTo],
  );

  const zoomBy = useCallback(
    (delta: number) => map?.easeTo({ zoom: (map.getZoom() ?? 10) + delta, duration: 220 }),
    [map],
  );

  const resetNorth = useCallback(() => map?.easeTo({ bearing: 0, pitch: 0, duration: 400 }), [map]);

  const center = useCallback((): LngLat | null => {
    const value = map?.getCenter();
    return value ? { lng: value.lng, lat: value.lat } : null;
  }, [map]);

  /** Current viewport as a Nominatim-style viewbox, for search biasing. */
  const viewbox = useCallback((): [number, number, number, number] | null => {
    const bounds = map?.getBounds();
    if (!bounds) return null;
    return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()];
  }, [map]);

  return { map, flyTo, fitTo, zoomBy, resetNorth, center, viewbox };
}
