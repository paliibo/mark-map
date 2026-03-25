import { GithubIcon } from "@/components/ui/github-icon";

import { AUTHOR_NAME, AUTHOR_URL, REPO_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-muted text-[13px]">
            Mark Map &mdash; built by{" "}
            <a
              href={AUTHOR_URL}
              target="_blank"
              rel="noreferrer"
              className="text-ink hover:text-accent"
            >
              {AUTHOR_NAME}
            </a>
          </p>
          <p className="text-faint mt-1 text-[11px]">
            Map data &copy; OpenStreetMap contributors &middot; tiles by CARTO &middot; search by
            Nominatim &middot; imagery &copy; Esri
          </p>
        </div>

        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className="text-muted hover:text-ink inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-white/10 px-3 text-[13px] transition-colors hover:border-white/20"
        >
          <GithubIcon className="size-3.5" />
          MIT licensed on GitHub
        </a>
      </div>
    </footer>
  );
}
