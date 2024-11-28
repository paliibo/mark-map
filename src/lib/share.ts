import { base64UrlToBytes, bytesToBase64Url } from "@/lib/base64url";
import { ByteReader, ByteWriter } from "@/lib/bytes";
import { categoryAt, categoryIndex } from "@/lib/categories";
import type { CategoryId, MapMarker, TravelMode } from "@/types";

/**
 * Mark Map has no backend, so a shared trip has to travel inside the link
 * itself. JSON in base64 blows past URL length limits after a dozen stops, so
 * trips are packed into a compact binary frame first:
 *
 *   u8      format version
 *   u8      flags — bit 0 round trip, bits 1-2 travel mode
 *   string  trip name
 *   varint  stop count
 *   per stop:
 *     svarint  latitude delta, fixed point 1e-5 (~1 m)
 *     svarint  longitude delta
 *     u8       category
 *     string   name
 *     string   note
 *
 * Consecutive stops are usually close together, so delta coding keeps each
 * coordinate to two or three bytes instead of nine. A ten-stop city trip lands
 * around 200 characters.
 */

const FORMAT_VERSION = 1;
const COORD_SCALE = 1e5;
const TRAVEL_MODES: readonly TravelMode[] = ["walk", "cycle", "drive"];
const MAX_STOPS = 2000;

export interface SharedStop {
  name: string;
  note: string;
  lat: number;
  lng: number;
  category: CategoryId;
}

export interface SharedTrip {
  name: string;
  travelMode: TravelMode;
  roundTrip: boolean;
  stops: SharedStop[];
}

export interface EncodableTrip {
  name: string;
  travelMode: TravelMode;
  roundTrip: boolean;
  markers: Pick<MapMarker, "name" | "note" | "lat" | "lng" | "category">[];
}

/** Pack a trip into a URL-safe payload. */
export function encodeTrip(trip: EncodableTrip): string {
  const modeIndex = Math.max(0, TRAVEL_MODES.indexOf(trip.travelMode));
  const flags = (trip.roundTrip ? 1 : 0) | (modeIndex << 1);

  const writer = new ByteWriter()
    .u8(FORMAT_VERSION)
    .u8(flags)
    .string(trip.name)
    .varint(trip.markers.length);

  let previousLat = 0;
  let previousLng = 0;

  for (const marker of trip.markers) {
    const lat = Math.round(marker.lat * COORD_SCALE);
    const lng = Math.round(marker.lng * COORD_SCALE);

    writer
      .svarint(lat - previousLat)
      .svarint(lng - previousLng)
      .u8(categoryIndex(marker.category))
      .string(marker.name)
      .string(marker.note);

    previousLat = lat;
    previousLng = lng;
  }

  return bytesToBase64Url(writer.finish());
}

/** Unpack a payload produced by {@link encodeTrip}. Throws if it is not one. */
export function decodeTrip(payload: string): SharedTrip {
  const reader = new ByteReader(base64UrlToBytes(payload));

  const version = reader.u8();
  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported share format (v${version})`);
  }

  const flags = reader.u8();
  const roundTrip = (flags & 1) === 1;
  const travelMode = TRAVEL_MODES[(flags >> 1) & 0b11] ?? "walk";
  const name = reader.string();
  const count = reader.varint();

  if (count > MAX_STOPS) {
    throw new Error(`Shared trip is too large (${count} stops)`);
  }

  const stops: SharedStop[] = [];
  let lat = 0;
  let lng = 0;

  for (let i = 0; i < count; i++) {
    lat += reader.svarint();
    lng += reader.svarint();
    const category = categoryAt(reader.u8());
    stops.push({
      lat: lat / COORD_SCALE,
      lng: lng / COORD_SCALE,
      category,
      name: reader.string(),
      note: reader.string(),
    });
  }

  return { name, travelMode, roundTrip, stops };
}

/** The URL fragment key a shared trip rides in. */
export const SHARE_HASH_KEY = "trip";

/** Build a full share link. The payload sits in the fragment, so it is never sent to a server. */
export function buildShareUrl(baseUrl: string, trip: EncodableTrip): string {
  const [withoutHash] = baseUrl.split("#");
  return `${withoutHash}#${SHARE_HASH_KEY}=${encodeTrip(trip)}`;
}

/** Pull the payload out of a `location.hash`, or `null` when there is none. */
export function readSharePayload(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const payload = params.get(SHARE_HASH_KEY);
  return payload && payload.length > 0 ? payload : null;
}
