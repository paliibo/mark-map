"use client";

import { MapPin } from "lucide-react";

import { useMapActions } from "@/components/map/use-map-actions";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { categoryColor } from "@/lib/categories";
import { useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

/**
 * Opening a share link never silently rewrites someone's data — the incoming
 * trip is previewed first and only saved when they accept it.
 */
export function SharedTripDialog() {
  const open = useUiStore((state) => state.dialog === "shared-trip");
  const pendingShare = useUiStore((state) => state.pendingShare);
  const setPendingShare = useUiStore((state) => state.setPendingShare);
  const closeDialog = useUiStore((state) => state.closeDialog);
  const toast = useUiStore((state) => state.toast);

  const adoptSharedTrip = useTripsStore((state) => state.adoptSharedTrip);
  const { fitTo } = useMapActions();

  const dismiss = () => {
    setPendingShare(null);
    closeDialog();
  };

  const accept = () => {
    if (!pendingShare) return;
    adoptSharedTrip(pendingShare);
    fitTo(pendingShare.stops);
    toast({
      title: "Trip saved",
      description: `${pendingShare.stops.length} stops added to this device.`,
      tone: "success",
    });
    dismiss();
  };

  if (!pendingShare) return null;

  return (
    <Dialog
      open={open}
      onClose={dismiss}
      title="Someone shared a trip with you"
      description="It was decoded from the link — nothing has been saved yet."
      className="max-w-md"
    >
      <div className="px-5 py-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <p className="text-ink text-sm font-semibold">{pendingShare.name || "Shared trip"}</p>
          <p className="text-faint mt-0.5 text-[11px]">
            {pendingShare.stops.length} stops &middot; {pendingShare.travelMode}
            {pendingShare.roundTrip ? " · round trip" : ""}
          </p>

          <ul className="mt-3 space-y-1.5">
            {pendingShare.stops.slice(0, 5).map((stop, index) => (
              <li key={`${stop.lat}-${stop.lng}-${index}`} className="flex items-center gap-2">
                <MapPin
                  className="size-3 shrink-0"
                  style={{ color: categoryColor(stop.category) }}
                />
                <span className="text-muted truncate text-[12px]">{stop.name}</span>
              </li>
            ))}
            {pendingShare.stops.length > 5 && (
              <li className="text-faint pl-5 text-[11px]">
                and {pendingShare.stops.length - 5} more…
              </li>
            )}
          </ul>
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="lg" className="flex-1" onClick={dismiss}>
            Discard
          </Button>
          <Button variant="primary" size="lg" className="flex-1" onClick={accept}>
            Save to my trips
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
