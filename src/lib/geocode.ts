import type { LngLat } from "@/types";

/**
 * Place search and reverse lookup through Nominatim, OpenStreetMap's free
 * geocoder. No key required; in exchange the usage policy asks for at most one
 * request a second, which the debounced search box and abort-on-retype honour.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";

export interface GeocodeResult {
  id: string;
  /** Short display name, e.g. `Rynok Square`. */
  name: string;
  /** Full address line. */
  label: string;
  lat: number;
  lng: number;
  /** OSM's own classification, used only as a hint. */
  kind: string;
}

interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  name?: string;
  display_name: string;
  type?: string;
  category?: string;
  addresstype?: string;
}

function toResult(place: NominatimPlace): GeocodeResult | null {
  const lat = Number(place.lat);
  const lng = Number(place.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const [head] = place.display_name.split(",");

  return {
    id: String(place.place_id),
    name: place.name?.trim() || head?.trim() || place.display_name,
    label: place.display_name,
    lat,
    lng,
    kind: place.type ?? place.category ?? place.addresstype ?? "place",
  };
}

export interface SearchOptions {
  signal?: AbortSignal;
  limit?: number;
  /** Bias results towards what the user is currently looking at. */
  viewbox?: [west: number, south: number, east: number, north: number];
}

/** Search places by free text. Returns `[]` rather than throwing on abort. */
export async function searchPlaces(
  query: string,
  { signal, limit = 6, viewbox }: SearchOptions = {},
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "jsonv2",
    limit: String(limit),
    "accept-language": "en",
  });

  if (viewbox) {
    params.set("viewbox", viewbox.join(","));
    params.set("bounded", "0");
  }

  const response = await fetch(`${NOMINATIM}/search?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Place search failed (${response.status})`);
  }

  const places = (await response.json()) as NominatimPlace[];
  return places.map(toResult).filter((result): result is GeocodeResult => result !== null);
}

/** Best-effort name for a coordinate. Resolves to `null` if the lookup fails. */
export async function reverseGeocode(
  { lat, lng }: LngLat,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lng),
    format: "jsonv2",
    zoom: "17",
    "accept-language": "en",
  });

  try {
    const response = await fetch(`${NOMINATIM}/reverse?${params}`, { signal });
    if (!response.ok) return null;
    return toResult((await response.json()) as NominatimPlace);
  } catch {
    return null;
  }
}
