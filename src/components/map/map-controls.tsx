"use client";

import { Compass, Crosshair, Frame, Minus, Plus } from "lucide-react";
import { useState } from "react";

import { useMapActions } from "@/components/map/use-map-actions";
import { IconButton } from "@/components/ui/button";
import { activeTripOf, useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

/** Zoom, orientation, geolocation and "frame my trip", bottom-right. */
export function MapControls() {
  const { zoomBy, resetNorth, fitTo, flyTo } = useMapActions();
  const trip = useTripsStore(activeTripOf);
  const toast = useUiStore((state) => state.toast);
  const [locating, setLocating] = useState(false);

  const markers = trip?.markers ?? [];

  const locate = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Location unavailable",
        description: "This browser has no geolocation.",
        tone: "error",
      });
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        flyTo({ lat: position.coords.latitude, lng: position.coords.longitude }, 14);
      },
      (error) => {
        setLocating(false);
        toast({
          title: "Could not find you",
          description:
            error.code === error.PERMISSION_DENIED ? "Location permission denied." : error.message,
          tone: "error",
        });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  return (
    <div className="glass flex flex-col overflow-hidden rounded-xl p-1">
      <IconButton label="Zoom in" onClick={() => zoomBy(1)}>
        <Plus className="size-4" />
      </IconButton>
      <IconButton label="Zoom out" onClick={() => zoomBy(-1)}>
        <Minus className="size-4" />
      </IconButton>

      <span className="mx-auto my-1 h-px w-5 bg-white/10" />

      {/* Wrapped rather than class-hidden: `hidden` and the button's own
          `inline-flex` are both display utilities and would fight. */}
      <div className="hidden lg:block">
        <IconButton label="Reset bearing to north" onClick={resetNorth}>
          <Compass className="size-4" />
        </IconButton>
      </div>
      <IconButton label="Use my location" onClick={locate} disabled={locating}>
        <Crosshair className={locating ? "size-4 animate-spin" : "size-4"} />
      </IconButton>
      <IconButton
        label="Frame the whole trip"
        onClick={() => fitTo(markers)}
        disabled={markers.length === 0}
      >
        <Frame className="size-4" />
      </IconButton>
    </div>
  );
}
