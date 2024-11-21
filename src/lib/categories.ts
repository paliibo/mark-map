import type { CategoryId } from "@/types";

export interface CategoryDef {
  id: CategoryId;
  label: string;
  /** Pin fill. Chosen to stay legible on light, dark and satellite basemaps. */
  color: string;
}

/**
 * Order is part of the share-link wire format — append new categories at the
 * end, never reorder, or old links decode to the wrong pins.
 */
export const CATEGORIES: readonly CategoryDef[] = [
  { id: "place", label: "Place", color: "#6366f1" },
  { id: "food", label: "Food & drink", color: "#f59e0b" },
  { id: "stay", label: "Stay", color: "#a855f7" },
  { id: "sight", label: "Sight", color: "#0ea5e9" },
  { id: "nature", label: "Nature", color: "#10b981" },
  { id: "transit", label: "Transit", color: "#64748b" },
  { id: "shop", label: "Shop", color: "#ec4899" },
  { id: "warning", label: "Heads-up", color: "#ef4444" },
] as const;

export const DEFAULT_CATEGORY: CategoryId = "place";

const BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

export function categoryOf(id: CategoryId | string | undefined): CategoryDef {
  return BY_ID.get(id as CategoryId) ?? CATEGORIES[0]!;
}

export function categoryColor(id: CategoryId | string | undefined): string {
  return categoryOf(id).color;
}

export function categoryIndex(id: CategoryId): number {
  const index = CATEGORIES.findIndex((category) => category.id === id);
  return index === -1 ? 0 : index;
}

export function categoryAt(index: number): CategoryId {
  return CATEGORIES[index]?.id ?? DEFAULT_CATEGORY;
}
