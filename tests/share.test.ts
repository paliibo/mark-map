import { describe, expect, it } from "vitest";

import { base64UrlToBytes, bytesToBase64Url } from "@/lib/base64url";
import { ByteReader, ByteWriter } from "@/lib/bytes";
import {
  SHARE_HASH_KEY,
  buildShareUrl,
  decodeTrip,
  encodeTrip,
  readSharePayload,
  type EncodableTrip,
} from "@/lib/share";

const TRIP: EncodableTrip = {
  name: "A day in Lviv",
  travelMode: "walk",
  roundTrip: true,
  markers: [
    { name: "Rynok Square", note: "Start here", lat: 49.8419, lng: 24.0315, category: "sight" },
    { name: "Coffee Manufacture", note: "", lat: 49.842, lng: 24.0333, category: "food" },
    { name: "High Castle", note: "Steep climb", lat: 49.85, lng: 24.0397, category: "nature" },
  ],
};

describe("base64url", () => {
  it("round-trips arbitrary bytes", () => {
    for (let length = 0; length < 40; length++) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 37 + length * 11) % 256);
      expect([...base64UrlToBytes(bytesToBase64Url(bytes))]).toEqual([...bytes]);
    }
  });

  it("emits only URL-safe characters", () => {
    const bytes = Uint8Array.from({ length: 256 }, (_, i) => i);
    expect(bytesToBase64Url(bytes)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("accepts padded input and rejects invalid characters", () => {
    expect([...base64UrlToBytes("AAAA==")]).toEqual([0, 0, 0]);
    expect(() => base64UrlToBytes("aa*bb")).toThrow(/Invalid base64url/);
  });
});

describe("varint framing", () => {
  it("round-trips unsigned and signed values", () => {
    const values = [0, 1, 127, 128, 300, 65_535, 1_000_000, 18_000_000];
    // Zero is excluded from the negative pass — `-0` and `0` are the same
    // number to the codec but not to a strict equality assertion.
    const negatives = values.filter((value) => value !== 0).map((value) => -value);

    const writer = new ByteWriter();
    values.forEach((value) => writer.varint(value));
    negatives.forEach((value) => writer.svarint(value));

    const reader = new ByteReader(writer.finish());
    values.forEach((value) => expect(reader.varint()).toBe(value));
    negatives.forEach((value) => expect(reader.svarint()).toBe(value));
  });

  it("keeps small signed values to a single byte", () => {
    expect(new ByteWriter().svarint(-3).finish()).toHaveLength(1);
    expect(new ByteWriter().svarint(63).finish()).toHaveLength(1);
  });

  it("round-trips unicode strings", () => {
    const writer = new ByteWriter().string("Львів ☕️").string("");
    const reader = new ByteReader(writer.finish());
    expect(reader.string()).toBe("Львів ☕️");
    expect(reader.string()).toBe("");
  });

  it("throws instead of reading past the end", () => {
    expect(() => new ByteReader(new Uint8Array()).u8()).toThrow(/Unexpected end/);
    expect(() => new ByteReader(Uint8Array.from([5, 65])).string()).toThrow(/runs past the end/);
  });
});

describe("trip codec", () => {
  it("round-trips a whole trip", () => {
    const decoded = decodeTrip(encodeTrip(TRIP));

    expect(decoded.name).toBe(TRIP.name);
    expect(decoded.travelMode).toBe("walk");
    expect(decoded.roundTrip).toBe(true);
    expect(decoded.stops).toHaveLength(3);
    expect(decoded.stops[0]?.name).toBe("Rynok Square");
    expect(decoded.stops[0]?.note).toBe("Start here");
    expect(decoded.stops[2]?.category).toBe("nature");
  });

  it("keeps coordinates within about a metre", () => {
    const decoded = decodeTrip(encodeTrip(TRIP));
    decoded.stops.forEach((stop, index) => {
      expect(stop.lat).toBeCloseTo(TRIP.markers[index]!.lat, 4);
      expect(stop.lng).toBeCloseTo(TRIP.markers[index]!.lng, 4);
    });
  });

  it("survives every travel mode and both loop settings", () => {
    for (const travelMode of ["walk", "cycle", "drive"] as const) {
      for (const roundTrip of [true, false]) {
        const decoded = decodeTrip(encodeTrip({ ...TRIP, travelMode, roundTrip }));
        expect(decoded.travelMode).toBe(travelMode);
        expect(decoded.roundTrip).toBe(roundTrip);
      }
    }
  });

  it("handles unicode names, empty trips and southern-hemisphere coordinates", () => {
    const awkward: EncodableTrip = {
      name: "Виїзд 🚲 & co",
      travelMode: "cycle",
      roundTrip: false,
      markers: [
        { name: "Ushuaia", note: "南", lat: -54.8019, lng: -68.3029, category: "stay" },
        { name: "", note: "", lat: 0, lng: 0, category: "place" },
      ],
    };

    const decoded = decodeTrip(encodeTrip(awkward));
    expect(decoded.name).toBe("Виїзд 🚲 & co");
    expect(decoded.stops[0]?.lat).toBeCloseTo(-54.8019, 4);
    expect(decoded.stops[0]?.lng).toBeCloseTo(-68.3029, 4);
    expect(decoded.stops[1]?.name).toBe("");

    expect(decodeTrip(encodeTrip({ ...awkward, markers: [] })).stops).toEqual([]);
  });

  it("stays compact — delta coding is the whole point", () => {
    const payload = encodeTrip(TRIP);
    const asJson = JSON.stringify(TRIP);

    expect(payload.length).toBeLessThan(asJson.length);
    // Ten nearby stops must still fit comfortably inside a shareable URL.
    const wide: EncodableTrip = {
      ...TRIP,
      markers: Array.from({ length: 10 }, (_, i) => ({
        name: `Stop ${i + 1}`,
        note: "",
        lat: 49.84 + i * 0.004,
        lng: 24.03 + i * 0.006,
        category: "place" as const,
      })),
    };
    expect(encodeTrip(wide).length).toBeLessThan(400);
  });

  it("rejects payloads it did not write", () => {
    expect(() => decodeTrip(bytesToBase64Url(Uint8Array.from([9, 0, 0, 0])))).toThrow(
      /Unsupported share format/,
    );
    expect(() => decodeTrip("!!!!")).toThrow();
  });
});

describe("share links", () => {
  it("puts the payload in the fragment and reads it back", () => {
    const url = buildShareUrl("https://example.com/map/", TRIP);
    expect(url.startsWith(`https://example.com/map/#${SHARE_HASH_KEY}=`)).toBe(true);

    const payload = readSharePayload(new URL(url).hash);
    expect(payload).not.toBeNull();
    expect(decodeTrip(payload!).stops).toHaveLength(3);
  });

  it("replaces an existing fragment rather than appending to it", () => {
    const url = buildShareUrl("https://example.com/map/#trip=stale", TRIP);
    expect(url.match(/#/g)).toHaveLength(1);
  });

  it("returns null when there is no payload", () => {
    expect(readSharePayload("")).toBeNull();
    expect(readSharePayload("#")).toBeNull();
    expect(readSharePayload("#other=1")).toBeNull();
  });
});
