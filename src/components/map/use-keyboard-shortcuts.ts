"use client";

import { useEffect } from "react";

import { useMapActions } from "@/components/map/use-map-actions";
import { useTripActions } from "@/components/map/use-trip-actions";
import { MAP_STYLES } from "@/lib/map-styles";
import { activeTripOf, useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

const STYLE_IDS = MAP_STYLES.map((style) => style.id);

/** True while focus is in a text field, where letter keys must stay literal. */
function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest("input, textarea, select, [contenteditable='true']"));
}

/** App-wide keyboard shortcuts. Mirrors the command palette exactly. */
export function useKeyboardShortcuts() {
  const { fitTo } = useMapActions();
  const { addAtCenter, optimize, reverse } = useTripActions();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const ui = useUiStore.getState();
      const meta = event.metaKey || event.ctrlKey;

      // The palette toggle has to work from anywhere, typing included.
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        ui.toggleDialog("palette");
        return;
      }

      if (meta && event.key.toLowerCase() === "z") {
        if (isTyping(event.target)) return;
        event.preventDefault();
        const trips = useTripsStore.getState();
        if (event.shiftKey) trips.redo();
        else trips.undo();
        return;
      }

      if (event.key === "Escape") {
        if (ui.dialog) ui.closeDialog();
        else if (ui.addMode) ui.setAddMode(false);
        else useTripsStore.getState().selectMarker(null);
        return;
      }

      // Everything below is a bare letter — never steal it from a text field
      // or from behind an open dialog.
      if (isTyping(event.target) || ui.dialog || meta || event.altKey) return;

      switch (event.key.toLowerCase()) {
        case "?":
          event.preventDefault();
          ui.openDialog("shortcuts");
          break;
        case "n":
          event.preventDefault();
          addAtCenter();
          break;
        case "a":
          event.preventDefault();
          ui.toggleAddMode();
          break;
        case "o":
          event.preventDefault();
          optimize();
          break;
        case "r":
          event.preventDefault();
          reverse();
          break;
        case "f":
          event.preventDefault();
          fitTo(activeTripOf(useTripsStore.getState())?.markers ?? []);
          break;
        case "b":
          event.preventDefault();
          ui.togglePanel();
          break;
        case "m":
          event.preventDefault();
          ui.cycleMapStyle(STYLE_IDS);
          break;
        case "backspace":
        case "delete": {
          const trips = useTripsStore.getState();
          if (!trips.selectedMarkerId) return;
          event.preventDefault();
          trips.removeMarker(trips.selectedMarkerId);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addAtCenter, fitTo, optimize, reverse]);
}
