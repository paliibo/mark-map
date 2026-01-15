const STEPS: [title: string, body: string][] = [
  [
    "Collect the stops",
    "Search a place by name, or switch on the drop tool and click the map. Dropped pins name themselves from OpenStreetMap.",
  ],
  [
    "Get the order right",
    "Drag stops into the sequence you want, or hit Optimise and let the solver untangle it. Distance and time update as you go.",
  ],
  [
    "Take it with you",
    "Copy a share link, export GPX for a watch, or just close the tab — it is already saved on your device.",
  ],
];

export function HowItWorks() {
  return (
    <section id="how" className="relative scroll-mt-20 border-y border-white/5 bg-white/[0.015]">
      <div className="mx-auto w-full max-w-6xl px-5 py-16 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-accent text-[11px] font-medium tracking-wider uppercase">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
            Three steps, no sign-up
          </h2>
        </div>

        <ol className="mt-10 grid gap-8 sm:grid-cols-3">
          {STEPS.map(([title, body], index) => (
            <li key={title} className="relative">
              <span className="border-accent/25 bg-accent/10 text-accent flex size-9 items-center justify-center rounded-xl border font-mono text-sm">
                {index + 1}
              </span>
              <h3 className="text-ink mt-4 text-[15px] font-semibold">{title}</h3>
              <p className="text-muted mt-2 text-[13px] leading-relaxed">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
