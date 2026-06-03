import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 border-b-2 border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded border-2 border-line bg-ink font-mono text-base font-bold text-paper shadow-hardsm">
            0
          </span>
          <span className="text-xl font-extrabold uppercase tracking-tight">
            DropZero
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
          >
            Drops
          </Link>
          <Link
            href="/admin"
            className="rounded px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ink hover:bg-ink hover:text-paper"
          >
            Seller
          </Link>
          <span className="ml-1 hidden font-mono text-[11px] uppercase tracking-wider text-muted sm:inline">
            Aurora&nbsp;DSQL × Vercel
          </span>
        </nav>
      </div>
    </header>
  );
}
