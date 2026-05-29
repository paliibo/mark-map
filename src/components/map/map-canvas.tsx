"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import MapGL, {
  Layer,
  Marker,
  Source,
  type MapLayerMouseEvent,
  type MapRef,
} from "react-map-gl/maplibre";

import { MarkerPin } from "@/components/map/marker-pin";
import { useMapActions } from "@/components/map/use-map-actions";
import { reverseGeocode } from "@/lib/geocode";
import { routeLineFeature } from "@/lib/io/geojson";
import { mapStyle } from "@/lib/map-styles";
import { activeTripOf, useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

const INITIAL_VIEW = { longitude: 24.0316, latitude: 49.842, zoom: 12.4 };

export function MapCanvas() {
  const mapRef = useRef<MapRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const reportedErrorRef = useRef(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const didInitialFit = useRef(false);

  const trip = useTripsStore(activeTripOf);
  const selectedMarkerId = useTripsStore((state) => state.selectedMarkerId);
  const hydrated = useTripsStore((state) => state.hydrated);
  const addMarker = useTripsStore((state) => state.addMarker);
  const updateMarker = useTripsStore((state) => state.updateMarker);
  const applyGeocodedName = useTripsStore((state) => state.applyGeocodedName);
  const selectMarker = useTripsStore((state) => state.selectMarker);

  const styleId = useUiStore((state) => state.mapStyle);
  const addMode = useUiStore((state) => state.addMode);
  const toast = useUiStore((state) => state.toast);
  const setAddMode = useUiStore((state) => state.setAddMode);

  const { fitTo } = useMapActions();
  const markers = useMemo(() => trip?.markers ?? [], [trip]);
  const style = mapStyle(styleId);

  const routeData = useMemo(() => {
    const feature = routeLineFeature(markers, trip?.roundTrip ?? false);
    return feature ?? { type: "FeatureCollection" as const, features: [] };
  }, [markers, trip?.roundTrip]);

  /** Frame the whole trip the first time real data lands. */
  useEffect(() => {
    if (didInitialFit.current || !hydrated || markers.length === 0) return;
    didInitialFit.current = true;
    // Wait for the canvas to size itself before fitting to it.
    const timer = window.setTimeout(() => fitTo(markers), 320);
    return () => window.clearTimeout(timer);
  }, [hydrated, markers, fitTo]);

  /**
   * The workspace is code-split, so its stylesheet can land after the map has
   * already initialised — and MapLibre sizes its canvas once, from whatever
   * the container measured at construction. When that measurement is zero it
   * silently falls back to 400x300 and never recovers, so the container is
   * observed directly and the map is told to resize whenever the box changes.
   */
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver(() => mapRef.current?.getMap()?.resize());
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const handleLoad = useCallback(() => {
    mapRef.current?.getMap().resize();
  }, []);

  /** Tile and style failures are silent by default; surface them once. */
  const handleError = useCallback(
    (event: { error: Error }) => {
      console.error("[mark-map] map error:", event.error);
      if (reportedErrorRef.current) return;
      reportedErrorRef.current = true;
      toast({
        title: "The basemap could not load",
        description: "Check your connection, or pick another basemap.",
        tone: "error",
      });
    },
    [toast],
  );

  const handleClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!addMode) {
        selectMarker(null);
        return;
      }

      const { lng, lat } = event.lngLat;
      const id = addMarker({ lat, lng });

      // Name the stop from OpenStreetMap, but never clobber a name the user
      // has already typed while the request was in flight.
      void reverseGeocode({ lat, lng }).then((place) => {
        if (!place) return;
        const current = activeTripOf(useTripsStore.getState())?.markers.find((m) => m.id === id);
        if (current && /^Stop \d+$/.test(current.name)) {
          applyGeocodedName(id, place.name);
        }
      });
    },
    [addMode, addMarker, applyGeocodedName, selectMarker],
  );

  // Escape leaves the drop-a-pin tool.
  useEffect(() => {
    if (!addMode) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAddMode(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [addMode, setAddMode]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <MapGL
        id="main"
        ref={mapRef}
        initialViewState={INITIAL_VIEW}
        mapStyle={style.style}
        style={{ width: "100%", height: "100%" }}
        cursor={addMode ? "crosshair" : "grab"}
        onClick={handleClick}
        onLoad={handleLoad}
        onError={handleError}
        attributionControl={{ compact: true }}
        dragRotate
        maxZoom={19}
        minZoom={1.6}
      >
        {/* Keyed by style so the route survives a basemap switch. */}
        <Source id="route" key={styleId} type="geojson" data={routeData}>
          <Layer
            id="route-glow"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{
              "line-color": "#38bdf8",
              "line-width": 12,
              "line-blur": 12,
              "line-opacity": 0.35,
            }}
          />
          <Layer
            id="route-line"
            type="line"
            layout={{ "line-cap": "round", "line-join": "round" }}
            paint={{ "line-color": "#7dd3fc", "line-width": 2.5, "line-opacity": 0.95 }}
          />
        </Source>

        {markers.map((marker, index) => (
          <Marker
            key={marker.id}
            longitude={marker.lng}
            latitude={marker.lat}
            anchor="bottom"
            draggable
            onDragStart={() => setDraggingId(marker.id)}
            onDragEnd={(event) => {
              setDraggingId(null);
              updateMarker(marker.id, { lat: event.lngLat.lat, lng: event.lngLat.lng });
            }}
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              selectMarker(marker.id);
            }}
          >
            <MarkerPin
              marker={marker}
              index={index + 1}
              selected={selectedMarkerId === marker.id}
              dragging={draggingId === marker.id}
            />
          </Marker>
        ))}
      </MapGL>
    </div>
  );
}
