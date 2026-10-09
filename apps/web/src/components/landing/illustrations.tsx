import { cn } from "cn";

/**
 * Line-art illustrations for the landing page.
 *
 * Everything draws with `currentColor` and varying opacity, so the whole set is
 * strictly monochrome and inherits whatever colour the surrounding text uses.
 * They are decorative, so each is `aria-hidden`.
 */

const stroke = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
};

/** Concentric vault face with calibration ticks and a keyhole. */
export function VaultIllustration({ className }: { className?: string }) {
    const ticks = Array.from({ length: 48 }, (_, index) => index * 7.5);

    return (
        <svg
            viewBox="0 0 400 400"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            {/* Outer ring */}
            <circle cx="200" cy="200" r="186" opacity="0.12" {...stroke} />
            <circle cx="200" cy="200" r="160" opacity="0.2" {...stroke} strokeDasharray="2 10" />

            {/* Calibration ticks, longer every sixth */}
            <g opacity="0.35">
                {ticks.map((angle) => {
                    const long = angle % 45 === 0;
                    const rad = (angle * Math.PI) / 180;
                    const inner = long ? 140 : 150;
                    const outer = 160;
                    return (
                        <line
                            key={angle}
                            x1={200 + inner * Math.cos(rad)}
                            y1={200 + inner * Math.sin(rad)}
                            x2={200 + outer * Math.cos(rad)}
                            y2={200 + outer * Math.sin(rad)}
                            strokeWidth={long ? 1.75 : 1}
                            stroke="currentColor"
                            strokeLinecap="round"
                        />
                    );
                })}
            </g>

            {/* Dial body */}
            <circle cx="200" cy="200" r="132" opacity="0.5" {...stroke} />
            <circle cx="200" cy="200" r="118" opacity="0.18" {...stroke} />

            {/* Radial spokes */}
            <g opacity="0.22" {...stroke}>
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                    const rad = (angle * Math.PI) / 180;
                    return (
                        <line
                            key={angle}
                            x1={200 + 40 * Math.cos(rad)}
                            y1={200 + 40 * Math.sin(rad)}
                            x2={200 + 118 * Math.cos(rad)}
                            y2={200 + 118 * Math.sin(rad)}
                        />
                    );
                })}
            </g>

            {/* Inner hexagon */}
            <path
                d="M200 118 L269 159 L269 241 L200 282 L131 241 L131 159 Z"
                opacity="0.55"
                {...stroke}
                strokeWidth="1.5"
            />
            <path
                d="M200 140 L252 171 L252 229 L200 260 L148 229 L148 171 Z"
                opacity="0.28"
                {...stroke}
            />

            {/* Keyhole */}
            <circle cx="200" cy="188" r="15" opacity="0.85" {...stroke} strokeWidth="1.75" />
            <path d="M200 203 L200 238 M188 226 L212 226" opacity="0.85" {...stroke} strokeWidth="1.75" />

            {/* Corner registration marks */}
            <g opacity="0.4" {...stroke} strokeWidth="1.25">
                <path d="M24 44 L24 24 L44 24" />
                <path d="M376 44 L376 24 L356 24" />
                <path d="M24 356 L24 376 L44 376" />
                <path d="M376 356 L376 376 L356 376" />
            </g>
        </svg>
    );
}

/**
 * Access topology: one person, three projects, and environments switched on or
 * off. Dimmed nodes are the ones hidden from that person.
 */
export function TopologyIllustration({ className }: { className?: string }) {
    const projects = [
        { label: "checkout-api", y: 46, envs: [{ on: true }, { on: true }, { on: false }] },
        { label: "webhooks", y: 150, envs: [{ on: true }, { on: true }, { on: false }] },
        { label: "data-pipeline", y: 254, envs: [{ on: false }, { on: false }, { on: false }] },
    ];

    return (
        <svg
            viewBox="0 0 420 350"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            {/* Identity node on the left */}
            <circle cx="46" cy="175" r="26" opacity="0.7" {...stroke} strokeWidth="1.5" />
            <circle cx="46" cy="175" r="9" opacity="0.9" {...stroke} />
            <path d="M46 136 V124 M38 124 H54" opacity="0.5" {...stroke} />

            {/* Connectors from identity to each project */}
            {projects.map((project) => (
                <g key={project.label}>
                    <path
                        d={`M72 175 C 108 175, 108 ${project.y + 22}, 138 ${project.y + 22}`}
                        opacity={project.envs.some((env) => env.on) ? 0.4 : 0.12}
                        {...stroke}
                        strokeDasharray={project.envs.some((env) => env.on) ? undefined : "3 6"}
                    />
                    {/* Project block */}
                    <rect
                        x="138"
                        y={project.y}
                        width="250"
                        height="66"
                        rx="10"
                        opacity={project.envs.some((env) => env.on) ? 0.45 : 0.15}
                        {...stroke}
                    />
                    <text
                        x="152"
                        y={project.y + 24}
                        fill="currentColor"
                        stroke="none"
                        opacity={project.envs.some((env) => env.on) ? 0.6 : 0.25}
                        fontSize="11"
                        fontFamily="ui-monospace, monospace"
                    >
                        {project.label}
                    </text>
                    {/* Environment nodes */}
                    {project.envs.map((env, index) => (
                        <g key={index} opacity={env.on ? 0.85 : 0.18}>
                            <circle cx={196 + index * 74} cy={project.y + 46} r="13" {...stroke} strokeWidth="1.5" />
                            {env.on ? (
                                <path
                                    d={`M${190 + index * 74} ${project.y + 46} l4 4 l7 -8`}
                                    {...stroke}
                                    strokeWidth="1.75"
                                />
                            ) : (
                                <path
                                    d={`M${192 + index * 74} ${project.y + 42} l8 8 M${200 + index * 74} ${project.y + 42} l-8 8`}
                                    {...stroke}
                                    strokeWidth="1.5"
                                />
                            )}
                        </g>
                    ))}
                </g>
            ))}

            {/* Legend */}
            <g opacity="0.45" {...stroke} strokeWidth="1.25">
                <circle cx="20" cy="322" r="6" />
                <path d="M20 319 v6 M17 322 h6" />
                <line x1="34" y1="322" x2="52" y2="322" opacity="0.4" strokeDasharray="2 4" />
                <text x="60" y="326" fill="currentColor" stroke="none" fontSize="10" fontFamily="ui-monospace, monospace">
                    reachable / denied
                </text>
            </g>
        </svg>
    );
}

/** Envelope encryption: the value wrapped by a data key wrapped by a master key. */
export function EnvelopeIllustration({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 420 260"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            {/* Layer 1: the secret */}
            <g>
                <rect x="24" y="94" width="104" height="72" rx="10" opacity="0.85" {...stroke} strokeWidth="1.5" />
                <path d="M24 118 H128" opacity="0.3" {...stroke} />
                <text x="76" y="136" fill="currentColor" stroke="none" fontSize="10" textAnchor="middle" fontFamily="ui-monospace, monospace" opacity="0.7">
                    value
                </text>
            </g>

            {/* Lock between layers */}
            <g opacity="0.55">
                <rect x="140" y="112" width="34" height="26" rx="5" {...stroke} />
                <path d="M148 112 v-7 a9 9 0 0 1 18 0 v7" {...stroke} />
            </g>

            {/* Layer 2: data key */}
            <g>
                <rect x="186" y="94" width="104" height="72" rx="10" opacity="0.55" {...stroke} strokeWidth="1.5" strokeDasharray="5 4" />
                <text x="238" y="136" fill="currentColor" stroke="none" fontSize="10" textAnchor="middle" fontFamily="ui-monospace, monospace" opacity="0.6">
                    data key
                </text>
                <circle cx="238" cy="112" r="4" {...stroke} opacity="0.7" />
            </g>

            <g opacity="0.55">
                <rect x="302" y="112" width="34" height="26" rx="5" {...stroke} />
                <path d="M310 112 v-7 a9 9 0 0 1 18 0 v7" {...stroke} />
            </g>

            {/* Layer 3: master key */}
            <g>
                <rect x="348" y="94" width="48" height="72" rx="10" opacity="0.3" {...stroke} strokeWidth="1.5" />
                <text
                    x="372"
                    y="136"
                    fill="currentColor"
                    stroke="none"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily="ui-monospace, monospace"
                    opacity="0.5"
                >
                    master
                </text>
            </g>

            {/* Ciphertext flowing out beneath */}
            <g opacity="0.4">
                <path d="M24 196 H396" {...stroke} strokeDasharray="2 6" />
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                    <rect
                        key={index}
                        x={34 + index * 46}
                        y="210"
                        width={index % 3 === 0 ? 34 : 22}
                        height="12"
                        rx="3"
                        opacity={0.3 + (index % 4) * 0.15}
                        {...stroke}
                    />
                ))}
                <text x="24" y="244" fill="currentColor" stroke="none" fontSize="10" fontFamily="ui-monospace, monospace" opacity="0.5">
                    stored ciphertext · never plaintext at rest
                </text>
            </g>
        </svg>
    );
}

/** Append-only history where rollback appends rather than rewinds. */
export function HistoryIllustration({ className }: { className?: string }) {
    const versions = [
        { v: 1, opacity: 0.3 },
        { v: 2, opacity: 0.4 },
        { v: 3, opacity: 0.55 },
        { v: 4, opacity: 0.7, struck: true },
        { v: 5, opacity: 1, highlight: true },
    ];

    return (
        <svg
            viewBox="0 0 420 220"
            aria-hidden
            className={cn("h-full w-full", className)}
            fill="none"
            stroke="currentColor"
        >
            <line x1="40" y1="24" x2="40" y2="196" opacity="0.25" {...stroke} />

            {versions.map((version, index) => {
                const y = 36 + index * 36;
                return (
                    <g key={version.v} opacity={version.opacity}>
                        <circle
                            cx="40"
                            cy={y}
                            r="7"
                            {...stroke}
                            strokeWidth="1.5"
                            fill={version.highlight ? "currentColor" : "none"}
                        />
                        <line x1="56" y1={y} x2="96" y2={y} opacity="0.4" {...stroke} />
                        <rect
                            x="104"
                            y={y - 11}
                            width={version.highlight ? 250 : 180 + index * 18}
                            height="22"
                            rx="6"
                            opacity={version.highlight ? 0.75 : 0.35}
                            {...stroke}
                            strokeDasharray={version.highlight ? undefined : "4 4"}
                        />
                        {version.struck && (
                            <line x1="104" y1={y} x2={104 + 180 + index * 18} y2={y} opacity="0.8" {...stroke} strokeWidth="1.5" />
                        )}
                        <text
                            x="368"
                            y={y + 4}
                            fill="currentColor"
                            stroke="none"
                            fontSize="10"
                            textAnchor="end"
                            fontFamily="ui-monospace, monospace"
                            opacity="0.8"
                        >
                            v{version.v}
                        </text>
                    </g>
                );
            })}

            {/* The rollback arc, drawn as an addition rather than a rewind */}
            <path
                d="M150 180 C 150 208, 320 208, 320 180"
                opacity="0.7"
                {...stroke}
                strokeDasharray="4 4"
                strokeWidth="1.5"
            />
            <path d="M316 186 L320 178 L324 186" opacity="0.7" {...stroke} strokeWidth="1.5" />
            <text x="235" y="216" fill="currentColor" stroke="none" fontSize="10" textAnchor="middle" fontFamily="ui-monospace, monospace" opacity="0.6">
                rollback appends v5 = v3
            </text>
        </svg>
    );
}

/** A repeating hairline pattern used behind banners. */
export function HairlineField({ className }: { className?: string }) {
    return (
        <svg aria-hidden className={cn("h-full w-full", className)} fill="none" stroke="currentColor">
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
