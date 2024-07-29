import type { LngLat, TravelMode } from "@/types";

/** Mean Earth radius in metres (IUGG). */
export const EARTH_RADIUS_M = 6_371_008.8;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/**
 * Great-circle distance in metres between two points.
 *
 * Uses the haversine formula, which stays numerically stable for the short
 * distances a trip planner deals with (where the spherical law of cosines
 * loses precision).
 */
export function haversine(a: LngLat, b: LngLat): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);

  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Initial bearing from `a` to `b`, in degrees clockwise from true north. */
export function bearing(a: LngLat, b: LngLat): number {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

const COMPASS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** Nearest eight-point compass label for a bearing. */
export function compassPoint(deg: number): (typeof COMPASS)[number] {
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return COMPASS[index] ?? "N";
}

/** Total length in metres of the path through `points`, in order. */
export function pathDistance(points: LngLat[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversine(points[i - 1]!, points[i]!);
  }
  return total;
}

export type Bounds = [west: number, south: number, east: number, north: number];

/** Axis-aligned bounding box of `points`, or `null` when there are none. */
export function boundsOf(points: LngLat[]): Bounds | null {
  if (points.length === 0) return null;

  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;

  for (const p of points) {
    west = Math.min(west, p.lng);
    east = Math.max(east, p.lng);
    south = Math.min(south, p.lat);
    north = Math.max(north, p.lat);
  }

  return [west, south, east, north];
}

/** Arithmetic centre of `points`. Good enough away from the antimeridian. */
export function centroid(points: LngLat[]): LngLat | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, p) => ({ lng: acc.lng + p.lng, lat: acc.lat + p.lat }), {
    lng: 0,
    lat: 0,
  });
  return { lng: sum.lng / points.length, lat: sum.lat / points.length };
}

/** Average travel speed in metres per second, per mode. */
export const SPEED_MPS: Record<TravelMode, number> = {
  walk: 4.8 / 3.6,
  cycle: 16 / 3.6,
  drive: 65 / 3.6,
};

/** Straight-line travel time in seconds for `metres` at `mode`'s pace. */
export function estimateDuration(metres: number, mode: TravelMode): number {
  return metres / SPEED_MPS[mode];
}

/** `820 m` / `4.7 km` / `1,204 km` */
export function formatDistance(metres: number): string {
  if (!Number.isFinite(metres) || metres < 0) return "—";
  if (metres < 1000) return `${Math.round(metres)} m`;
  const km = metres / 1000;
  if (km < 10) return `${km.toFixed(1)} km`;
  return `${Math.round(km).toLocaleString("en-US")} km`;
}

/** `45 min` / `2 h 05 min` / `< 1 min` */
export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "—";
  const total = Math.round(seconds / 60);
  if (total < 1) return "< 1 min";
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, "0")} min`;
}

/** `49.8414, 24.0286` — six decimals is ~11 cm, more than a pin needs. */
export function formatLngLat({ lat, lng }: LngLat): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/** Clamp to the range Web Mercator can actually render. */
export function clampLat(lat: number): number {
  return Math.max(-85.05112878, Math.min(85.05112878, lat));
}

/** Wrap longitude into [-180, 180). */
export function wrapLng(lng: number): number {
  return ((((lng + 180) % 360) + 360) % 360) - 180;
}
