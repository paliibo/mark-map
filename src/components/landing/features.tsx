import { Command, FileDown, KeyRound, Link2, WifiOff, Wand2, type LucideIcon } from "lucide-react";

interface Feature {
  title: string;
  body: string;
  Icon: LucideIcon;
  detail?: string;
}

const FEATURES: Feature[] = [
  {
    title: "Optimises the order for you",
    body: "A nearest-neighbour tour refined by a 2-opt sweep untangles a route that crosses itself, and tells you exactly how much shorter it got.",
    detail: "src/lib/route.ts",
    Icon: Wand2,
  },
  {
    title: "The trip lives in the link",
    body: "Stops are delta-encoded into a binary frame and packed as base64url in the URL fragment. A ten-stop trip fits in about 200 characters and never touches a server.",
    detail: "src/lib/share.ts",
    Icon: Link2,
  },
  {
    title: "Runs with zero configuration",
    body: "MapLibre with OpenStreetMap tiles, so there is no key to obtain, no billing account, and no blank map for anyone who clones the repo.",
    detail: "git clone && pnpm dev",
    Icon: KeyRound,
  },
  {
    title: "Yours, on your device",
    body: "Trips are saved to IndexedDB as you work. Close the tab, go offline, come back next week — everything is still there, and none of it was sent anywhere.",
    Icon: WifiOff,
  },
  {
    title: "Speaks GPX and GeoJSON",
    body: "Export a route to a watch or a GPS unit, or import one from any tool that emits waypoints. Both directions are covered by unit tests.",
    Icon: FileDown,
  },
  {
    title: "Keyboard first",
    body: "A command palette on ⌘K, single-key shortcuts for every action, and undo that reaches back sixty steps.",
    Icon: Command,
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-16 lg:py-24">
      <div className="max-w-2xl">
        <p className="text-accent text-[11px] font-medium tracking-wider uppercase">Features</p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Small app, real engineering
        </h2>
        <p className="text-muted mt-4 text-[15px] leading-relaxed">
          Every feature here works without an account, a key or a network round trip — which turned
          out to be the interesting constraint.
        </p>
      </div>

      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ title, body, detail, Icon }) => (
          <li
            key={title}
            className="group hover:border-accent/25 relative overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all duration-300 hover:bg-white/[0.04]"
          >
            <span
              aria-hidden
              className="bg-accent/10 pointer-events-none absolute -top-16 -right-16 size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
            />
            <Icon className="text-accent size-5" />
            <h3 className="text-ink mt-4 text-[15px] font-semibold">{title}</h3>
            <p className="text-muted mt-2 text-[13px] leading-relaxed">{body}</p>
            {detail && (
              <code className="text-faint mt-3 block font-mono text-[11px]">{detail}</code>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
