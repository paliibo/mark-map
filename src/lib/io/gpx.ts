import { DEFAULT_CATEGORY } from "@/lib/categories";
import type { SharedStop } from "@/lib/share";
import type { MapMarker } from "@/types";

/** XML text escaping — trip names routinely contain `&` and quotes. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const coord = (value: number) => value.toFixed(6);

export interface GpxExportOptions {
  tripName: string;
  /** Close the route back to its first stop. */
  roundTrip?: boolean;
}

/**
 * GPX 1.1 with both waypoints and a route, which is what watches, Garmin
 * devices, Organic Maps and Gaia all expect.
 */
export function markersToGpx(markers: MapMarker[], options: GpxExportOptions): string {
  const { tripName, roundTrip = false } = options;

  const waypoints = markers
    .map(
      (marker) =>
        `  <wpt lat="${coord(marker.lat)}" lon="${coord(marker.lng)}">\n` +
        `    <name>${escapeXml(marker.name)}</name>\n` +
        (marker.note ? `    <desc>${escapeXml(marker.note)}</desc>\n` : "") +
        `    <type>${escapeXml(marker.category)}</type>\n` +
        `  </wpt>`,
    )
    .join("\n");

  const routePoints = [...markers, ...(roundTrip && markers.length > 2 ? [markers[0]!] : [])]
    .map(
      (marker) =>
        `    <rtept lat="${coord(marker.lat)}" lon="${coord(marker.lng)}">` +
        `<name>${escapeXml(marker.name)}</name></rtept>`,
    )
    .join("\n");

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<gpx version="1.1" creator="Mark Map" xmlns="http://www.topografix.com/GPX/1/1">`,
    `  <metadata>`,
    `    <name>${escapeXml(tripName)}</name>`,
    `  </metadata>`,
    waypoints,
    markers.length > 1
      ? `  <rte>\n    <name>${escapeXml(tripName)}</name>\n${routePoints}\n  </rte>`
      : "",
    `</gpx>`,
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");
}

/**
 * Read waypoints from a GPX file, falling back to route or track points when a
 * file carries only a recorded line.
 */
export function gpxToStops(xml: string): SharedStop[] {
  const document = new DOMParser().parseFromString(xml, "application/xml");

  if (document.querySelector("parsererror")) {
    throw new Error("This file is not valid GPX");
  }

  const nodes = ["wpt", "rtept", "trkpt"]
    .map((tag) => Array.from(document.getElementsByTagName(tag)))
    .find((found) => found.length > 0);

  if (!nodes) return [];

  const text = (node: Element, tag: string) =>
    node.getElementsByTagName(tag)[0]?.textContent?.trim() ?? "";

  return nodes.flatMap((node, index) => {
    const lat = Number(node.getAttribute("lat"));
    const lng = Number(node.getAttribute("lon"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return [];

    return [
      {
        lat,
        lng,
        name: text(node, "name") || `Stop ${index + 1}`,
        note: text(node, "desc") || text(node, "cmt"),
        category: DEFAULT_CATEGORY,
      },
    ];
  });
}
