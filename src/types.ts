/** Every domain type in Mark Map lives here. */

export type CategoryId =
  "place" | "food" | "stay" | "sight" | "nature" | "transit" | "shop" | "warning";

export type TravelMode = "walk" | "cycle" | "drive";

export interface LngLat {
  lng: number;
  lat: number;
}

export interface MapMarker extends LngLat {
  id: string;
  name: string;
  note: string;
  category: CategoryId;
}

export interface Trip {
  id: string;
  name: string;
  markers: MapMarker[];
  travelMode: TravelMode;
  /** Whether the route returns to its first stop. */
  roundTrip: boolean;
  createdAt: number;
  updatedAt: number;
}

/** One hop between two consecutive stops. */
export interface RouteLeg {
  from: MapMarker;
  to: MapMarker;
  /** Metres, great-circle. */
  distance: number;
  /** Degrees clockwise from true north. */
  bearing: number;
}

export interface RouteSummary {
  legs: RouteLeg[];
  /** Metres. */
  totalDistance: number;
  /** Seconds, from the trip's travel mode. */
  duration: number;
}
