import { History, RotateCcw, PenLine, Trash2, ShieldCheck } from "lucide-react";
import { cn } from "cn";

/**
 * The version ledger: an append-only history where rollback adds a new entry
 * rather than rewinding. This is the product's real behaviour, shown as the
 * thing it is.
 */
const VERSIONS = [
    { version: 1, op: "create", actor: "olivia", note: "initial value", time: "09:14" },
    { version: 2, op: "update", actor: "ivan", note: "rotated after incident", time: "11:02" },
    { version: 3, op: "update", actor: "olivia", note: "new endpoint", time: "14:38" },
    { version: 4, op: "delete", actor: "ivan", note: "wrong environment", time: "16:05" },
    { version: 5, op: "rollback", actor: "olivia", note: "restored from v3", time: "16:07", highlight: true },
];

const OP_META = {
    create: { icon: PenLine, className: "text-foreground/70" },
    update: { icon: PenLine, className: "text-foreground/70" },
    delete: { icon: Trash2, className: "text-muted-foreground/60" },
    rollback: { icon: RotateCcw, className: "text-foreground" },
} as const;

export function VersionLedger({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 p-5 shadow-2xl backdrop-blur-sm",
                className,
            )}
        >
            {/* Slow specular sweep, so the card reads as glass rather than a flat panel. */}
            <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full animate-[seal-sweep_7s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-foreground/8 to-transparent"
            />

            <div className="relative flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <History className="h-4 w-4 text-foreground" />
                    <span className="text-sm font-medium">DATABASE_URL</span>
                    <span className="rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                        production
                    </span>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground">append-only</span>
            </div>

            <ol className="relative mt-4 space-y-0">
                {VERSIONS.map((entry, index) => {
                    const meta = OP_META[entry.op as keyof typeof OP_META];
                    const Icon = meta.icon;
                    const last = index === VERSIONS.length - 1;
                    return (
                        <li
                            key={entry.version}
                            className="animate-[seal-rise_0.6s_ease-out_both] relative flex gap-3 pb-3 last:pb-0"
                            style={{ animationDelay: `${140 + index * 110}ms` }}
                        >
                            {/* Connector */}
                            {!last && (
                                <span
                                    aria-hidden
                                    className="absolute top-6 left-[11px] h-[calc(100%-0.25rem)] w-px bg-gradient-to-b from-border to-transparent"
                                />
                            )}
                            <span
                                className={cn(
                                    "relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background",
                                    entry.highlight
                                        ? "border-foreground/60 ring-2 ring-foreground/20"
                                        : "border-border",
                                )}
                            >
                                <Icon className={cn("h-3 w-3", meta.className)} />
                            </span>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="font-mono text-xs font-semibold">v{entry.version}</span>
                                    <span className={cn("font-mono text-[10px] uppercase tracking-wide", meta.className)}>
                                        {entry.op}
                                    </span>
                                    <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
                                        {entry.time}
                                    </span>
                                </div>
                                <p className="truncate text-xs text-muted-foreground">
                                    <span className="text-foreground/80">{entry.actor}</span>
                                    <span className="mx-1.5 text-muted-foreground/50">·</span>
                                    {entry.note}
                                </p>
                            </div>
                        </li>
                    );
                })}
            </ol>

            <div className="relative mt-4 flex items-center gap-2 rounded-lg border border-foreground/20 bg-foreground/5 px-3 py-2">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-foreground" />
                <p className="text-[11px] text-muted-foreground">
                    Current value is <span className="font-medium text-foreground">v3</span>, written as{" "}
                    <span className="font-mono text-foreground">v5</span>. Nothing was overwritten.
                </p>
            </div>
        </div>
    );
}
