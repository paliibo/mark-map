"use client";

import { Dialog } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { useUiStore } from "@/store/ui";

const GROUPS: { title: string; items: [keys: string[], label: string][] }[] = [
  {
    title: "Stops",
    items: [
      [["N"], "Add a stop at the map centre"],
      [["A"], "Drop stops by clicking the map"],
      [["/"], "Search for a place"],
      [["⌫"], "Delete the selected stop"],
    ],
  },
  {
    title: "Route",
    items: [
      [["O"], "Optimise the order"],
      [["R"], "Reverse the route"],
      [["F"], "Frame the whole trip"],
    ],
  },
  {
    title: "General",
    items: [
      [["⌘", "K"], "Command palette"],
      [["⌘", "Z"], "Undo"],
      [["⇧", "⌘", "Z"], "Redo"],
      [["B"], "Toggle the side panel"],
      [["M"], "Cycle the basemap"],
      [["?"], "This list"],
      [["Esc"], "Close, cancel, deselect"],
    ],
  },
];

export function ShortcutsDialog() {
  const open = useUiStore((state) => state.dialog === "shortcuts");
  const closeDialog = useUiStore((state) => state.closeDialog);

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      title="Keyboard shortcuts"
      description="Everything here also lives in the command palette."
      className="max-w-md"
    >
      <div className="space-y-4 px-5 py-4">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h3 className="text-faint/70 mb-2 text-[10px] font-medium tracking-wider uppercase">
              {group.title}
            </h3>
            <ul className="space-y-1.5">
              {group.items.map(([keys, label]) => (
                <li key={label} className="flex items-center justify-between gap-4">
                  <span className="text-muted text-[13px]">{label}</span>
                  <span className="flex shrink-0 gap-1">
                    {keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Dialog>
  );
}
