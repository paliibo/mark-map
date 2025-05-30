import clsx from "clsx";

/** A single key cap. Pass `⌘`, `Shift`, `K`… */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={clsx(
        "inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/10",
        "text-muted bg-white/[0.06] px-1.5 font-mono text-[10px] font-medium",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
