import { describe, expect, it } from "vitest";

import { haversine, pathDistance } from "@/lib/geo";
import { applyOrder, buildRoute, moveItem, optimizeRoute, tourLength } from "@/lib/route";
import type { MapMarker } from "@/types";

const stop = (name: string, lat: number, lng: number): MapMarker => ({
  id: name,
  name,
  note: "",
  category: "place",
  lat,
  lng,
});

/** Four corners of a square, listed in an order that crosses itself. */
const CROSSED = [stop("a", 0, 0), stop("c", 1, 1), stop("b", 0, 1), stop("d", 1, 0)];

describe("buildRoute", () => {
  it("produces one leg fewer than there are stops", () => {
    const route = buildRoute(CROSSED, "walk");
    expect(route.legs).toHaveLength(3);
    expect(route.legs[0]?.from.name).toBe("a");
    expect(route.legs[0]?.to.name).toBe("c");
  });

  it("has no legs below two stops", () => {
    expect(buildRoute([], "walk").legs).toHaveLength(0);
    expect(buildRoute([stop("solo", 1, 1)], "walk").legs).toHaveLength(0);
    expect(buildRoute([], "walk").totalDistance).toBe(0);
  });

  it("closes the loop when the trip is a round trip", () => {
    const open = buildRoute(CROSSED, "walk", false);
    const loop = buildRoute(CROSSED, "walk", true);

    expect(loop.legs).toHaveLength(4);
    expect(loop.legs.at(-1)?.to.name).toBe("a");
    expect(loop.totalDistance).toBeGreaterThan(open.totalDistance);
  });

  it("does not close a two-stop route back on itself", () => {
    const pair = [stop("a", 0, 0), stop("b", 0, 1)];
    expect(buildRoute(pair, "walk", true).legs).toHaveLength(1);
  });

  it("totals the legs and derives a duration from the mode", () => {
    const route = buildRoute(CROSSED, "drive");
    expect(route.totalDistance).toBeCloseTo(pathDistance(CROSSED), 6);
    expect(route.duration).toBeCloseTo(route.totalDistance / (65 / 3.6), 6);
  });
});

describe("optimizeRoute", () => {
  it("untangles a route that crosses itself", () => {
    const result = optimizeRoute(CROSSED);

    expect(result.after).toBeLessThan(result.before);
    expect(result.saved).toBeGreaterThan(0);

    // The square's perimeter path is the optimum; the crossed order is longer.
    const optimised = applyOrder(CROSSED, result.order);
    expect(pathDistance(optimised)).toBeCloseTo(result.after, 3);
  });

  it("keeps the first stop pinned by default", () => {
    const result = optimizeRoute(CROSSED, { fixStart: true });
    expect(result.order[0]).toBe(0);
  });

  it("returns every index exactly once", () => {
    const points = Array.from({ length: 12 }, (_, i) =>
      stop(`s${i}`, Math.sin(i * 2.4) * 3, Math.cos(i * 1.7) * 3),
    );
    const result = optimizeRoute(points);
    expect([...result.order].sort((a, b) => a - b)).toEqual([...Array(12).keys()]);
  });

  it("leaves trivially small routes alone", () => {
    const tiny = CROSSED.slice(0, 3);
    const result = optimizeRoute(tiny);
    expect(result.order).toEqual([0, 1, 2]);
    expect(result.saved).toBe(0);
  });

  it("never returns an order longer than the one it was given", () => {
    const alreadyOptimal = [stop("a", 0, 0), stop("b", 0, 1), stop("c", 1, 1), stop("d", 1, 0)];
    const result = optimizeRoute(alreadyOptimal);
    expect(result.after).toBeLessThanOrEqual(result.before);
    expect(result.saved).toBeGreaterThanOrEqual(0);
  });

  it("optimises a closed loop too", () => {
    const points = [
      stop("a", 0, 0),
      stop("b", 2, 2),
      stop("c", 0, 2),
      stop("d", 2, 0),
      stop("e", 1, 3),
    ];
    const result = optimizeRoute(points, { roundTrip: true });
    const reordered = applyOrder(points, result.order);
    const loopLength = pathDistance(reordered) + haversine(reordered.at(-1)!, reordered[0]!);

    expect(loopLength).toBeCloseTo(result.after, 3);
    expect(result.after).toBeLessThanOrEqual(result.before);
  });

  it("can beat a fixed start when allowed to choose one", () => {
    const points = [
      stop("far", 0, 10),
      stop("a", 0, 0),
      stop("b", 0, 1),
      stop("c", 0, 2),
      stop("d", 0, 3),
    ];
    const pinned = optimizeRoute(points, { fixStart: true });
    const free = optimizeRoute(points, { fixStart: false });
    expect(free.after).toBeLessThanOrEqual(pinned.after);
  });
});

describe("tourLength", () => {
  it("adds the closing edge only for a round trip", () => {
    const matrix = [
      [0, 1, 2],
      [1, 0, 3],
      [2, 3, 0],
    ];
    expect(tourLength([0, 1, 2], matrix)).toBe(4);
    expect(tourLength([0, 1, 2], matrix, true)).toBe(6);
  });
});

describe("applyOrder and moveItem", () => {
  it("reorders by index", () => {
    expect(applyOrder(["a", "b", "c"], [2, 0, 1])).toEqual(["c", "a", "b"]);
  });

  it("moves an item without mutating the input", () => {
    const source = ["a", "b", "c", "d"];
    expect(moveItem(source, 0, 2)).toEqual(["b", "c", "a", "d"]);
    expect(moveItem(source, 3, 0)).toEqual(["d", "a", "b", "c"]);
    expect(source).toEqual(["a", "b", "c", "d"]);
  });

  it("ignores out-of-range and no-op moves", () => {
    const source = ["a", "b"];
    expect(moveItem(source, 1, 1)).toBe(source);
    expect(moveItem(source, -1, 0)).toBe(source);
    expect(moveItem(source, 0, 9)).toBe(source);
  });
});
