import { cn } from "cn";

/**
 * Illustrations for the landing page.
 *
 * A deliberately strict system, because the previous set read as clip-art
 * diagrams: few elements, heavy strokes, two weights only, and one solid shape
 * per illustration carrying the idea. Detail was what made them look amateur.
 *
 * Everything uses `currentColor` at varying opacity, so the set is monochrome
 * and inherits the colour of its surroundings. None carry text; labels live in
 * the markup beside them, because type at illustration scale stops being legible
 * long before it stops being decorative. All are decorative, hence aria-hidden.
 */

const line = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

/** Closed Catmull-Rom curve through the points, converted to cubic beziers. */
function smoothClosedPath(points: [number, number][]): string {
    const count = points.length;
    // The modulo keeps the index in range for a closed curve, so the assertion
    // is always safe; it just satisfies noUncheckedIndexedAccess.
    const at = (index: number): [number, number] => points[(index + count) % count]!;
    const round = (value: number) => value.toFixed(2);

    const first = at(0);
    let path = `M ${round(first[0])} ${round(first[1])}`;
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

// Deterministic, so server and client render the same silhouette. Summed sine
// waves give a hand-pressed edge rather than a machined circle.
const WAX_OUTLINE = smoothClosedPath(
    Array.from({ length: 16 }, (_, index) => {
        const angle = (index / 16) * Math.PI * 2 - Math.PI / 2;
        const radius = 200 + 15 * Math.sin(3 * angle) + 8 * Math.sin(5 * angle + 0.8);
        return [256 + radius * Math.cos(angle), 256 + radius * Math.sin(angle)] as [number, number];
    }),
);

/**
 * A wax seal. Three marks only: the wax, a pressed ring, and the keyhole. The
 * weight of the idea comes from the silhouette and the solid keyhole, not from
 * ornament.
 */
export function WaxSealIllustration({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 512 512"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            {/* Wax body, filled so the silhouette carries at a glance */}
            <path d={WAX_OUTLINE} fill="currentColor" fillOpacity="0.12" stroke="none" />
            <path d={WAX_OUTLINE} strokeOpacity="0.7" strokeWidth="3" />

            {/* Pressed ring */}
            <circle cx="256" cy="256" r="142" strokeOpacity="0.45" strokeWidth="2" />

            {/* Keyhole: solid, because it is the one thing worth seeing */}
            <g fill="currentColor" stroke="none">
                <circle cx="256" cy="232" r="30" fillOpacity="0.9" />
                <path d="M234 254 h44 l-10 74 h-24 Z" fillOpacity="0.9" />
            </g>
        </svg>
    );
}

/**
 * Version history as a deck of four cards with a fifth lifted clear above them.
 * The lift is the whole idea: a new version is added to the stack, it does not
 * replace what is already there.
 */
export function VersionDeckIllustration({ className }: { className?: string }) {
    const deck = [0, 1, 2];
    const cardWidth = 250;
    const cardHeight = 62;
    const left = (400 - cardWidth) / 2;

    return (
        <svg
            viewBox="0 0 400 300"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            {/* The stack. Each card is progressively fainter as it recedes. */}
            {deck.map((index) => (
                <rect
                    key={index}
                    x={left + index * 6}
                    y={210 - index * 14}
                    width={cardWidth - index * 12}
                    height={cardHeight}
                    rx="14"
                    opacity={0.28 + index * 0.16}
                    strokeWidth="2.5"
                />
            ))}

            {/* The appended version, lifted clear and fully opaque. */}
            <g>
                <rect x={left} y="34" width={cardWidth} height={cardHeight} rx="14" strokeWidth="3" />
                <path d={`M${left + 26} 58 H${left + 150}`} opacity="0.55" strokeWidth="3" />
                <path d={`M${left + 26} 74 H${left + 96}`} opacity="0.3" strokeWidth="3" />
            </g>

            {/* A single connector, not a diagram of one. */}
            <path
                d={`M200 122 V${210 - 2 * 14 - 12}`}
                opacity="0.4"
                strokeWidth="2.5"
                strokeDasharray="2 10"
                strokeLinecap="round"
            />
            <path d="M192 172 L200 160 L208 172" opacity="0.55" strokeWidth="2.5" {...line} />
        </svg>
    );
}

/**
 * Access as nested plates. The outermost plate is faded and offset, which is what
 * an environment you cannot reach looks like: still there, simply not yours.
 */
export function EnvironmentPlanesIllustration({ className }: { className?: string }) {
    const plates = [
        { inset: 0, opacity: 1 },
        { inset: 26, opacity: 0.62 },
        { inset: 52, opacity: 0.24 },
    ];

    return (
        <svg
            viewBox="0 0 400 300"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            {plates.map((plate, index) => {
                const x = 56 + plate.inset;
                const width = 288 - plate.inset;
                const y = 60 + index * 62;
                return (
                    <g key={plate.inset} opacity={plate.opacity}>
                        <rect x={x} y={y} width={width} height="48" rx="12" strokeWidth="2.5" />
                        {/* A solid cap marks the permission on each plate. */}
                        <rect
                            x={x}
                            y={y}
                            width="7"
                            height="48"
                            rx="3.5"
                            fill="currentColor"
                            stroke="none"
                            fillOpacity={plate.opacity === 0.24 ? 0.5 : 1}
                        />
                    </g>
                );
            })}

            {/* Identity, holding the stack. */}
            <circle cx="200" cy="26" r="15" strokeWidth="2.5" opacity="0.8" />
            <circle cx="200" cy="26" r="5" fill="currentColor" stroke="none" opacity="0.9" />
        </svg>
    );
}

/**
 * Key wrapping as concentric rings: the secret at the centre, the master key
 * furthest out, each ring bound to the next by a single solid node. Four rings
 * and four nodes is all it needs.
 */
export function KeyWrappingIllustration({ className }: { className?: string }) {
    const rings = [
        { r: 170, opacity: 0.25, node: 20 },
        { r: 124, opacity: 0.45, node: 108 },
        { r: 78, opacity: 0.68, node: 196 },
        { r: 40, opacity: 0.9, node: 320 },
    ];

    return (
        <svg
            viewBox="0 0 400 400"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            <g transform="translate(200 200)">
                {rings.map((ring) => (
                    <circle key={ring.r} r={ring.r} opacity={ring.opacity} strokeWidth="2.5" />
                ))}

                {rings.map((ring) => {
                    const rad = (ring.node * Math.PI) / 180;
                    return (
                        <circle
                            key={ring.node}
                            cx={ring.r * Math.cos(rad)}
                            cy={ring.r * Math.sin(rad)}
                            r="7"
                            fill="currentColor"
                            stroke="none"
                            opacity={Math.min(1, ring.opacity + 0.25)}
                        />
                    );
                })}

                {/* The secret. Solid, and the only fully opaque mark. */}
                <circle r="15" fill="currentColor" stroke="none" />
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
