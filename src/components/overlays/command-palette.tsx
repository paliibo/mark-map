"use client";

import clsx from "clsx";
import {
  ArrowUpDown,
  Copy,
  Download,
  Frame,
  Keyboard,
  Layers,
  MapPinPlus,
  PanelLeft,
  Plus,
  Redo2,
  Search,
  Share2,
  Trash2,
  Undo2,
  Upload,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { useMapActions } from "@/components/map/use-map-actions";
import { useTripActions } from "@/components/map/use-trip-actions";
import { Dialog } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { MAP_STYLES } from "@/lib/map-styles";
import { activeTripOf, useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

interface Command {
  id: string;
  label: string;
  hint?: string;
  group: string;
  Icon: LucideIcon;
  keys?: string[];
  run: () => void;
}

/**
 * Subsequence match — typing `opt` finds "Optimise route" and `exg` finds
 * "Export GeoJSON", which is how every palette users already know behaves.
 */
function matches(haystack: string, needle: string): boolean {
  if (needle.length === 0) return true;
  const text = haystack.toLowerCase();
  let cursor = 0;
  for (const char of needle.toLowerCase()) {
    cursor = text.indexOf(char, cursor);
    if (cursor === -1) return false;
    cursor += 1;
  }
  return true;
}

export function CommandPalette() {
  const open = useUiStore((state) => state.dialog === "palette");
  const closeDialog = useUiStore((state) => state.closeDialog);
  const openDialog = useUiStore((state) => state.openDialog);
  const setMapStyle = useUiStore((state) => state.setMapStyle);
  const togglePanel = useUiStore((state) => state.togglePanel);
  const setAddMode = useUiStore((state) => state.setAddMode);

  const undo = useTripsStore((state) => state.undo);
  const redo = useTripsStore((state) => state.redo);
  const createTrip = useTripsStore((state) => state.createTrip);
  const duplicateTrip = useTripsStore((state) => state.duplicateTrip);

  const { fitTo } = useMapActions();
  const { addAtCenter, optimize, reverse, clearAll, exportAs, openImportPicker, share } =
    useTripActions();

  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const commands = useMemo<Command[]>(() => {
    const run = (action: () => void) => () => {
      closeDialog();
      action();
    };

    return [
      {
        id: "add-center",
        label: "Add a stop at the map centre",
        group: "Stops",
        Icon: Plus,
        keys: ["N"],
        run: run(addAtCenter),
      },
      {
        id: "add-click",
        label: "Drop a stop by clicking the map",
        group: "Stops",
        Icon: MapPinPlus,
        keys: ["A"],
        run: run(() => setAddMode(true)),
      },
      {
        id: "search",
        label: "Search for a place",
        group: "Stops",
        Icon: Search,
        keys: ["/"],
        run: run(() =>
          document.querySelector<HTMLInputElement>('input[aria-label="Search places"]')?.focus(),
        ),
      },
      {
        id: "optimise",
        label: "Optimise the route order",
        hint: "Nearest neighbour, then 2-opt",
        group: "Route",
        Icon: Wand2,
        keys: ["O"],
        run: run(optimize),
      },
      {
        id: "reverse",
        label: "Reverse the route",
        group: "Route",
        Icon: ArrowUpDown,
        run: run(reverse),
      },
      {
        id: "fit",
        label: "Frame the whole trip",
        group: "Route",
        Icon: Frame,
        keys: ["F"],
        run: run(() => fitTo(activeTripOf(useTripsStore.getState())?.markers ?? [])),
      },
      {
        id: "clear",
        label: "Remove every stop",
        group: "Route",
        Icon: Trash2,
        run: run(clearAll),
      },
      {
        id: "share",
        label: "Share this trip as a link",
        group: "Share",
        Icon: Share2,
        run: run(() => void share()),
      },
      {
        id: "export-geojson",
        label: "Export GeoJSON",
        group: "Share",
        Icon: Download,
        run: run(() => exportAs("geojson")),
      },
      {
        id: "export-gpx",
        label: "Export GPX",
        hint: "For watches and GPS units",
        group: "Share",
        Icon: Download,
        run: run(() => exportAs("gpx")),
      },
      {
        id: "import",
        label: "Import GeoJSON or GPX",
        group: "Share",
        Icon: Upload,
        run: run(openImportPicker),
      },
      {
        id: "new-trip",
        label: "Start a new trip",
        group: "Trips",
        Icon: Plus,
        run: run(() => createTrip()),
      },
      {
        id: "duplicate-trip",
        label: "Duplicate this trip",
        group: "Trips",
        Icon: Copy,
        run: run(() => duplicateTrip(useTripsStore.getState().activeTripId)),
      },
      ...MAP_STYLES.map<Command>((style) => ({
        id: `style-${style.id}`,
        label: `Basemap: ${style.label}`,
        group: "View",
        Icon: Layers,
        run: run(() => setMapStyle(style.id)),
      })),
      {
        id: "panel",
        label: "Toggle the side panel",
        group: "View",
        Icon: PanelLeft,
        keys: ["B"],
        run: run(togglePanel),
      },
      {
        id: "undo",
        label: "Undo",
        group: "History",
        Icon: Undo2,
        keys: ["⌘", "Z"],
        run: run(undo),
      },
      {
        id: "redo",
        label: "Redo",
        group: "History",
        Icon: Redo2,
        keys: ["⇧", "⌘", "Z"],
        run: run(redo),
      },
      {
        id: "shortcuts",
        label: "Keyboard shortcuts",
        group: "Help",
        Icon: Keyboard,
        keys: ["?"],
        run: run(() => openDialog("shortcuts")),
      },
    ];
  }, [
    addAtCenter,
    clearAll,
    closeDialog,
    createTrip,
    duplicateTrip,
    exportAs,
    fitTo,
    openDialog,
    openImportPicker,
    optimize,
    redo,
    reverse,
    setAddMode,
    setMapStyle,
    share,
    togglePanel,
    undo,
  ]);

  const filtered = useMemo(
    () => commands.filter((command) => matches(`${command.group} ${command.label}`, query.trim())),
    [commands, query],
  );

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (filtered.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => (index - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      filtered[Math.min(highlight, filtered.length - 1)]?.run();
    }
  };

  let lastGroup = "";

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      align="top"
      showClose={false}
      className="max-w-xl overflow-hidden"
    >
      <div className="flex h-12 items-center gap-2.5 border-b border-white/5 px-4">
        <Search className="text-faint size-4 shrink-0" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlight(0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Type a command…"
          aria-label="Command palette"
          className="text-ink placeholder:text-faint h-full flex-1 bg-transparent text-sm focus:outline-none"
        />
        <Kbd>Esc</Kbd>
      </div>

      <div className="max-h-[52vh] overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <p className="text-faint px-3 py-6 text-center text-xs">No command matches “{query}”</p>
        ) : (
          filtered.map((command, index) => {
            const showGroup = command.group !== lastGroup;
            lastGroup = command.group;

            return (
              <div key={command.id}>
                {showGroup && (
                  <p className="text-faint/70 px-2.5 pt-2.5 pb-1 text-[10px] font-medium tracking-wider uppercase">
                    {command.group}
                  </p>
                )}
                <button
                  onMouseEnter={() => setHighlight(index)}
                  onClick={command.run}
                  className={clsx(
                    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                    index === highlight ? "bg-accent/10 text-ink" : "text-muted hover:bg-white/5",
                  )}
                >
                  <command.Icon
                    className={clsx(
                      "size-4 shrink-0",
                      index === highlight ? "text-accent" : "text-faint",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{command.label}</span>
                    {command.hint && (
                      <span className="text-faint block truncate text-[11px]">{command.hint}</span>
                    )}
                  </span>
                  {command.keys && (
                    <span className="flex shrink-0 gap-1">
                      {command.keys.map((key) => (
                        <Kbd key={key}>{key}</Kbd>
                      ))}
                    </span>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>
    </Dialog>
  );
}
