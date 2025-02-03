import { geoJSONToStops } from "@/lib/io/geojson";
import { gpxToStops } from "@/lib/io/gpx";
import type { SharedStop } from "@/lib/share";

export * from "@/lib/io/geojson";
export * from "@/lib/io/gpx";

export type ImportFormat = "geojson" | "gpx";

/** Pick a parser from the file name, falling back to sniffing the content. */
export function detectFormat(fileName: string, content: string): ImportFormat {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".gpx")) return "gpx";
  if (lower.endsWith(".json") || lower.endsWith(".geojson")) return "geojson";
  return content.trimStart().startsWith("<") ? "gpx" : "geojson";
}

/** Parse an imported file into stops, with a human-readable error on failure. */
export function parseImport(fileName: string, content: string): SharedStop[] {
  const format = detectFormat(fileName, content);

  try {
    const stops = format === "gpx" ? gpxToStops(content) : geoJSONToStops(content);
    if (stops.length === 0) {
      throw new Error(`No points found in this ${format === "gpx" ? "GPX" : "GeoJSON"} file`);
    }
    return stops;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : `Could not read ${fileName} as ${format}`,
    );
  }
}

/** Trigger a client-side download. No server, no upload. */
export function downloadFile(fileName: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Give the browser a tick to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** `Weekend in Lviv` -> `weekend-in-lviv` */
export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "mark-map"
  );
}
