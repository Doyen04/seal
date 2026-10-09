"use client";

import * as React from "react";
import { cn } from "cn";
import { Label as LabelPrimitive } from "radix-ui";

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
    return (
        <LabelPrimitive.Root
            data-slot="label"
            // `leading-snug`, not `leading-none`: a line box equal to the font
            // size clips descenders and shaves the apparent gap to the control
            // below it, which made every label sit too close to its field. The
            // label's own height now absorbs that spacing, so a form reads the
            // same without each caller tuning margins by hand.
            className={cn(
                "flex items-center gap-2 text-sm leading-snug font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
                className,
            )}
            {...props}
        />
    );
}

export { Label };
