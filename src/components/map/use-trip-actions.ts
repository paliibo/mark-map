"use client";

import { useCallback } from "react";

import { useMapActions } from "@/components/map/use-map-actions";
import { downloadFile, markersToGeoJSON, markersToGpx, parseImport, slugify } from "@/lib/io";
import { applyOrder, optimizeRoute } from "@/lib/route";
import { buildShareUrl } from "@/lib/share";
import { activeTripOf, useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

/**
 * Every trip-level command in one place, so the side panel, the command
 * palette and the keyboard shortcuts all run exactly the same code.
 */
export function useTripActions() {
  const { center, fitTo, flyTo } = useMapActions();
  const toast = useUiStore((state) => state.toast);
  const openDialog = useUiStore((state) => state.openDialog);

  const addAtCenter = useCallback(() => {
    const position = center();
    if (!position) return;
    const id = useTripsStore.getState().addMarker(position);
    toast({ title: "Stop added", description: "Dropped at the centre of the map." });
    return id;
  }, [center, toast]);

  const optimize = useCallback(() => {
    const state = useTripsStore.getState();
    const trip = activeTripOf(state);
    if (!trip || trip.markers.length < 4) {
      toast({
        title: "Not enough stops",
        description: "Add at least four stops before optimising.",
        tone: "error",
      });
      return;
    }

    const result = optimizeRoute(trip.markers, { fixStart: true, roundTrip: trip.roundTrip });

    if (result.saved <= 0) {
      toast({ title: "Already optimal", description: "This order is the shortest one found." });
      return;
    }

    state.setMarkers(applyOrder(trip.markers, result.order));
    fitTo(trip.markers);
    toast({
      title: `Route ${Math.round(result.saved * 100)}% shorter`,
      description: `Trimmed ${Math.round((result.before - result.after) / 100) / 10} km. Undo with ⌘Z.`,
      tone: "success",
    });
  }, [fitTo, toast]);

  const reverse = useCallback(() => {
    const state = useTripsStore.getState();
    const trip = activeTripOf(state);
    if (!trip || trip.markers.length < 2) return;
    state.setMarkers([...trip.markers].reverse());
    toast({ title: "Route reversed" });
  }, [toast]);

  const clearAll = useCallback(() => {
    const state = useTripsStore.getState();
    const count = activeTripOf(state)?.markers.length ?? 0;
    if (count === 0) return;
    state.clearMarkers();
    toast({ title: `Removed ${count} stops`, description: "Undo with ⌘Z." });
  }, [toast]);

  const exportAs = useCallback(
    (format: "geojson" | "gpx") => {
      const trip = activeTripOf(useTripsStore.getState());
      if (!trip || trip.markers.length === 0) {
        toast({ title: "Nothing to export", tone: "error" });
        return;
      }

      const base = slugify(trip.name);

      if (format === "gpx") {
        downloadFile(
          `${base}.gpx`,
          markersToGpx(trip.markers, { tripName: trip.name, roundTrip: trip.roundTrip }),
          "application/gpx+xml",
        );
      } else {
        const collection = markersToGeoJSON(trip.markers, { roundTrip: trip.roundTrip });
        downloadFile(
          `${base}.geojson`,
          JSON.stringify(collection, null, 2),
          "application/geo+json",
        );
      }

      toast({ title: `Exported ${format.toUpperCase()}`, description: `${base}.${format}` });
    },
    [toast],
  );

  const importFile = useCallback(
    async (file: File) => {
      try {
        const stops = parseImport(file.name, await file.text());
        const added = useTripsStore.getState().importStops(stops, "append");
        fitTo(stops);
        toast({
          title: `Imported ${added} stops`,
          description: file.name,
          tone: "success",
        });
      } catch (error) {
        toast({
          title: "Import failed",
          description: error instanceof Error ? error.message : "Unknown error",
          tone: "error",
        });
      }
    },
    [fitTo, toast],
  );

  /** Open a file picker without keeping a hidden input in the tree. */
  const openImportPicker = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".geojson,.json,.gpx,application/geo+json,application/json,application/gpx+xml";
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) void importFile(file);
    };
    input.click();
  }, [importFile]);

  /** Build the share link, copy it, and show it in a dialog as a fallback. */
  const share = useCallback(async () => {
    const trip = activeTripOf(useTripsStore.getState());
    if (!trip || trip.markers.length === 0) {
      toast({ title: "Nothing to share yet", description: "Add a stop first.", tone: "error" });
      return;
    }

    const url = buildShareUrl(`${window.location.origin}${window.location.pathname}`, trip);
    openDialog("share");

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Link copied",
        description: "The whole trip travels inside the URL.",
        tone: "success",
      });
    } catch {
      // Clipboard needs a secure context and a user gesture; the dialog still
      // shows the link so it can be copied by hand.
    }
  }, [openDialog, toast]);

  return {
    addAtCenter,
    optimize,
    reverse,
    clearAll,
    exportAs,
    importFile,
    openImportPicker,
    share,
    flyTo,
    fitTo,
  };
}
