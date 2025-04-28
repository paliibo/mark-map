import { del, get, set } from "idb-keyval";
import type { StateStorage } from "zustand/middleware";

/**
 * Storage adapters that degrade instead of exploding.
 *
 * The app is statically prerendered and its logic is unit-tested in Node, so
 * both stores are constructed in environments where neither IndexedDB nor
 * localStorage exists. Falling back to memory keeps that path silent.
 */

const memory = new Map<string, string>();

export const memoryStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => {
    memory.set(name, value);
  },
  removeItem: (name) => {
    memory.delete(name);
  },
};

const hasIndexedDb = () => typeof indexedDB !== "undefined";

/** Bigger quota than localStorage, and it does not block the main thread. */
export const indexedDbStorage: StateStorage = {
  getItem: async (name) =>
    hasIndexedDb() ? ((await get<string>(name)) ?? null) : memoryStorage.getItem(name),
  setItem: async (name, value) => {
    if (hasIndexedDb()) await set(name, value);
    else memoryStorage.setItem(name, value);
  },
  removeItem: async (name) => {
    if (hasIndexedDb()) await del(name);
    else memoryStorage.removeItem(name);
  },
};

export const localStorageOrMemory = (): StateStorage =>
  typeof localStorage !== "undefined" ? localStorage : memoryStorage;
