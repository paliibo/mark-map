import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STACK: [name: string, role: string][] = [
  ["Next.js 15", "App Router, exported as a static site"],
  ["React 19", "with TypeScript in strict mode"],
  ["MapLibre GL", "vector maps, no proprietary key"],
  ["Zustand", "state, history and persistence"],
  ["Tailwind v4", "CSS-first design tokens"],
  ["Vitest", "unit tests over the geo and codec layers"],
];

export function TechStrip() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-24">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <p className="text-accent text-[11px] font-medium tracking-wider uppercase">Built with</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            A static site that behaves like an app
          </h2>
          <p className="text-muted mt-4 text-[15px] leading-relaxed">
            The whole thing compiles to HTML, CSS and JavaScript on a CDN. No server runs anywhere,
            which is also why there is nothing to sign in to.
          </p>

          <Link
            href="/map"
            className="bg-accent text-canvas mt-7 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors hover:bg-sky-300"
          >
            Try it now
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <ul className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.06] sm:grid-cols-2">
          {STACK.map(([name, role]) => (
            <li key={name} className="bg-canvas p-4">
              <p className="text-ink text-[13px] font-semibold">{name}</p>
              <p className="text-faint mt-1 text-[12px] leading-relaxed">{role}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
