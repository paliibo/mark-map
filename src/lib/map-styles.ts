import type { StyleSpecification } from "maplibre-gl";

export type MapStyleId = "light" | "dark" | "voyager" | "satellite";

export interface MapStyleDef {
  id: MapStyleId;
  label: string;
  /** Drives marker halos and control contrast. */
  theme: "light" | "dark";
  /** A style URL, or an inline spec for the raster basemaps. */
  style: string | StyleSpecification;
  attribution: string;
}

const CARTO_GLYPHS = "https://basemaps.cartocdn.com/gl/positron-gl-style/{fontstack}/{range}.pbf";

const OSM_CARTO = "&copy; OpenStreetMap contributors &copy; CARTO";

/** Esri's public World Imagery service — free to use with attribution. */
const SATELLITE_STYLE: StyleSpecification = {
  version: 8,
  glyphs: CARTO_GLYPHS,
  sources: {
    imagery: {
      type: "raster",
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
    },
    labels: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/rastertiles/dark_only_labels/{z}/{x}/{y}@2x.png"],
      tileSize: 256,
      maxzoom: 20,
      attribution: OSM_CARTO,
    },
  },
  layers: [
    { id: "imagery", type: "raster", source: "imagery" },
    { id: "labels", type: "raster", source: "labels", paint: { "raster-opacity": 0.85 } },
  ],
};

/**
 * Every basemap here is keyless and free — the whole point of the rebuild is
 * that `git clone && pnpm dev` gives you a working map with no signup.
 */
export const MAP_STYLES: readonly MapStyleDef[] = [
  {
    id: "dark",
    label: "Midnight",
    theme: "dark",
    style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    attribution: OSM_CARTO,
  },
  {
    id: "light",
    label: "Daylight",
    theme: "light",
    style: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    attribution: OSM_CARTO,
  },
  {
    id: "voyager",
    label: "Voyager",
    theme: "light",
    style: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
    attribution: OSM_CARTO,
  },
  {
    id: "satellite",
    label: "Satellite",
    theme: "dark",
    style: SATELLITE_STYLE,
    attribution: "Imagery &copy; Esri &middot; labels &copy; CARTO",
  },
] as const;

export const DEFAULT_MAP_STYLE: MapStyleId = "dark";

export function mapStyle(id: MapStyleId): MapStyleDef {
  return MAP_STYLES.find((style) => style.id === id) ?? MAP_STYLES[0]!;
}
