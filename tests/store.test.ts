import { beforeEach, describe, expect, it } from "vitest";

import { createSeedTrip } from "@/lib/seed";
import { activeTripOf, useTripsStore } from "@/store/trips";
import type { SharedTrip } from "@/lib/share";

const stops = () => activeTripOf(useTripsStore.getState())?.markers ?? [];

/** Start every test from one clean trip with no history. */
beforeEach(() => {
  const trip = { ...createSeedTrip(), markers: [] };
  useTripsStore.setState({
    trips: [trip],
    activeTripId: trip.id,
    selectedMarkerId: null,
    past: [],
    future: [],
  });
});

describe("stops", () => {
  it("adds a stop, selects it and fills in the defaults", () => {
    const id = useTripsStore.getState().addMarker({ lat: 1, lng: 2 });
    const [marker] = stops();

    expect(marker).toMatchObject({
      id,
      lat: 1,
      lng: 2,
      name: "Stop 1",
      note: "",
      category: "place",
    });
    expect(useTripsStore.getState().selectedMarkerId).toBe(id);
  });

  it("keeps the name, note and category it was given", () => {
    useTripsStore.getState().addMarker({
      lat: 1,
      lng: 2,
      name: "Opera",
      note: "Nice stairs",
      category: "sight",
    });
    expect(stops()[0]).toMatchObject({ name: "Opera", note: "Nice stairs", category: "sight" });
  });

  it("updates and removes by id", () => {
    const first = useTripsStore.getState().addMarker({ lat: 1, lng: 2 });
    const second = useTripsStore.getState().addMarker({ lat: 3, lng: 4 });

    useTripsStore.getState().updateMarker(first, { name: "Renamed", lat: 9 });
    expect(stops()[0]).toMatchObject({ name: "Renamed", lat: 9, lng: 2 });

    useTripsStore.getState().removeMarker(second);
    expect(stops()).toHaveLength(1);
    expect(useTripsStore.getState().selectedMarkerId).toBeNull();
  });

  it("reorders stops", () => {
    ["a", "b", "c"].forEach((name, i) =>
      useTripsStore.getState().addMarker({ lat: i, lng: i, name }),
    );
    useTripsStore.getState().reorderMarkers(0, 2);
    expect(stops().map((marker) => marker.name)).toEqual(["b", "c", "a"]);
  });

  it("renames from geocoding without adding an undo step", () => {
    const id = useTripsStore.getState().addMarker({ lat: 1, lng: 2 });
    const depth = useTripsStore.getState().past.length;

    useTripsStore.getState().applyGeocodedName(id, "Rynok Square");

    expect(stops()[0]?.name).toBe("Rynok Square");
    expect(useTripsStore.getState().past).toHaveLength(depth);
  });
});

describe("undo and redo", () => {
  it("steps back and forward through changes", () => {
    useTripsStore.getState().addMarker({ lat: 1, lng: 2, name: "one" });
    useTripsStore.getState().addMarker({ lat: 3, lng: 4, name: "two" });
    expect(stops()).toHaveLength(2);

    useTripsStore.getState().undo();
    expect(stops().map((m) => m.name)).toEqual(["one"]);

    useTripsStore.getState().undo();
    expect(stops()).toHaveLength(0);

    useTripsStore.getState().redo();
    useTripsStore.getState().redo();
    expect(stops().map((m) => m.name)).toEqual(["one", "two"]);
  });

  it("does nothing at either end of the history", () => {
    expect(() => useTripsStore.getState().undo()).not.toThrow();
    expect(() => useTripsStore.getState().redo()).not.toThrow();
    expect(stops()).toHaveLength(0);
  });

  it("drops the redo stack once a new change is made", () => {
    useTripsStore.getState().addMarker({ lat: 1, lng: 2 });
    useTripsStore.getState().undo();
    expect(useTripsStore.getState().future).toHaveLength(1);

    useTripsStore.getState().addMarker({ lat: 5, lng: 6 });
    expect(useTripsStore.getState().future).toHaveLength(0);
  });

  it("restores stops wiped by clearMarkers", () => {
    useTripsStore.getState().addMarker({ lat: 1, lng: 2 });
    useTripsStore.getState().addMarker({ lat: 3, lng: 4 });
    useTripsStore.getState().clearMarkers();
    expect(stops()).toHaveLength(0);

    useTripsStore.getState().undo();
    expect(stops()).toHaveLength(2);
  });
});

describe("trips", () => {
  it("creates, switches and duplicates", () => {
    useTripsStore.getState().addMarker({ lat: 1, lng: 2, name: "original" });
    const firstId = useTripsStore.getState().activeTripId;

    const secondId = useTripsStore.getState().createTrip("Second");
    expect(useTripsStore.getState().activeTripId).toBe(secondId);
    expect(stops()).toHaveLength(0);

    useTripsStore.getState().setActiveTrip(firstId);
    const copyId = useTripsStore.getState().duplicateTrip(firstId);

    expect(copyId).not.toBe(firstId);
    expect(activeTripOf(useTripsStore.getState())?.name).toMatch(/\(copy\)$/);
    expect(stops()[0]?.name).toBe("original");
    // A copy gets fresh stop ids so editing one does not touch the other.
    expect(stops()[0]?.id).not.toBe(
      useTripsStore.getState().trips.find((trip) => trip.id === firstId)?.markers[0]?.id,
    );
  });

  it("never leaves the app with zero trips", () => {
    const only = useTripsStore.getState().activeTripId;
    useTripsStore.getState().deleteTrip(only);

    const state = useTripsStore.getState();
    expect(state.trips).toHaveLength(1);
    expect(state.trips[0]?.id).toBe(state.activeTripId);
  });

  it("keeps trip settings apart", () => {
    useTripsStore.getState().setTravelMode("drive");
    useTripsStore.getState().setRoundTrip(true);
    const second = useTripsStore.getState().createTrip("Second");

    expect(activeTripOf(useTripsStore.getState())?.travelMode).toBe("walk");
    useTripsStore.getState().setActiveTrip(second);
    expect(activeTripOf(useTripsStore.getState())?.roundTrip).toBe(false);
  });
});

describe("bulk import", () => {
  const incoming = [
    { name: "One", note: "", lat: 1, lng: 2, category: "food" as const },
    { name: "Two", note: "", lat: 3, lng: 4, category: "place" as const },
  ];

  it("appends or replaces", () => {
    useTripsStore.getState().addMarker({ lat: 0, lng: 0, name: "existing" });

    expect(useTripsStore.getState().importStops(incoming, "append")).toBe(2);
    expect(stops()).toHaveLength(3);

    useTripsStore.getState().importStops(incoming, "replace");
    expect(stops().map((marker) => marker.name)).toEqual(["One", "Two"]);
  });

  it("adopts a shared trip as a new trip without touching the current one", () => {
    useTripsStore.getState().addMarker({ lat: 0, lng: 0, name: "mine" });
    const before = useTripsStore.getState().activeTripId;

    const shared: SharedTrip = {
      name: "From a friend",
      travelMode: "cycle",
      roundTrip: true,
      stops: incoming,
    };
    const newId = useTripsStore.getState().adoptSharedTrip(shared);

    expect(newId).not.toBe(before);
    expect(activeTripOf(useTripsStore.getState())).toMatchObject({
      name: "From a friend",
      travelMode: "cycle",
      roundTrip: true,
    });
    expect(stops()).toHaveLength(2);

    useTripsStore.getState().setActiveTrip(before);
    expect(stops().map((marker) => marker.name)).toEqual(["mine"]);
  });
});
