"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createId } from "@/lib/id";
import { DEFAULT_MAP_STYLE, type MapStyleId } from "@/lib/map-styles";
import type { SharedTrip } from "@/lib/share";
import { localStorageOrMemory } from "@/lib/storage";

export type ToastTone = "info" | "success" | "error";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

export type DialogId = "palette" | "shortcuts" | "share" | "import" | "shared-trip";

interface UiState {
  mapStyle: MapStyleId;
  panelOpen: boolean;
  /** Only ever one modal at a time — Escape always has one obvious target. */
  dialog: DialogId | null;
  /** When on, the next map click drops a stop instead of deselecting. */
  addMode: boolean;
  /** A trip decoded from the URL, waiting for the user to accept it. */
  pendingShare: SharedTrip | null;
  toasts: Toast[];

  setMapStyle: (id: MapStyleId) => void;
  cycleMapStyle: (ids: readonly MapStyleId[]) => void;
  setAddMode: (addMode: boolean) => void;
  setPendingShare: (trip: SharedTrip | null) => void;
  toggleAddMode: () => void;
  setPanelOpen: (open: boolean) => void;
  togglePanel: () => void;
  openDialog: (dialog: DialogId) => void;
  closeDialog: () => void;
  toggleDialog: (dialog: DialogId) => void;

  toast: (toast: Omit<Toast, "id" | "tone"> & { tone?: ToastTone }) => void;
  dismissToast: (id: string) => void;
}

const TOAST_TIMEOUT_MS = 4200;

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      mapStyle: DEFAULT_MAP_STYLE,
      panelOpen: true,
      dialog: null,
      addMode: false,
      pendingShare: null,
      toasts: [],

      setMapStyle: (mapStyle) => set({ mapStyle }),

      cycleMapStyle: (ids) => {
        const current = ids.indexOf(get().mapStyle);
        set({ mapStyle: ids[(current + 1) % ids.length] ?? DEFAULT_MAP_STYLE });
      },

      setAddMode: (addMode) => set({ addMode }),
      setPendingShare: (pendingShare) => set({ pendingShare }),
      toggleAddMode: () => set((state) => ({ addMode: !state.addMode })),

      setPanelOpen: (panelOpen) => set({ panelOpen }),
      togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),

      openDialog: (dialog) => set({ dialog }),
      closeDialog: () => set({ dialog: null }),
      toggleDialog: (dialog) =>
        set((state) => ({ dialog: state.dialog === dialog ? null : dialog })),

      toast: ({ title, description, tone = "info" }) => {
        const id = createId();
        set((state) => ({ toasts: [...state.toasts, { id, title, description, tone }] }));
        setTimeout(() => get().dismissToast(id), TOAST_TIMEOUT_MS);
      },

      dismissToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
    }),
    {
      name: "mark-map/ui",
      storage: createJSONStorage(localStorageOrMemory),
      partialize: (state) => ({ mapStyle: state.mapStyle, panelOpen: state.panelOpen }),
      skipHydration: true,
    },
  ),
);
