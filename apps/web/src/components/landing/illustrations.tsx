import { cn } from "cn";

/**
 * Illustrations for the landing page.
 *
 * Everything is drawn with `currentColor` at varying opacities, so the set is
 * strictly monochrome and inherits the colour of whatever surrounds it. None of
 * them carry text: labels live in the markup next to them, because type set at
 * this size stops being legible long before it stops being decorative.
 *
 * All are decorative, so each is `aria-hidden`.
 */

/** Closed Catmull-Rom curve through the points, converted to cubic beziers. */
function smoothClosedPath(points: [number, number][]): string {
    const count = points.length;
    const at = (index: number) => points[(index + count) % count];
    const round = (value: number) => value.toFixed(2);

    let path = `M ${round(points[0][0])} ${round(points[0][1])}`;
    for (let i = 0; i < count; i++) {
        const p0 = at(i - 1);
        const p1 = at(i);
        const p2 = at(i + 1);
        const p3 = at(i + 2);
        path += ` C ${round(p1[0] + (p2[0] - p0[0]) / 6)} ${round(p1[1] + (p2[1] - p0[1]) / 6)}`;
        path += ` ${round(p2[0] - (p3[0] - p1[0]) / 6)} ${round(p2[1] - (p3[1] - p1[1]) / 6)}`;
        path += ` ${round(p2[0])} ${round(p2[1])}`;
    }
    return `${path} Z`;
}

// Deterministic, so the server and client always render the same silhouette.
// Summed sine waves give an organic, hand-pressed outline rather than a circle.
const WAX_OUTLINE = smoothClosedPath(
    Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2 - Math.PI / 2;
        const radius =
            198 + 13 * Math.sin(3 * angle) + 7 * Math.sin(5 * angle + 0.8) + 4 * Math.sin(8 * angle + 2.1);
        return [256 + radius * Math.cos(angle), 256 + radius * Math.sin(angle)] as [number, number];
    }),
);

/**
 * A wax seal pressed into the page. The outline is a smooth blob rather than a
 * circle, and the inner rings are drawn twice with a one-pixel offset so they
 * read as debossed rather than printed.
 */
export function WaxSealIllustration({ className }: { className?: string }) {
    const rings = [158, 132, 106];

    return (
        <svg
            viewBox="0 0 512 512"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            {/* Bloom around the stamp */}
            <circle cx="256" cy="256" r="248" opacity="0.04" fill="currentColor" stroke="none" />

            {/* The wax itself */}
            <path d={WAX_OUTLINE} fill="currentColor" fillOpacity="0.13" stroke="none" />
            <path d={WAX_OUTLINE} strokeOpacity="0.55" strokeWidth="1.5" />

            {/* Debossed rings: highlight above, shadow below */}
            {rings.map((radius, index) => (
                <g key={radius}>
                    <circle
                        cx={255}
                        cy={255}
                        r={radius}
                        stroke="var(--color-background)"
                        strokeOpacity={0.35 - index * 0.06}
                        strokeWidth="1.25"
                    />
                    <circle
                        cx={257}
                        cy={257}
                        r={radius}
                        strokeOpacity={0.4 - index * 0.08}
                        strokeWidth="1.25"
                    />
                </g>
            ))}

            {/* Pressed keyhole, debossed the same way */}
            <g>
                <circle cx="255" cy="228" r="27" stroke="var(--color-background)" strokeOpacity="0.4" strokeWidth="1.5" />
                <circle cx="257" cy="230" r="27" strokeOpacity="0.75" strokeWidth="1.5" />
                <path
                    d="M240 251 L274 251 L264 312 L250 312 Z"
                    stroke="var(--color-background)"
                    strokeOpacity="0.4"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <path
                    d="M242 253 L276 253 L266 314 L252 314 Z"
                    strokeOpacity="0.75"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
            </g>

            {/* Press flecks, as if the die was not perfectly clean */}
            <g strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round">
                {[
                    [128, 150],
                    [372, 176],
                    [150, 372],
                    [386, 348],
                    [256, 96],
                    [214, 424],
                ].map(([x, y]) => (
                    <line key={`${x}-${y}`} x1={x - 5} y1={y} x2={x + 5} y2={y} />
                ))}
            </g>
        </svg>
    );
}

/**
 * Version history as a physical deck. Restoring an old value does not rewind the
 * deck: a new card is added that carries the old contents, which is what the
 * dashed path shows.
 */
export function VersionDeckIllustration({ className }: { className?: string }) {
    const cards = [
        { y: 118, opacity: 1, lift: -74 },
        { y: 208, opacity: 0.62, lift: 0 },
        { y: 250, opacity: 0.48, lift: 0 },
        { y: 292, opacity: 0.36, lift: 0 },
    ];

    return (
        <svg
            viewBox="0 0 420 380"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            {/* The deck */}
            {cards.slice(1).map((card, index) => (
                <rect
                    key={card.y}
                    x="112"
                    y={card.y}
                    width="196"
                    height="62"
                    rx="10"
                    opacity={card.opacity}
                    strokeWidth="1.5"
                />
            ))}

            {/* Ghost of the version being restored, still in the deck */}
            <g opacity="0.5">
                <rect x="112" y="208" width="196" height="62" rx="10" strokeWidth="1.5" strokeDasharray="4 4" />
            </g>

            {/* Dashed path from the ghost up to the new card */}
            <path
                d="M210 208 C 210 150, 210 150, 210 118"
                opacity="0.45"
                strokeWidth="1.5"
                strokeDasharray="3 5"
                strokeLinecap="round"
            />
            <path d="M205 128 L210 117 L215 128" opacity="0.6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

            {/* The newly appended card, lifted clear of the deck */}
            <g>
                <rect x="112" y="44" width="196" height="62" rx="10" strokeWidth="2" />
                {/* Contents echoed from the restored version */}
                <path d="M134 68 H236" opacity="0.5" strokeWidth="2" strokeLinecap="round" />
                <path d="M134 84 H206" opacity="0.32" strokeWidth="2" strokeLinecap="round" />
            </g>

            {/* Tick markers along the left edge */}
            <line x1="92" y1="75" x2="92" y2="315" opacity="0.2" strokeWidth="1" />
            {[75, 165, 239, 281, 323].map((y, index) => (
                <circle
                    key={y}
                    cx="92"
                    cy={y}
                    r={index === 0 ? 4 : 2.5}
                    opacity={index === 0 ? 0.8 : 0.3}
                    strokeWidth="1.25"
                />
            ))}

            {/* Page edges to read as thickness */}
            <path d="M308 118 h10 a4 4 0 0 1 4 4 v190" opacity="0.18" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
    );
}

/**
 * Environments as stacked planes. The denied one is dashed, faded and pushed
 * out of line, which is exactly what a hidden environment looks like to someone
 * who has no access to it.
 */
export function EnvironmentPlanesIllustration({ className }: { className?: string }) {
    const planes = [
        { indent: 0, opacity: 0.9, dashed: false, offsetY: 0 },
        { indent: 34, opacity: 0.6, dashed: false, offsetY: 96 },
        { indent: 68, opacity: 0.22, dashed: true, offsetY: 214 },
    ];

    return (
        <svg
            viewBox="0 0 420 340"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            {/* Access rail */}
            <path d="M52 44 V268" opacity="0.18" strokeWidth="1" strokeDasharray="2 6" />

            {planes.map((plane, index) => {
                const x = 84 + plane.indent;
                const y = plane.offsetY;
                return (
                    <g key={plane.offsetY} opacity={plane.opacity}>
                        {/* Connector from the rail */}
                        <path
                            d={`M52 ${y + 40} C 66 ${y + 40}, 68 ${y + 40}, ${x} ${y + 40}`}
                            opacity="0.5"
                            strokeWidth="1.25"
                            strokeDasharray={plane.dashed ? "2 5" : undefined}
                        />
                        {/* The plane */}
                        <rect
                            x={x}
                            y={y}
                            width={300 - plane.indent}
                            height="80"
                            rx="12"
                            strokeWidth="1.75"
                            strokeDasharray={plane.dashed ? "5 5" : undefined}
                        />
                        {/* Access indicator */}
                        <circle cx={x + 30} cy={y + 40} r="9" strokeWidth="1.5" />
                        {plane.dashed ? (
                            <path d={`M${x + 26} ${y + 36} l8 8 M${x + 34} ${y + 36} l-8 8`} strokeWidth="1.5" strokeLinecap="round" />
                        ) : (
                            <circle cx={x + 30} cy={y + 40} r="4" fill="currentColor" stroke="none" />
                        )}
                        {/* Content lines */}
                        <path
                            d={`M${x + 54} ${y + 30} H${x + 150}`}
                            opacity="0.55"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <path
                            d={`M${x + 54} ${y + 48} H${x + 120}`}
                            opacity="0.3"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </g>
                );
            })}

            {/* The keyhole that stands in for the person holding the access */}
            <circle cx="52" cy="26" r="11" strokeWidth="1.5" opacity="0.7" />
            <path d="M47 35 h10 l-2 14 h-6 Z" strokeWidth="1.5" opacity="0.7" strokeLinejoin="round" />
        </svg>
    );
}

/**
 * Key wrapping, drawn as nested rings: each layer binds the one inside it, so
 * the secret sits at the centre with the master key furthest out. Reads like
 * growth rings, which is roughly how long-lived a wrapped value tends to be.
 */
export function KeyWrappingIllustration({ className }: { className?: string }) {
    const rings = [
        { r: 176, opacity: 0.22, dash: undefined, width: 1.25 },
        { r: 150, opacity: 0.34, dash: "1 7", width: 2 },
        { r: 124, opacity: 0.5, dash: undefined, width: 1.5 },
        { r: 98, opacity: 0.66, dash: "14 9", width: 2.5 },
        { r: 72, opacity: 0.8, dash: undefined, width: 1.75 },
        { r: 46, opacity: 0.95, dash: "3 6", width: 2 },
    ];

    // Binding points, offset so they never line up radially.
    const bindings = [
        { angle: 18, radius: 163 },
        { angle: 96, radius: 137 },
        { angle: 172, radius: 111 },
        { angle: 248, radius: 85 },
        { angle: 318, radius: 59 },
    ];

    return (
        <svg
            viewBox="0 0 420 420"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            <g transform="translate(210 210)">
                {rings.map((ring) => (
                    <circle
                        key={ring.r}
                        r={ring.r}
                        opacity={ring.opacity}
                        strokeWidth={ring.width}
                        strokeDasharray={ring.dash}
                        strokeLinecap="round"
                    />
                ))}

                {bindings.map((binding) => {
                    const rad = (binding.angle * Math.PI) / 180;
                    const x = binding.radius * Math.cos(rad);
                    const y = binding.radius * Math.sin(rad);
                    return (
                        <g key={binding.angle}>
                            {/* Short heavy arc showing where one ring grips the next */}
                            <path
                                d={`M ${(x - 9).toFixed(2)} ${y.toFixed(2)} A ${binding.radius} ${binding.radius} 0 0 1 ${(x + 9).toFixed(2)} ${y.toFixed(2)}`}
                                opacity="0.9"
                                strokeWidth="3.5"
                                strokeLinecap="round"
                            />
                            <circle cx={x} cy={y} r="3" fill="currentColor" stroke="none" opacity="0.9" />
                        </g>
                    );
                })}

                {/* The secret at the centre */}
                <circle r="13" opacity="0.9" />
                <circle r="4.5" fill="currentColor" stroke="none" opacity="0.95" />
            </g>
        </svg>
    );
}

/** A dot matrix for use as texture behind the banner and closing section. */
export function HairlineField({ className }: { className?: string }) {
    return (
        // Filled, not stroked: these are dots, so the root must not set fill="none".
        <svg aria-hidden className={cn("h-full w-full", className)} fill="currentColor">
            {Array.from({ length: 14 }, (_, row) =>
                Array.from({ length: 30 }, (_, column) => (
                    <circle
                        key={`${row}-${column}`}
                        cx={column * 68 + 30}
                        cy={row * 68 + 30}
                        r="1"
                        opacity={0.05 + ((row + column) % 4) * 0.03}
                    />
                )),
            )}
        </svg>
    );
}
