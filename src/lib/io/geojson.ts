import { CATEGORIES, DEFAULT_CATEGORY, categoryColor } from "@/lib/categories";
import type { SharedStop } from "@/lib/share";
import type { CategoryId, MapMarker } from "@/types";

/** Just enough of the GeoJSON spec for points and a route line. */
export interface PointFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: Record<string, unknown>;
}

export interface LineFeature {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: [number, number][] };
  properties: Record<string, unknown>;
}

export interface FeatureCollection {
  type: "FeatureCollection";
  features: (PointFeature | LineFeature)[];
}

export interface GeoJSONExportOptions {
  /** Append a LineString joining the stops in order. Default `true`. */
  includeRoute?: boolean;
  /** Close the route back to the first stop. */
  roundTrip?: boolean;
}

/** Stops as Point features, plus the route line, ready to hand to any GIS tool. */
export function markersToGeoJSON(
  markers: MapMarker[],
  options: GeoJSONExportOptions = {},
): FeatureCollection {
  const { includeRoute = true, roundTrip = false } = options;

  const features: (PointFeature | LineFeature)[] = markers.map((marker, index) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: [marker.lng, marker.lat] },
    properties: {
      name: marker.name,
      description: marker.note,
      category: marker.category,
      "marker-color": categoryColor(marker.category),
      order: index + 1,
    },
  }));

  if (includeRoute && markers.length > 1) {
    const coordinates: [number, number][] = markers.map((m) => [m.lng, m.lat]);
    if (roundTrip && markers.length > 2) {
      coordinates.push([markers[0]!.lng, markers[0]!.lat]);
    }
    features.push({
      type: "Feature",
      geometry: { type: "LineString", coordinates },
      properties: { name: "Route", stroke: "#38bdf8", "stroke-width": 3 },
    });
  }

  return { type: "FeatureCollection", features };
}

/** A route line for the map, or `null` when there is nothing to draw. */
export function routeLineFeature(markers: MapMarker[], roundTrip = false): LineFeature | null {
  if (markers.length < 2) return null;
  const coordinates: [number, number][] = markers.map((m) => [m.lng, m.lat]);
  if (roundTrip && markers.length > 2) {
    coordinates.push([markers[0]!.lng, markers[0]!.lat]);
  }
  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates },
    properties: {},
  };
}

const KNOWN_CATEGORIES = new Set<string>(CATEGORIES.map((c) => c.id));

function readCategory(properties: Record<string, unknown>): CategoryId {
  const raw = properties.category ?? properties.type;
  return typeof raw === "string" && KNOWN_CATEGORIES.has(raw)
    ? (raw as CategoryId)
    : DEFAULT_CATEGORY;
}

function readString(properties: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = properties[key];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return "";
}

function isFiniteCoordinate(lng: unknown, lat: unknown): lng is number {
  return (
    typeof lng === "number" &&
    typeof lat === "number" &&
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180
  );
}

/**
 * Pull stops out of any GeoJSON: a FeatureCollection, a lone Feature, a bare
 * geometry, or a MultiPoint. Non-point geometries are skipped rather than
 * rejected, so a file exported from another tool still imports cleanly.
 */
export function geoJSONToStops(input: string | unknown): SharedStop[] {
  const root: unknown = typeof input === "string" ? JSON.parse(input) : input;
  const stops: SharedStop[] = [];

  const visit = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const value = node as Record<string, unknown>;

    switch (value.type) {
      case "FeatureCollection": {
        const features = value.features;
        if (Array.isArray(features)) features.forEach(visit);
        return;
      }
      case "Feature": {
        const properties = (value.properties ?? {}) as Record<string, unknown>;
        collect(value.geometry, properties);
        return;
      }
      case "GeometryCollection": {
        const geometries = value.geometries;
        if (Array.isArray(geometries)) geometries.forEach((g) => collect(g, {}));
        return;
      }
      default:
        collect(value, {});
    }
  };

  const collect = (geometry: unknown, properties: Record<string, unknown>) => {
    if (!geometry || typeof geometry !== "object") return;
    const value = geometry as Record<string, unknown>;
    const positions: unknown[] =
      value.type === "Point"
        ? [value.coordinates]
        : value.type === "MultiPoint" && Array.isArray(value.coordinates)
          ? value.coordinates
          : [];

    for (const position of positions) {
      if (!Array.isArray(position)) continue;
      const [lng, lat] = position as [unknown, unknown];
      if (!isFiniteCoordinate(lng, lat)) continue;

      stops.push({
        lng,
        lat: lat as number,
        name: readString(properties, ["name", "title", "label"]) || `Stop ${stops.length + 1}`,
        note: readString(properties, ["description", "note", "desc", "comment"]),
        category: readCategory(properties),
      });
    }
  };

  visit(root);
  return stops;
}
