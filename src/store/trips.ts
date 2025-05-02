"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DEFAULT_CATEGORY } from "@/lib/categories";
import { createId } from "@/lib/id";
import { moveItem } from "@/lib/route";
import { createSeedTrip } from "@/lib/seed";
import { indexedDbStorage } from "@/lib/storage";
import type { SharedStop, SharedTrip } from "@/lib/share";
import type { MapMarker, TravelMode, Trip } from "@/types";

const STORAGE_KEY = "mark-map/trips";
const HISTORY_LIMIT = 60;

/** Everything undo/redo restores. */
interface Snapshot {
  trips: Trip[];
  activeTripId: string;
}

export interface TripsState extends Snapshot {
  selectedMarkerId: string | null;
  /** Persisted state has been read back from IndexedDB. */
  hydrated: boolean;
  past: Snapshot[];
  future: Snapshot[];

  // Trips
  createTrip: (name?: string) => string;
  deleteTrip: (id: string) => void;
  renameTrip: (id: string, name: string) => void;
  duplicateTrip: (id: string) => string | null;
  setActiveTrip: (id: string) => void;

  // Stops
  addMarker: (marker: Partial<MapMarker> & { lat: number; lng: number }) => string;
  updateMarker: (id: string, patch: Partial<Omit<MapMarker, "id">>) => void;
  /** Set a name from reverse geocoding without creating an undo step. */
  applyGeocodedName: (id: string, name: string) => void;
  removeMarker: (id: string) => void;
  reorderMarkers: (from: number, to: number) => void;
  setMarkers: (markers: MapMarker[]) => void;
  clearMarkers: () => void;
  selectMarker: (id: string | null) => void;

  // Trip settings
  setTravelMode: (mode: TravelMode) => void;
  setRoundTrip: (roundTrip: boolean) => void;

  // Bulk
  importStops: (stops: SharedStop[], mode: "append" | "replace") => number;
  adoptSharedTrip: (shared: SharedTrip) => string;

  // History
  undo: () => void;
  redo: () => void;
  setHydrated: (hydrated: boolean) => void;
}

const snapshot = (state: Snapshot): Snapshot => ({
  trips: state.trips,
  activeTripId: state.activeTripId,
});

/** Record the current state so the next change can be undone. */
const withHistory = (state: TripsState) => ({
  past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
  future: [] as Snapshot[],
});

export function activeTripOf(state: Pick<TripsState, "trips" | "activeTripId">): Trip | undefined {
  return state.trips.find((trip) => trip.id === state.activeTripId) ?? state.trips[0];
}

/** Replace the active trip with `mutate`'s result, stamping `updatedAt`. */
function mapActiveTrip(state: TripsState, mutate: (trip: Trip) => Trip): Trip[] {
  const active = activeTripOf(state);
  if (!active) return state.trips;
  return state.trips.map((trip) =>
    trip.id === active.id ? { ...mutate(trip), updatedAt: Date.now() } : trip,
  );
}

function stopToMarker(stop: SharedStop): MapMarker {
  return {
    id: createId(),
    name: stop.name,
    note: stop.note,
    lat: stop.lat,
    lng: stop.lng,
    category: stop.category ?? DEFAULT_CATEGORY,
  };
}

function emptyTrip(name: string): Trip {
  const now = Date.now();
  return {
    id: createId(),
    name,
    markers: [],
    travelMode: "walk",
    roundTrip: false,
    createdAt: now,
    updatedAt: now,
  };
}

const SEED_TRIP = createSeedTrip();

export const useTripsStore = create<TripsState>()(
  persist(
    (set, get) => ({
      trips: [SEED_TRIP],
      activeTripId: SEED_TRIP.id,
      selectedMarkerId: null,
      hydrated: false,
      past: [],
      future: [],

      createTrip: (name) => {
        const trip = emptyTrip(name?.trim() || `Trip ${get().trips.length + 1}`);
        set((state) => ({
          ...withHistory(state),
          trips: [...state.trips, trip],
          activeTripId: trip.id,
          selectedMarkerId: null,
        }));
        return trip.id;
      },

      deleteTrip: (id) =>
        set((state) => {
          const remaining = state.trips.filter((trip) => trip.id !== id);
          const trips = remaining.length > 0 ? remaining : [emptyTrip("New trip")];
          const activeTripId =
            state.activeTripId === id ? (trips[0]?.id ?? "") : state.activeTripId;

          return { ...withHistory(state), trips, activeTripId, selectedMarkerId: null };
        }),

      renameTrip: (id, name) =>
        set((state) => ({
          ...withHistory(state),
          trips: state.trips.map((trip) =>
            trip.id === id
              ? { ...trip, name: name.trim() || trip.name, updatedAt: Date.now() }
              : trip,
          ),
        })),

      duplicateTrip: (id) => {
        const source = get().trips.find((trip) => trip.id === id);
        if (!source) return null;

        const copy: Trip = {
          ...source,
          id: createId(),
          name: `${source.name} (copy)`,
          markers: source.markers.map((marker) => ({ ...marker, id: createId() })),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          ...withHistory(state),
          trips: [...state.trips, copy],
          activeTripId: copy.id,
        }));
        return copy.id;
      },

      setActiveTrip: (id) => set({ activeTripId: id, selectedMarkerId: null }),

      addMarker: (marker) => {
        const id = marker.id ?? createId();
        set((state) => {
          const trips = mapActiveTrip(state, (trip) => ({
            ...trip,
            markers: [
              ...trip.markers,
              {
                id,
                name: marker.name?.trim() || `Stop ${trip.markers.length + 1}`,
                note: marker.note ?? "",
                category: marker.category ?? DEFAULT_CATEGORY,
                lat: marker.lat,
                lng: marker.lng,
              },
            ],
          }));
          return { ...withHistory(state), trips, selectedMarkerId: id };
        });
        return id;
      },

      updateMarker: (id, patch) =>
        set((state) => ({
          ...withHistory(state),
          trips: mapActiveTrip(state, (trip) => ({
            ...trip,
            markers: trip.markers.map((marker) =>
              marker.id === id ? { ...marker, ...patch } : marker,
            ),
          })),
        })),

      applyGeocodedName: (id, name) =>
        set((state) => ({
          trips: mapActiveTrip(state, (trip) => ({
            ...trip,
            markers: trip.markers.map((marker) =>
              marker.id === id ? { ...marker, name } : marker,
            ),
          })),
        })),

      removeMarker: (id) =>
        set((state) => ({
          ...withHistory(state),
          trips: mapActiveTrip(state, (trip) => ({
            ...trip,
            markers: trip.markers.filter((marker) => marker.id !== id),
          })),
          selectedMarkerId: state.selectedMarkerId === id ? null : state.selectedMarkerId,
        })),

      reorderMarkers: (from, to) =>
        set((state) => ({
          ...withHistory(state),
          trips: mapActiveTrip(state, (trip) => ({
            ...trip,
            markers: moveItem(trip.markers, from, to),
          })),
        })),

      setMarkers: (markers) =>
        set((state) => ({
          ...withHistory(state),
          trips: mapActiveTrip(state, (trip) => ({ ...trip, markers })),
        })),

      clearMarkers: () =>
        set((state) => ({
          ...withHistory(state),
          trips: mapActiveTrip(state, (trip) => ({ ...trip, markers: [] })),
          selectedMarkerId: null,
        })),

      selectMarker: (id) => set({ selectedMarkerId: id }),

      setTravelMode: (travelMode) =>
        set((state) => ({
          ...withHistory(state),
          trips: mapActiveTrip(state, (trip) => ({ ...trip, travelMode })),
        })),

      setRoundTrip: (roundTrip) =>
        set((state) => ({
          ...withHistory(state),
          trips: mapActiveTrip(state, (trip) => ({ ...trip, roundTrip })),
        })),

      importStops: (stops, mode) => {
        const markers = stops.map(stopToMarker);
        set((state) => ({
          ...withHistory(state),
          trips: mapActiveTrip(state, (trip) => ({
            ...trip,
            markers: mode === "replace" ? markers : [...trip.markers, ...markers],
          })),
          selectedMarkerId: null,
        }));
        return markers.length;
      },

      adoptSharedTrip: (shared) => {
        const trip: Trip = {
          id: createId(),
          name: shared.name || "Shared trip",
          markers: shared.stops.map(stopToMarker),
          travelMode: shared.travelMode,
          roundTrip: shared.roundTrip,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        set((state) => ({
          ...withHistory(state),
          trips: [...state.trips, trip],
          activeTripId: trip.id,
          selectedMarkerId: null,
        }));
        return trip.id;
      },

      undo: () =>
        set((state) => {
          const previous = state.past[state.past.length - 1];
          if (!previous) return state;
          return {
            ...previous,
            past: state.past.slice(0, -1),
            future: [snapshot(state), ...state.future].slice(0, HISTORY_LIMIT),
            selectedMarkerId: null,
          };
        }),

      redo: () =>
        set((state) => {
          const [next, ...rest] = state.future;
          if (!next) return state;
          return {
            ...next,
            past: [...state.past, snapshot(state)].slice(-HISTORY_LIMIT),
            future: rest,
            selectedMarkerId: null,
          };
        }),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => indexedDbStorage),
      // History and selection are per-session, not per-device.
      partialize: (state) => ({ trips: state.trips, activeTripId: state.activeTripId }),
      // Static export prerenders this page, so hydration is triggered by hand
      // from the client once IndexedDB actually exists.
      skipHydration: true,
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // A trip may have been deleted on another tab; always land on a real one.
        if (!state.trips.some((trip) => trip.id === state.activeTripId)) {
          state.activeTripId = state.trips[0]?.id ?? "";
        }
        state.setHydrated(true);
      },
    },
  ),
);
