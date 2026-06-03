export function Footer() {
  return (
    <footer className="border-t-2 border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded border-2 border-line bg-ink font-mono text-xs font-bold text-paper">
            0
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-muted">
            DropZero · zero oversells at global scale
          </span>
        </div>
        <div className="font-mono text-xs uppercase tracking-wider text-muted">
          Amazon Aurora DSQL × Vercel · #H0Hackathon
        </div>
      </div>
    </footer>
  );
}
