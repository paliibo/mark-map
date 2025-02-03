import { describe, expect, it } from "vitest";

import { geoJSONToStops, markersToGeoJSON, routeLineFeature } from "@/lib/io/geojson";
import type { MapMarker } from "@/types";

const MARKERS: MapMarker[] = [
  { id: "1", name: "Rynok", note: "Start", category: "sight", lat: 49.8419, lng: 24.0315 },
  { id: "2", name: "Castle", note: "", category: "nature", lat: 49.85, lng: 24.0397 },
];

describe("markersToGeoJSON", () => {
  it("writes a Point per stop plus a route line", () => {
    const collection = markersToGeoJSON(MARKERS);

    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features).toHaveLength(3);
    expect(collection.features[0]?.geometry.type).toBe("Point");
    expect(collection.features[2]?.geometry.type).toBe("LineString");
  });

  it("uses lng,lat order as the spec requires", () => {
    const [first] = markersToGeoJSON(MARKERS, { includeRoute: false }).features;
    expect(first?.geometry.coordinates).toEqual([24.0315, 49.8419]);
  });

  it("carries names, notes and a simplestyle colour", () => {
    const [first] = markersToGeoJSON(MARKERS).features;
    expect(first?.properties.name).toBe("Rynok");
    expect(first?.properties.description).toBe("Start");
    expect(first?.properties["marker-color"]).toMatch(/^#[0-9a-f]{6}$/i);
    expect(first?.properties.order).toBe(1);
  });

  it("omits the line when asked, or when there is nothing to join", () => {
    expect(markersToGeoJSON(MARKERS, { includeRoute: false }).features).toHaveLength(2);
    expect(markersToGeoJSON([MARKERS[0]!]).features).toHaveLength(1);
    expect(markersToGeoJSON([]).features).toHaveLength(0);
  });

  it("closes the loop for a round trip of three or more stops", () => {
    const three = [...MARKERS, { ...MARKERS[0]!, id: "3", lat: 49.83, lng: 24.05 }];
    const line = markersToGeoJSON(three, { roundTrip: true }).features.at(-1);
    expect(line?.geometry.coordinates).toHaveLength(4);
    expect(line?.geometry.coordinates.at(-1)).toEqual([24.0315, 49.8419]);
  });
});

describe("routeLineFeature", () => {
  it("needs at least two stops", () => {
    expect(routeLineFeature([])).toBeNull();
    expect(routeLineFeature([MARKERS[0]!])).toBeNull();
    expect(routeLineFeature(MARKERS)?.geometry.coordinates).toHaveLength(2);
  });
});

describe("geoJSONToStops", () => {
  it("round-trips what markersToGeoJSON produced", () => {
    const stops = geoJSONToStops(JSON.stringify(markersToGeoJSON(MARKERS)));

    expect(stops).toHaveLength(2);
    expect(stops[0]).toMatchObject({
      name: "Rynok",
      note: "Start",
      category: "sight",
      lat: 49.8419,
      lng: 24.0315,
    });
  });

  it("reads a bare Feature, a bare geometry and a MultiPoint", () => {
    expect(
      geoJSONToStops({
        type: "Feature",
        geometry: { type: "Point", coordinates: [1, 2] },
        properties: { title: "Solo" },
      }),
    ).toMatchObject([{ lng: 1, lat: 2, name: "Solo" }]);

    expect(geoJSONToStops({ type: "Point", coordinates: [3, 4] })).toHaveLength(1);

    expect(
      geoJSONToStops({
        type: "MultiPoint",
        coordinates: [
          [1, 2],
          [3, 4],
        ],
      }),
    ).toHaveLength(2);
  });

  it("skips geometries it cannot place instead of failing the import", () => {
    const stops = geoJSONToStops({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          },
          properties: {},
        },
        { type: "Feature", geometry: { type: "Point", coordinates: [5, 6] }, properties: {} },
        { type: "Feature", geometry: null, properties: {} },
        { type: "Feature", geometry: { type: "Point", coordinates: ["x", 2] }, properties: {} },
        { type: "Feature", geometry: { type: "Point", coordinates: [200, 100] }, properties: {} },
      ],
    });

    expect(stops).toHaveLength(1);
    expect(stops[0]).toMatchObject({ lng: 5, lat: 6 });
  });

  it("falls back to a numbered name and the default category", () => {
    const [stop] = geoJSONToStops({ type: "Point", coordinates: [0, 0] });
    expect(stop?.name).toBe("Stop 1");
    expect(stop?.category).toBe("place");
  });

  it("ignores categories it does not recognise", () => {
    const [stop] = geoJSONToStops({
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { category: "definitely-not-a-category" },
    });
    expect(stop?.category).toBe("place");
  });

  it("throws on input that is not JSON at all", () => {
    expect(() => geoJSONToStops("not json")).toThrow();
  });
});
