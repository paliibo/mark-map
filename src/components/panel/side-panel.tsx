"use client";

import clsx from "clsx";
import {
  ArrowUpDown,
  Command,
  Download,
  MapPinPlus,
  PanelLeftClose,
  Redo2,
  Share2,
  Trash2,
  Undo2,
  Upload,
  Wand2,
} from "lucide-react";

import { useTripActions } from "@/components/map/use-trip-actions";
import { MarkerList } from "@/components/panel/marker-list";
import { RouteStats } from "@/components/panel/route-stats";
import { TripSwitcher } from "@/components/panel/trip-switcher";
import { Button, IconButton } from "@/components/ui/button";
import { activeTripOf, useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

export function SidePanel() {
  const panelOpen = useUiStore((state) => state.panelOpen);
  const setPanelOpen = useUiStore((state) => state.setPanelOpen);
  const addMode = useUiStore((state) => state.addMode);
  const toggleAddMode = useUiStore((state) => state.toggleAddMode);
  const openDialog = useUiStore((state) => state.openDialog);

  const undo = useTripsStore((state) => state.undo);
  const redo = useTripsStore((state) => state.redo);
  const canUndo = useTripsStore((state) => state.past.length > 0);
  const canRedo = useTripsStore((state) => state.future.length > 0);
  const stopCount = useTripsStore((state) => activeTripOf(state)?.markers.length ?? 0);

  const { optimize, reverse, clearAll, exportAs, openImportPicker, share } = useTripActions();

  return (
    <aside
      aria-label="Trip planner"
      className={clsx(
        "glass rounded-panel pointer-events-auto z-20 flex flex-col overflow-hidden transition-all duration-300",
        "absolute inset-x-2 bottom-2 max-h-[58vh]",
        "lg:inset-x-auto lg:top-4 lg:bottom-4 lg:left-4 lg:max-h-none lg:w-[368px]",
        panelOpen
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0 lg:-translate-x-6 lg:translate-y-0",
      )}
    >
      <header className="flex items-center gap-1 border-b border-white/5 px-3 py-2">
        <span className="flex items-center gap-2 pr-2 pl-1">
          <span aria-hidden className="relative flex size-5 items-center justify-center">
            <span className="bg-accent/20 absolute inset-0 rounded-full" />
            <span className="bg-accent size-2 rounded-full" />
          </span>
          <span className="text-[13px] font-semibold tracking-tight">Mark Map</span>
        </span>

        <div className="ml-auto flex items-center">
          <IconButton label="Undo (⌘Z)" onClick={undo} disabled={!canUndo} className="size-8">
            <Undo2 className="size-3.5" />
          </IconButton>
          <IconButton label="Redo (⇧⌘Z)" onClick={redo} disabled={!canRedo} className="size-8">
            <Redo2 className="size-3.5" />
          </IconButton>
          <IconButton
            label="Command palette (⌘K)"
            onClick={() => openDialog("palette")}
            className="size-8"
          >
            <Command className="size-3.5" />
          </IconButton>
          <IconButton label="Hide panel" onClick={() => setPanelOpen(false)} className="size-8">
            <PanelLeftClose className="size-3.5" />
          </IconButton>
        </div>
      </header>

      <TripSwitcher />
      <RouteStats />
      <MarkerList />

      <footer className="border-t border-white/5 p-2">
        <div className="flex gap-1.5">
          <Button
            variant={addMode ? "primary" : "outline"}
            size="sm"
            className="flex-1"
            onClick={toggleAddMode}
            aria-pressed={addMode}
          >
            <MapPinPlus className="size-3.5" />
            {addMode ? "Click the map" : "Add stop"}
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={optimize}>
            <Wand2 className="size-3.5" />
            Optimise
          </Button>
          <Button variant="primary" size="sm" onClick={() => void share()}>
            <Share2 className="size-3.5" />
            Share
          </Button>
        </div>

        <div className="mt-1.5 flex items-center gap-0.5">
          <IconButton label="Reverse the order" onClick={reverse} className="size-8">
            <ArrowUpDown className="size-3.5" />
          </IconButton>
          <IconButton label="Import GeoJSON or GPX" onClick={openImportPicker} className="size-8">
            <Upload className="size-3.5" />
          </IconButton>
          <IconButton label="Export GeoJSON" onClick={() => exportAs("geojson")} className="size-8">
            <Download className="size-3.5" />
          </IconButton>
          <button
            onClick={() => exportAs("gpx")}
            title="Export GPX"
            className="text-faint hover:text-ink h-8 rounded-lg px-2 font-mono text-[10px] transition-colors hover:bg-white/5"
          >
            GPX
          </button>

          <span className="text-faint/70 ml-auto pr-1 font-mono text-[10px]">
            {stopCount} saved locally
          </span>

          <IconButton
            label="Remove every stop"
            onClick={clearAll}
            disabled={stopCount === 0}
            className="hover:text-danger size-8"
          >
            <Trash2 className="size-3.5" />
          </IconButton>
        </div>
      </footer>
    </aside>
  );
}
