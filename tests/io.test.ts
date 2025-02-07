// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { detectFormat, parseImport, slugify } from "@/lib/io";

describe("detectFormat", () => {
  it("prefers the file extension", () => {
    expect(detectFormat("route.gpx", "{}")).toBe("gpx");
    expect(detectFormat("trip.geojson", "<gpx/>")).toBe("geojson");
    expect(detectFormat("trip.JSON", "")).toBe("geojson");
  });

  it("sniffs the content when the name says nothing", () => {
    expect(detectFormat("download", "  <gpx></gpx>")).toBe("gpx");
    expect(detectFormat("download", '{"type":"FeatureCollection"}')).toBe("geojson");
  });
});

describe("parseImport", () => {
  it("reads both formats", () => {
    expect(parseImport("a.geojson", '{"type":"Point","coordinates":[1,2]}')).toHaveLength(1);
    expect(
      parseImport("a.gpx", '<?xml version="1.0"?><gpx version="1.1"><wpt lat="1" lon="2"/></gpx>'),
    ).toHaveLength(1);
  });

  it("explains an empty file rather than silently importing nothing", () => {
    expect(() => parseImport("a.geojson", '{"type":"FeatureCollection","features":[]}')).toThrow(
      /No points found/,
    );
  });

  it("surfaces a readable error for malformed input", () => {
    expect(() => parseImport("a.geojson", "{oops")).toThrow();
    expect(() => parseImport("a.gpx", "<gpx><nope>")).toThrow(/not valid GPX/);
  });
});

describe("slugify", () => {
  it("makes a file-name-safe slug", () => {
    expect(slugify("Weekend in Lviv")).toBe("weekend-in-lviv");
    expect(slugify("  A & B / C  ")).toBe("a-b-c");
  });

  it("strips diacritics and falls back when nothing survives", () => {
    expect(slugify("Café Münster")).toBe("cafe-munster");
    expect(slugify("Львів")).toBe("mark-map");
    expect(slugify("")).toBe("mark-map");
  });

  it("caps the length", () => {
    expect(slugify("x".repeat(200)).length).toBeLessThanOrEqual(48);
  });
});
