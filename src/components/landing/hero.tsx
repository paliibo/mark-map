import Link from "next/link";
import { ArrowRight, KeyRound } from "lucide-react";

import { GithubIcon } from "@/components/ui/github-icon";

import { RouteIllustration } from "@/components/landing/route-illustration";
import { REPO_URL } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient light behind the hero. */}
      <div
        aria-hidden
        className="animate-drift pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_-10%,rgba(56,189,248,0.16),transparent_70%),radial-gradient(40%_40%_at_85%_20%,rgba(167,139,250,0.12),transparent_70%)]"
      />
      <div
        aria-hidden
        className="grid-backdrop pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
      />

      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
        <div>
          <span className="text-muted inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px]">
            <KeyRound className="text-accent size-3" />
            No API keys &middot; no account &middot; no backend
          </span>

          <h1 className="mt-5 text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
            Plan a route.
            <br />
            <span className="text-gradient">Share it as a link.</span>
          </h1>

          <p className="text-muted mt-5 max-w-lg text-[15px] leading-relaxed text-balance">
            Mark Map is a map that plans trips. Drop stops, let it reorder them into the shortest
            route, then hand the whole thing to someone as a single URL — the trip is packed into
            the link itself, so nothing is ever uploaded.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/map"
              className="bg-accent text-canvas shadow-accent inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold shadow-[0_12px_32px_-12px] transition-all hover:bg-sky-300 hover:shadow-[0_16px_40px_-12px]"
            >
              Open the map
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="text-ink inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-5 text-sm transition-colors hover:border-white/20 hover:bg-white/[0.07]"
            >
              <GithubIcon className="size-4" />
              Read the source
            </a>
          </div>

          <dl className="mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/5 pt-6">
            {[
              ["0", "API keys needed"],
              ["100%", "In your browser"],
              ["~200", "Chars per shared trip"],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-ink font-mono text-xl">{value}</dt>
                <dd className="text-faint mt-1 text-[11px] leading-snug">{label}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="relative">
          <div className="glass rounded-panel p-2 shadow-2xl">
            <RouteIllustration />
          </div>
          <p className="text-faint mt-3 text-center text-[11px]">
            Basemaps from OpenStreetMap &amp; CARTO. Search by Nominatim.
          </p>
        </div>
      </div>
    </section>
  );
}
