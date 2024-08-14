import { estimateDuration, haversine, bearing } from "@/lib/geo";
import type { LngLat, MapMarker, RouteLeg, RouteSummary, TravelMode } from "@/types";

/** Per-leg distances plus totals for the stops in their current order. */
export function buildRoute(
  markers: MapMarker[],
  mode: TravelMode,
  roundTrip = false,
): RouteSummary {
  const stops = roundTrip && markers.length > 2 ? [...markers, markers[0]!] : markers;
  const legs: RouteLeg[] = [];

  for (let i = 1; i < stops.length; i++) {
    const from = stops[i - 1]!;
    const to = stops[i]!;
    legs.push({
      from,
      to,
      distance: haversine(from, to),
      bearing: bearing(from, to),
    });
  }

  const totalDistance = legs.reduce((sum, leg) => sum + leg.distance, 0);

  return { legs, totalDistance, duration: estimateDuration(totalDistance, mode) };
}

/** Symmetric all-pairs distance matrix. */
function distanceMatrix(points: LngLat[]): number[][] {
  const n = points.length;
  const matrix: number[][] = Array.from({ length: n }, () => new Array<number>(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = haversine(points[i]!, points[j]!);
      matrix[i]![j] = d;
      matrix[j]![i] = d;
    }
  }
  return matrix;
}

/** Length of a tour, closing the loop when `roundTrip`. */
export function tourLength(order: number[], matrix: number[][], roundTrip = false): number {
  let sum = 0;
  for (let i = 1; i < order.length; i++) {
    sum += matrix[order[i - 1]!]![order[i]!]!;
  }
  if (roundTrip && order.length > 1) {
    sum += matrix[order[order.length - 1]!]![order[0]!]!;
  }
  return sum;
}

/** Greedy nearest-neighbour tour starting at `start`. */
function nearestNeighbour(matrix: number[][], start: number): number[] {
  const n = matrix.length;
  const visited = new Array<boolean>(n).fill(false);
  const order: number[] = [start];
  visited[start] = true;

  for (let step = 1; step < n; step++) {
    const current = order[order.length - 1]!;
    let best = -1;
    let bestDistance = Infinity;

    for (let candidate = 0; candidate < n; candidate++) {
      if (visited[candidate]) continue;
      const d = matrix[current]![candidate]!;
      if (d < bestDistance) {
        bestDistance = d;
        best = candidate;
      }
    }

    if (best === -1) break;
    visited[best] = true;
    order.push(best);
  }

  return order;
}

/**
 * 2-opt local search: repeatedly reverse the segment between two stops when
 * doing so uncrosses the path. Mutates and returns `order`.
 *
 * Position 0 is never moved — for an open route that is the start the user
 * chose, and for a loop every rotation is equivalent anyway.
 */
function twoOpt(order: number[], matrix: number[][], roundTrip: boolean, maxPasses: number) {
  const n = order.length;
  const EPSILON = 1e-9;

  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;

    for (let i = 1; i < n - 1; i++) {
      for (let k = i + 1; k < n; k++) {
        const a = order[i - 1]!;
        const b = order[i]!;
        const c = order[k]!;
        // The edge leaving the reversed segment: the next stop, the start of
        // the loop, or nothing at all when an open route ends here.
        const d = k + 1 < n ? order[k + 1]! : roundTrip ? order[0]! : null;

        const delta =
          d === null
            ? matrix[a]![c]! - matrix[a]![b]!
            : matrix[a]![c]! + matrix[b]![d]! - matrix[a]![b]! - matrix[c]![d]!;

        if (delta < -EPSILON) {
          for (let lo = i, hi = k; lo < hi; lo++, hi--) {
            [order[lo], order[hi]] = [order[hi]!, order[lo]!];
          }
          improved = true;
        }
      }
    }

    if (!improved) break;
  }

  return order;
}

export interface OptimizeOptions {
  /** Pin the current first stop as the start. Default `true`. */
  fixStart?: boolean;
  /** Close the route back to its first stop. Default `false`. */
  roundTrip?: boolean;
  /** Safety valve on the 2-opt sweep. Default `40`. */
  maxPasses?: number;
}

export interface OptimizeResult {
  /** Indices into the input array, in their improved visiting order. */
  order: number[];
  /** Route length before optimising, in metres. */
  before: number;
  /** Route length after optimising, in metres. */
  after: number;
  /** Fraction of the original length saved, `0`–`1`. */
  saved: number;
}

/**
 * Order stops into a short route.
 *
 * Exact TSP is intractable past a couple of dozen stops, so this pairs a
 * nearest-neighbour construction with a 2-opt improvement sweep — the standard
 * heuristic pairing, and in practice within a few percent of optimal for the
 * handful-of-stops routes people actually plan.
 */
export function optimizeRoute(points: LngLat[], options: OptimizeOptions = {}): OptimizeResult {
  const { fixStart = true, roundTrip = false, maxPasses = 40 } = options;
  const n = points.length;
  const identity = Array.from({ length: n }, (_, i) => i);

  if (n < 4) {
    return { order: identity, before: 0, after: 0, saved: 0 };
  }

  const matrix = distanceMatrix(points);
  const before = tourLength(identity, matrix, roundTrip);

  // With a free start it is cheap enough to try every one and keep the best.
  const starts = fixStart ? [0] : identity;
  let best = identity;
  let bestLength = Infinity;

  for (const start of starts) {
    const candidate = twoOpt(nearestNeighbour(matrix, start), matrix, roundTrip, maxPasses);
    const length = tourLength(candidate, matrix, roundTrip);
    if (length < bestLength) {
      bestLength = length;
      best = candidate;
    }
  }

  // Never hand back something worse than what the user already had.
  if (bestLength >= before) {
    return { order: identity, before, after: before, saved: 0 };
  }

  return {
    order: best,
    before,
    after: bestLength,
    saved: before > 0 ? (before - bestLength) / before : 0,
  };
}

/** Apply an index order produced by {@link optimizeRoute} to any array. */
export function applyOrder<T>(items: T[], order: number[]): T[] {
  return order.map((index) => items[index]!).filter(Boolean);
}

/** Move the item at `from` to `to`, returning a new array. */
export function moveItem<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}
