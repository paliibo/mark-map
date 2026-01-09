import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { GithubIcon } from "@/components/ui/github-icon";

import { REPO_URL } from "@/lib/site";

export function SiteNav() {
  return (
    <header className="bg-canvas/80 sticky top-0 z-40 border-b border-white/5 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-5">
        <Link href="/" className="flex items-center gap-2">
          <span aria-hidden className="relative flex size-5 items-center justify-center">
            <span className="bg-accent/20 absolute inset-0 rounded-full" />
            <span className="bg-accent size-2 rounded-full" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Mark Map</span>
        </Link>

        <div className="ml-auto flex items-center gap-1">
          <a
            href="#features"
            className="text-muted hover:text-ink hidden rounded-lg px-3 py-1.5 text-[13px] transition-colors sm:block"
          >
            Features
          </a>
          <a
            href="#how"
            className="text-muted hover:text-ink hidden rounded-lg px-3 py-1.5 text-[13px] transition-colors sm:block"
          >
            How it works
          </a>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
            className="text-muted hover:text-ink flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors"
          >
            <GithubIcon className="size-3.5" />
            <span className="hidden sm:inline">Source</span>
          </a>
          <Link
            href="/map"
            className="bg-accent text-canvas ml-1 inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors hover:bg-sky-300"
          >
            Open the map
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
