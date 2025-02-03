// @vitest-environment jsdom
import { describe, expect, it } from "vitest";

import { gpxToStops, markersToGpx } from "@/lib/io/gpx";
import type { MapMarker } from "@/types";

const MARKERS: MapMarker[] = [
  {
    id: "1",
    name: "Rynok & Co",
    note: 'He said "start here"',
    category: "sight",
    lat: 49.8419,
    lng: 24.0315,
  },
  { id: "2", name: "Castle", note: "", category: "nature", lat: 49.85, lng: 24.0397 },
];

describe("markersToGpx", () => {
  it("emits GPX 1.1 with waypoints and a route", () => {
    const xml = markersToGpx(MARKERS, { tripName: "Lviv" });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<gpx version="1.1" creator="Mark Map"');
    expect(xml.match(/<wpt /g)).toHaveLength(2);
    expect(xml.match(/<rtept /g)).toHaveLength(2);
    expect(xml).toContain('lat="49.841900" lon="24.031500"');
  });

  it("escapes XML metacharacters in names and notes", () => {
    const xml = markersToGpx(MARKERS, { tripName: "A & B" });
    expect(xml).toContain("Rynok &amp; Co");
    expect(xml).toContain("&quot;start here&quot;");
    expect(xml).not.toMatch(/<name>[^<]*&(?!amp;|quot;|apos;|lt;|gt;)/);
  });

  it("omits the route for a single stop and closes the loop when asked", () => {
    expect(markersToGpx([MARKERS[0]!], { tripName: "Solo" })).not.toContain("<rte>");

    const three = [...MARKERS, { ...MARKERS[0]!, id: "3", name: "Third" }];
    const loop = markersToGpx(three, { tripName: "Loop", roundTrip: true });
    expect(loop.match(/<rtept /g)).toHaveLength(4);
  });
});

describe("gpxToStops", () => {
  it("round-trips its own export", () => {
    const stops = gpxToStops(markersToGpx(MARKERS, { tripName: "Lviv" }));

    expect(stops).toHaveLength(2);
    expect(stops[0]?.name).toBe("Rynok & Co");
    expect(stops[0]?.note).toBe('He said "start here"');
    expect(stops[0]?.lat).toBeCloseTo(49.8419, 5);
  });

  it("falls back to route points, then track points", () => {
    const route = `<?xml version="1.0"?><gpx version="1.1"><rte>
      <rtept lat="1" lon="2"><name>One</name></rtept>
      <rtept lat="3" lon="4"></rtept>
    </rte></gpx>`;
    const routeStops = gpxToStops(route);
    expect(routeStops).toHaveLength(2);
    expect(routeStops[1]?.name).toBe("Stop 2");

    const track = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg>
      <trkpt lat="5" lon="6"/>
    </trkseg></trk></gpx>`;
    expect(gpxToStops(track)).toHaveLength(1);
  });

  it("drops points with unusable coordinates", () => {
    const xml = `<?xml version="1.0"?><gpx version="1.1">
      <wpt lat="nope" lon="2"><name>Bad</name></wpt>
      <wpt lat="7" lon="8"><name>Good</name></wpt>
    </gpx>`;
    expect(gpxToStops(xml)).toMatchObject([{ name: "Good", lat: 7, lng: 8 }]);
  });

  it("returns nothing for a GPX with no points, and throws on broken XML", () => {
    expect(gpxToStops('<?xml version="1.0"?><gpx version="1.1"></gpx>')).toEqual([]);
    expect(() => gpxToStops("<gpx><unclosed>")).toThrow(/not valid GPX/);
  });
});
