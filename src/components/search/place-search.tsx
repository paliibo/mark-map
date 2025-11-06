"use client";

import clsx from "clsx";
import { Loader2, MapPin, Search, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useMapActions } from "@/components/map/use-map-actions";
import { searchPlaces, type GeocodeResult } from "@/lib/geocode";
import { useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

const DEBOUNCE_MS = 380;

/**
 * Place search backed by Nominatim. Requests are debounced and the previous
 * one is aborted on every keystroke, which keeps us inside OpenStreetMap's
 * one-request-per-second usage policy.
 */
export function PlaceSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { flyTo, viewbox } = useMapActions();
  const addMarker = useTripsStore((state) => state.addMarker);
  const toast = useUiStore((state) => state.toast);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const found = await searchPlaces(trimmed, {
          signal: controller.signal,
          viewbox: viewbox() ?? undefined,
        });
        setResults(found);
        setHighlight(0);
        setError(found.length === 0 ? "No places matched" : null);
      } catch (cause) {
        if ((cause as Error)?.name === "AbortError") return;
        setError("Search is unavailable right now");
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [query, viewbox]);

  // `/` from anywhere focuses the box.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.matches("input, textarea, [contenteditable='true']");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const choose = useCallback(
    (result: GeocodeResult) => {
      addMarker({ lat: result.lat, lng: result.lng, name: result.name, note: result.label });
      flyTo(result, 15);
      setQuery("");
      setResults([]);
      inputRef.current?.blur();
      toast({ title: `Added ${result.name}`, tone: "success" });
    },
    [addMarker, flyTo, toast],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setQuery("");
      setResults([]);
      inputRef.current?.blur();
      return;
    }
    if (results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlight((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((index) => (index - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const result = results[highlight];
      if (result) choose(result);
    }
  };

  const showResults = results.length > 0 || error !== null;

  return (
    <div className="pointer-events-auto w-full max-w-lg">
      <div className="glass flex h-11 items-center gap-2 rounded-xl px-3">
        {loading ? (
          <Loader2 className="text-accent size-4 shrink-0 animate-spin" />
        ) : (
          <Search className="text-faint size-4 shrink-0" />
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search a place, address or landmark…"
          aria-label="Search places"
          className="text-ink placeholder:text-faint h-full min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
        />

        {query ? (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            aria-label="Clear search"
            className="text-faint hover:text-ink transition-colors"
          >
            <X className="size-4" />
          </button>
        ) : (
          <kbd className="text-faint hidden rounded border border-white/10 bg-white/5 px-1.5 font-mono text-[10px] sm:block">
            /
          </kbd>
        )}
      </div>

      {showResults && (
        <div className="glass animate-rise mt-1.5 overflow-hidden rounded-xl">
          {error && results.length === 0 ? (
            <p className="text-faint px-3 py-3 text-xs">{error}</p>
          ) : (
            <ul role="listbox" aria-label="Search results">
              {results.map((result, index) => (
                <li key={result.id}>
                  <button
                    role="option"
                    aria-selected={index === highlight}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => choose(result)}
                    className={clsx(
                      "flex w-full items-start gap-2.5 px-3 py-2 text-left transition-colors",
                      index === highlight ? "bg-white/[0.07]" : "hover:bg-white/[0.04]",
                    )}
                  >
                    <MapPin className="text-accent mt-0.5 size-3.5 shrink-0" />
                    <span className="min-w-0">
                      <span className="text-ink block truncate text-[13px]">{result.name}</span>
                      <span className="text-faint block truncate text-[11px]">{result.label}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <p className="text-faint/70 border-t border-white/5 px-3 py-1.5 text-[10px]">
            Places from OpenStreetMap via Nominatim
          </p>
        </div>
      )}
    </div>
  );
}
