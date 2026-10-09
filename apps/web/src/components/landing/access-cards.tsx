import { KeyRound, Fingerprint } from "lucide-react";
import { cn } from "cn";

const CARD_BASE =
    "rounded-xl border border-border/60 bg-card/80 p-3.5 shadow-xl backdrop-blur-md animate-[seal-float_9s_ease-in-out_infinite]";

/** A service token, shown the way the UI presents it: prefix and last four only. */
export function TokenCard({ className }: { className?: string }) {
    return (
        <div className={cn(CARD_BASE, className)}>
            <div className="flex items-center gap-2">
                <KeyRound className="h-3.5 w-3.5 text-foreground/70" />
                <span className="text-xs font-medium">Service token</span>
                <span className="ml-auto rounded border border-foreground/25 bg-foreground/10 px-1.5 py-0.5 font-mono text-[9px] text-foreground/80">
                    read-only
                </span>
            </div>
            <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                seal_live_<span className="text-foreground">7c2f</span>
                <span className="text-muted-foreground/40">••••••••••••9a41</span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
                <Chip>production</Chip>
                <Chip>expires in 30d</Chip>
                <Chip className="border-foreground/30 bg-foreground/10 text-foreground">ip allowlist</Chip>
            </div>
        </div>
    );
}

function Chip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return (
        <span
            className={`rounded-md border border-border/60 bg-muted/30 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground ${className}`}
        >
            {children}
        </span>
    );
}

/**
 * The access model: who reaches which environment. Mirrors the per-environment
 * overrides an admin sets when inviting someone.
 */
const ROWS = [
    { project: "checkout-api", grants: { Development: "write", Staging: "read", Production: "none" } },
    { project: "webhooks", grants: { Development: "write", Staging: "write", Production: "none" } },
    { project: "data-pipeline", grants: { Development: "none", Staging: "none", Production: "none" } },
];

const LEVELS = {
    none: { label: "none", className: "border-border/50 bg-muted/20 text-muted-foreground/50", dot: "bg-foreground/25" },
    read: { label: "read", className: "border-foreground/25 bg-foreground/5 text-foreground/75", dot: "bg-foreground/60" },
    write: { label: "write", className: "border-foreground/50 bg-foreground/12 text-foreground", dot: "bg-foreground" },
} as const;

export function AccessMatrix({ className }: { className?: string }) {
    const columns = ["Development", "Staging", "Production"];

    return (
        <div className={cn(CARD_BASE, "animate-[seal-float_11s_ease-in-out_infinite_0.6s]", className)}>
            <div className="flex items-center gap-2">
                <Fingerprint className="h-3.5 w-3.5 text-foreground/70" />
                <span className="text-xs font-medium">ivan@contractor.dev</span>
            </div>

            <div className="mt-3 space-y-1.5">
                <div className="grid grid-cols-[1fr_repeat(3,auto)] items-center gap-x-2 pb-1">
                    <span />
                    {columns.map((column) => (
                        <span key={column} className="w-13 text-center font-mono text-[9px] text-muted-foreground/60">
                            {column.slice(0, 4)}
                        </span>
                    ))}
                </div>

                {ROWS.map((row, index) => (
                    <div
                        key={row.project}
                        className="animate-[seal-rise_0.5s_ease-out_both] grid grid-cols-[1fr_repeat(3,auto)] items-center gap-x-2"
                        style={{ animationDelay: `${220 + index * 90}ms` }}
                    >
                        <span className="truncate font-mono text-[10px] text-foreground/80">{row.project}</span>
                        {columns.map((column) => {
                            const level = row.grants[column as keyof typeof row.grants] as keyof typeof LEVELS;
                            const meta = LEVELS[level];
                            return (
                                <span
                                    key={column}
                                    className={`flex w-13 items-center justify-center gap-1 rounded-md border py-1 font-mono text-[9px] ${meta.className}`}
                                >
                                    <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
                                    {meta.label}
                                </span>
                            );
                        })}
                    </div>
                ))}
            </div>

            <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
                data-pipeline is hidden entirely. Production on checkout-api is denied.
            </p>
        </div>
    );
}
