import { describe, expect, it } from "vitest";

import {
  boundsOf,
  centroid,
  clampLat,
  compassPoint,
  estimateDuration,
  formatDistance,
  formatDuration,
  formatLngLat,
  haversine,
  bearing,
  pathDistance,
  wrapLng,
} from "@/lib/geo";

const LVIV = { lng: 24.0315, lat: 49.8419 };
const KYIV = { lng: 30.5234, lat: 50.4501 };

describe("haversine", () => {
  it("is zero for a point against itself", () => {
    expect(haversine(LVIV, LVIV)).toBe(0);
  });

  it("matches the known Lviv–Kyiv great-circle distance", () => {
    // Published figure is roughly 468 km.
    expect(haversine(LVIV, KYIV)).toBeGreaterThan(460_000);
    expect(haversine(LVIV, KYIV)).toBeLessThan(475_000);
  });

  it("puts one degree of longitude at the equator at ~111.19 km", () => {
    expect(haversine({ lng: 0, lat: 0 }, { lng: 1, lat: 0 })).toBeCloseTo(111_194.9, 0);
  });

  it("is symmetric", () => {
    expect(haversine(LVIV, KYIV)).toBeCloseTo(haversine(KYIV, LVIV), 6);
  });

  it("handles antipodal points without NaN from floating point drift", () => {
    const distance = haversine({ lng: 0, lat: 90 }, { lng: 0, lat: -90 });
    expect(Number.isFinite(distance)).toBe(true);
    expect(distance).toBeCloseTo(20_015_114, -2);
  });
});

describe("bearing", () => {
  it("reads 0° due north and 90° due east", () => {
    expect(bearing({ lng: 0, lat: 0 }, { lng: 0, lat: 1 })).toBeCloseTo(0, 5);
    expect(bearing({ lng: 0, lat: 0 }, { lng: 1, lat: 0 })).toBeCloseTo(90, 5);
  });

  it("always returns a value in [0, 360)", () => {
    const south = bearing({ lng: 0, lat: 1 }, { lng: 0, lat: 0 });
    expect(south).toBeGreaterThanOrEqual(0);
    expect(south).toBeLessThan(360);
    expect(south).toBeCloseTo(180, 5);
  });
});

describe("compassPoint", () => {
  it("maps degrees onto the eight-point compass", () => {
    expect(compassPoint(0)).toBe("N");
    expect(compassPoint(44)).toBe("NE");
    expect(compassPoint(180)).toBe("S");
    expect(compassPoint(359)).toBe("N");
  });

  it("normalises out-of-range and negative bearings", () => {
    expect(compassPoint(-90)).toBe("W");
    expect(compassPoint(450)).toBe("E");
  });
});

describe("pathDistance", () => {
  it("is zero for zero or one point", () => {
    expect(pathDistance([])).toBe(0);
    expect(pathDistance([LVIV])).toBe(0);
  });

  it("sums each leg", () => {
    const middle = { lng: 27, lat: 50 };
    expect(pathDistance([LVIV, middle, KYIV])).toBeCloseTo(
      haversine(LVIV, middle) + haversine(middle, KYIV),
      6,
    );
  });
});

describe("boundsOf and centroid", () => {
  it("returns null when there is nothing to bound", () => {
    expect(boundsOf([])).toBeNull();
    expect(centroid([])).toBeNull();
  });

  it("wraps every point", () => {
    expect(boundsOf([LVIV, KYIV])).toEqual([24.0315, 49.8419, 30.5234, 50.4501]);
  });

  it("averages coordinates", () => {
    expect(
      centroid([
        { lng: 0, lat: 0 },
        { lng: 2, lat: 4 },
      ]),
    ).toEqual({ lng: 1, lat: 2 });
  });
});

describe("formatting", () => {
  it("switches from metres to kilometres at 1 km", () => {
    expect(formatDistance(0)).toBe("0 m");
    expect(formatDistance(820)).toBe("820 m");
    expect(formatDistance(999)).toBe("999 m");
    expect(formatDistance(1000)).toBe("1.0 km");
    expect(formatDistance(4712)).toBe("4.7 km");
    expect(formatDistance(1_204_000)).toBe("1,204 km");
  });

  it("renders durations as hours and minutes", () => {
    expect(formatDuration(20)).toBe("< 1 min");
    expect(formatDuration(45 * 60)).toBe("45 min");
    expect(formatDuration(2 * 3600 + 5 * 60)).toBe("2 h 05 min");
  });

  it("returns an em dash for values that are not numbers", () => {
    expect(formatDistance(Number.NaN)).toBe("—");
    expect(formatDuration(-1)).toBe("—");
  });

  it("prints coordinates lat-first at four decimals", () => {
    expect(formatLngLat(LVIV)).toBe("49.8419, 24.0315");
  });
});

describe("estimateDuration", () => {
  it("scales with the travel mode", () => {
    const walk = estimateDuration(10_000, "walk");
    const cycle = estimateDuration(10_000, "cycle");
    const drive = estimateDuration(10_000, "drive");

    expect(walk).toBeGreaterThan(cycle);
    expect(cycle).toBeGreaterThan(drive);
    // 10 km on foot at 4.8 km/h is a bit over two hours.
    expect(walk).toBeCloseTo(7500, -2);
  });
});

describe("coordinate guards", () => {
  it("clamps latitude to the Web Mercator limit", () => {
    expect(clampLat(90)).toBeCloseTo(85.05112878, 6);
    expect(clampLat(-90)).toBeCloseTo(-85.05112878, 6);
    expect(clampLat(12)).toBe(12);
  });

  it("wraps longitude into [-180, 180)", () => {
    expect(wrapLng(190)).toBeCloseTo(-170, 9);
    expect(wrapLng(-190)).toBeCloseTo(170, 9);
    expect(wrapLng(24)).toBeCloseTo(24, 9);
  });
});
