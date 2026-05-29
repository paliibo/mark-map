"use client";

import { HelpCircle, PanelLeftOpen, Target } from "lucide-react";
import { useEffect } from "react";
import { MapProvider } from "react-map-gl/maplibre";

import { MapCanvas } from "@/components/map/map-canvas";
import { MapControls } from "@/components/map/map-controls";
import { StyleSwitcher } from "@/components/map/style-switcher";
import { useKeyboardShortcuts } from "@/components/map/use-keyboard-shortcuts";
import { CommandPalette } from "@/components/overlays/command-palette";
import { ShareDialog } from "@/components/overlays/share-dialog";
import { SharedTripDialog } from "@/components/overlays/shared-trip-dialog";
import { ShortcutsDialog } from "@/components/overlays/shortcuts-dialog";
import { Toaster } from "@/components/overlays/toaster";
import { SidePanel } from "@/components/panel/side-panel";
import { PlaceSearch } from "@/components/search/place-search";
import { IconButton } from "@/components/ui/button";
import { decodeTrip, readSharePayload } from "@/lib/share";
import { useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

function Workspace() {
  useKeyboardShortcuts();

  const panelOpen = useUiStore((state) => state.panelOpen);
  const setPanelOpen = useUiStore((state) => state.setPanelOpen);
  const addMode = useUiStore((state) => state.addMode);
  const openDialog = useUiStore((state) => state.openDialog);

  return (
    <div className="bg-canvas relative h-dvh w-full overflow-hidden">
      <MapCanvas />

      {/* Chrome layer: transparent to pointer events except where it isn't. */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-2 top-2 flex justify-center lg:inset-x-auto lg:top-4 lg:right-24 lg:left-[400px]">
          <PlaceSearch />
        </div>

        <SidePanel />

        {!panelOpen && (
          <div className="glass animate-fade-in pointer-events-auto absolute top-16 left-2 rounded-xl p-1 lg:top-4 lg:left-4">
            <IconButton label="Show panel (B)" onClick={() => setPanelOpen(true)}>
              <PanelLeftOpen className="size-4" />
            </IconButton>
          </div>
        )}

        {addMode && (
          <div className="pointer-events-none absolute inset-x-0 top-16 flex justify-center lg:top-20">
            <p className="glass text-muted animate-rise flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px]">
              <Target className="text-accent size-3.5" />
              Click the map to drop a stop
              <span className="text-faint">· Esc to stop</span>
            </p>
          </div>
        )}

        <div className="pointer-events-auto absolute top-16 right-2 flex flex-col items-end gap-2 lg:top-auto lg:right-4 lg:bottom-4">
          <StyleSwitcher />
          <MapControls />
          {/* Keyboard help is meaningless on touch, and the space is needed. */}
          <div className="lg:glass hidden rounded-xl p-1 lg:block">
            <IconButton label="Keyboard shortcuts (?)" onClick={() => openDialog("shortcuts")}>
              <HelpCircle className="size-4" />
            </IconButton>
          </div>
        </div>
      </div>

      <CommandPalette />
      <ShortcutsDialog />
      <ShareDialog />
      <SharedTripDialog />
      <Toaster />
    </div>
  );
}

export default function MapWorkspace() {
  const setPendingShare = useUiStore((state) => state.setPendingShare);
  const openDialog = useUiStore((state) => state.openDialog);
  const toast = useUiStore((state) => state.toast);

  // Persisted state lives in IndexedDB and localStorage, neither of which
  // exists while the page is being prerendered — so hydrate on mount instead.
  useEffect(() => {
    void useTripsStore.persist.rehydrate();
    void useUiStore.persist.rehydrate();
  }, []);

  // A share link carries its whole trip in the fragment. Decode it, preview it,
  // then clean the URL so a refresh does not ask twice. Pasting a link while
  // the app is already open only fires `hashchange`, so both paths run this.
  useEffect(() => {
    const consumeShareLink = () => {
      const payload = readSharePayload(window.location.hash);
      if (!payload) return;

      try {
        setPendingShare(decodeTrip(payload));
        openDialog("shared-trip");
      } catch (error) {
        toast({
          title: "That share link is broken",
          description: error instanceof Error ? error.message : "Could not decode the trip.",
          tone: "error",
        });
      } finally {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
    };

    consumeShareLink();
    window.addEventListener("hashchange", consumeShareLink);
    return () => window.removeEventListener("hashchange", consumeShareLink);
  }, [openDialog, setPendingShare, toast]);

  return (
    <MapProvider>
      <Workspace />
    </MapProvider>
  );
}
