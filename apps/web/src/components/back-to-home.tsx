import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "cn";
import { SealMark } from "@/components/landing/seal-mark";

/**
 * Link back to the landing page.
 *
 * The auth pages are all centred shells with no navigation of their own, so
 * once the landing page existed they became a dead end with no way back.
 */
export function BackToHome({ className }: { className?: string }) {
    return (
        <Link
            href="/"
            className={cn(
                "inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground",
                className,
            )}
        >
            <ArrowLeft className="h-4 w-4" />
            <SealMark className="h-5 w-5" />
            <span>Back to Seal</span>
        </Link>
    );
}