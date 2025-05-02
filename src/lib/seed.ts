import { createId } from "@/lib/id";
import type { Trip } from "@/types";

/**
 * A first-run demo trip, so the map is never an empty grey rectangle. Lviv,
 * because that is where the original version of this project pointed its
 * default camera.
 */
export function createSeedTrip(): Trip {
  const now = Date.now();

  const stops: [string, string, number, number, Trip["markers"][number]["category"]][] = [
    ["Rynok Square", "The old town's heart — start here.", 49.8419, 24.0315, "sight"],
    ["Lviv Coffee Manufacture", "Coffee roasted in a fake mine shaft.", 49.842, 24.0333, "food"],
    ["Lviv Opera", "Worth it for the staircase alone.", 49.8443, 24.0263, "sight"],
    ["High Castle", "Steep climb, best view of the city.", 49.85, 24.0397, "nature"],
    ["Lychakiv Cemetery", "Quiet, overgrown, beautiful.", 49.8341, 24.0555, "sight"],
    ["Stryiskyi Park", "Wind down under the chestnut trees.", 49.8225, 24.0247, "nature"],
  ];

  return {
    id: createId(),
    name: "A day in Lviv",
    travelMode: "walk",
    roundTrip: false,
    createdAt: now,
    updatedAt: now,
    markers: stops.map(([name, note, lat, lng, category]) => ({
      id: createId(),
      name,
      note,
      lat,
      lng,
      category,
    })),
  };
}
