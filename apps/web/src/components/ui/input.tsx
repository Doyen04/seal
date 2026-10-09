import * as React from "react";
import { cn } from "cn";

/**
 * The shared single-line control. Everything on this scale is deliberate:
 *
 * - `h-10` (40px) with `py-2.5` gives the glyphs real breathing room inside the
 *   border instead of touching it.
 * - `text-base` below `md` keeps iOS Safari from zooming the viewport on focus.
 *   That is why the size steps down rather than being `text-sm` throughout.
 * - `min-w-0` lets the control shrink inside flex and grid parents; without it a
 *   long value forces the row wider than the container.
 *
 * Do not hand-roll an `<input>` elsewhere. Use this, so spacing stays identical
 * across the app. The lint config fails the build if a raw one appears.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "h-10 w-full min-w-0 rounded-lg border border-input bg-transparent px-3 py-2.5 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
                className,
            )}
            {...props}
        />
    );
}

export { Input };
