"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { buildShareUrl } from "@/lib/share";
import { activeTripOf, useTripsStore } from "@/store/trips";
import { useUiStore } from "@/store/ui";

/** Shows the generated link and how it works — the codec is a selling point. */
export function ShareDialog() {
  const open = useUiStore((state) => state.dialog === "share");
  const closeDialog = useUiStore((state) => state.closeDialog);
  const trip = useTripsStore(activeTripOf);
  const [copied, setCopied] = useState(false);

  const url = useMemo(() => {
    if (!open || !trip || typeof window === "undefined") return "";
    return buildShareUrl(`${window.location.origin}${window.location.pathname}`, trip);
  }, [open, trip]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      // Fall back to letting the user select the text themselves.
      document.querySelector<HTMLInputElement>("#share-url")?.select();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={closeDialog}
      title="Share this trip"
      description="The entire trip is packed into the link. Nothing is uploaded."
      className="max-w-lg"
    >
      <div className="space-y-4 px-5 py-4">
        <div className="flex gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3">
            <Link2 className="text-faint size-3.5 shrink-0" />
            <input
              id="share-url"
              readOnly
              value={url}
              onFocus={(event) => event.currentTarget.select()}
              className="text-muted h-9 min-w-0 flex-1 bg-transparent font-mono text-[11px] focus:outline-none"
            />
          </div>
          <Button variant="primary" onClick={() => void copy()}>
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>

        <dl className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Stops", String(trip?.markers.length ?? 0)],
            ["Link size", `${url.length} chars`],
            ["Uploaded", "Nothing"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg bg-white/[0.03] px-2 py-2.5">
              <dt className="text-faint/70 text-[10px] tracking-wider uppercase">{label}</dt>
              <dd className="text-ink mt-1 font-mono text-[13px]">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="text-faint text-[11px] leading-relaxed">
          Stops are delta-encoded into a binary frame and packed as base64url in the URL fragment.
          Fragments are never sent to a server, so the link works from any static host — and keeps
          working even if this one disappears.
        </p>
      </div>
    </Dialog>
  );
}
