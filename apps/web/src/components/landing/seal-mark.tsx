import { cn } from "cn";

/**
 * The Seal mark: a wax seal. Concentric rings with an irregular edge, because a
 * wax stamp never presses perfectly square.
 */
export function SealMark({ className, animated = false }: { className?: string; animated?: boolean }) {
    return (
        <span className={cn("relative inline-flex items-center justify-center", className)}>
            {animated && (
                <span
                    aria-hidden
                    className="absolute inset-0 rounded-full border border-current/40 animate-[seal-ring_3s_ease-out_infinite]"
                />
            )}
            <svg viewBox="0 0 48 48" fill="none" className="h-full w-full">
                <defs>
                    {/* Monochrome: the mark inherits whatever colour it sits on. */}
                    <linearGradient id="seal-wax" x1="8" y1="4" x2="40" y2="44" gradientUnits="userSpaceOnUse">
                        <stop stopColor="currentColor" stopOpacity="1" />
                        <stop offset="0.55" stopColor="currentColor" stopOpacity="0.55" />
                        <stop offset="1" stopColor="currentColor" stopOpacity="0.9" />
                    </linearGradient>
                </defs>
                {/* Irregular wax edge */}
                <path
                    d="M24 2.5c3.1 0 4.6 1.9 7.3 2.6 2.7.7 4.9-.4 6.9 1.6 2 2 1.3 4.2 2 6.9.7 2.7 2.6 4.2 2.6 7.3s-1.9 4.6-2.6 7.3c-.7 2.7.4 4.9-2 6.9-2 2-4.2 1.3-6.9 2C28.6 45.5 27.1 47.5 24 47.5s-4.6-1.9-7.3-2.6c-2.7-.7-4.9.4-6.9-2-2-2-1.3-4.2-2-6.9-.7-2.7-2.6-4.2-2.6-7.3s1.9-4.6 2.6-7.3c.7-2.7-.4-4.9 2-6.9 2-2 4.2-1.3 6.9-2C19.4 4.4 20.9 2.5 24 2.5Z"
                    fill="url(#seal-wax)"
                />
                {/* Pressed inner ring */}
                <circle
                    cx="24"
                    cy="24"
                    r="13.5"
                    stroke="var(--color-background)"
                    strokeOpacity="0.55"
                    strokeWidth="1.25"
                />
                <circle
                    cx="24"
                    cy="24"
                    r="10"
                    stroke="var(--color-background)"
                    strokeOpacity="0.3"
                    strokeWidth="0.75"
                />
                {/* Monogram */}
                <path
                    d="M28.8 18.6c-.9-1.5-2.5-2.3-4.6-2.3-2.9 0-5 1.9-5 4.9v5.6c0 3 2.1 4.9 5 4.9 2.1 0 3.7-.8 4.6-2.3"
                    stroke="var(--color-background)"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            </svg>
        </span>
    );
}
