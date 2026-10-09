import Link from "next/link";
import {
    ArrowRight,
    Boxes,
    Cpu,
    Fingerprint,
    GitBranch,
    KeyRound,
    ScrollText,
    ShieldCheck,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SealMark } from "./seal-mark";
import { VersionLedger } from "./version-ledger";
import { AccessMatrix, TokenCard } from "./access-cards";
import {
    EnvironmentPlanesIllustration,
    HairlineField,
    KeyWrappingIllustration,
    VersionDeckIllustration,
    WaxSealIllustration,
} from "./illustrations";

/**
 * Keyframes ship with the landing page rather than the global stylesheet, so the
 * motion is only downloaded by visitors who load this page. Everything is
 * disabled for anyone who prefers reduced motion.
 */
const STYLES = `
@keyframes seal-rise {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes seal-ring {
  0% { opacity: 0.8; transform: scale(1); }
  70% { opacity: 0; transform: scale(1.4); }
  100% { opacity: 0; transform: scale(1.4); }
}
@keyframes seal-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
@keyframes seal-sweep {
  0% { transform: translateX(-100%); }
  55%, 100% { transform: translateX(220%); }
}
@keyframes seal-drift {
  0%, 100% { opacity: 0.35; transform: translate3d(0,0,0) scale(1); }
  50% { opacity: 0.6; transform: translate3d(3%, -4%, 0) scale(1.12); }
}
@keyframes seal-caret {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@keyframes seal-slide {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
@keyframes seal-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
@media (prefers-reduced-motion: reduce) {
  .seal-motion, .seal-motion * { animation: none !important; }
}
`;

/** Decorative corner brackets, like an instrument reticle. */
function HudFrame({ className, children }: { className?: string; children: React.ReactNode }) {
    const corners = [
        "top-2 left-2 border-t border-l",
        "top-2 right-2 border-t border-r",
        "bottom-2 left-2 border-b border-l",
        "bottom-2 right-2 border-b border-r",
    ] as const;

    return (
        <div className={`relative ${className ?? ""}`}>
            {corners.map((position) => (
                <span
                    key={position}
                    aria-hidden
                    className={`pointer-events-none absolute h-4 w-4 border-current/40 ${position}`}
                />
            ))}
            {children}
        </div>
    );
}

export function LandingPage({ dashboardHref }: { dashboardHref: string }) {
    const signedIn = dashboardHref !== "/login";

    return (
        <div className="seal-motion relative min-h-screen overflow-x-hidden bg-background text-foreground">
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />

            <SiteNav dashboardHref={dashboardHref} signedIn={signedIn} />

            <main>
                <Banner dashboardHref={dashboardHref} signedIn={signedIn} />
                <Ticker />
                <Capabilities />
                <Sequence />
                <AccessSection />
                <Cryptography />
                <Faq />
                <ClosingCta dashboardHref={dashboardHref} signedIn={signedIn} />
            </main>

            <SiteFooter dashboardHref={dashboardHref} signedIn={signedIn} />
        </div>
    );
}

/* ------------------------------------------------------------------- Nav */

function SiteNav({ dashboardHref, signedIn }: { dashboardHref: string; signedIn: boolean }) {
    return (
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-2xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
                <Link href="/" className="group flex items-center gap-2.5">
                    <SealMark className="h-8 w-8 transition-transform duration-500 group-hover:scale-110" />
                    <span className="text-lg font-bold tracking-tight">Seal</span>
                    <span className="hidden font-mono text-[10px] text-muted-foreground/50 sm:inline">
                        // vault
                    </span>
                </Link>

                <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
                    <a href="#capabilities" className="transition-colors hover:text-foreground">
                        Capabilities
                    </a>
                    <a href="#access" className="transition-colors hover:text-foreground">
                        Access
                    </a>
                    <a href="#cryptography" className="transition-colors hover:text-foreground">
                        Cryptography
                    </a>
                    <a href="#faq" className="transition-colors hover:text-foreground">
                        FAQ
                    </a>
                </nav>

                <Button asChild size="sm" className="font-medium">
                    <Link href={dashboardHref}>
                        {signedIn ? "Open vault" : "Get started"}
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                </Button>
            </div>
        </header>
    );
}

/* ---------------------------------------------------------------- Banner */

function Banner({ dashboardHref, signedIn }: { dashboardHref: string; signedIn: boolean }) {
    return (
        <section className="relative isolate overflow-hidden border-b border-border/60">
            {/* Hairline field */}
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 opacity-70">
                <HairlineField />
            </div>

            {/* Wax seal, large and faint, centred behind the masthead */}
            <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[150vh] w-[150vh] -translate-x-1/2 -translate-y-1/2 animate-[seal-drift_34s_ease-in-out_infinite]"
            >
                <WaxSealIllustration className="opacity-[0.12]" />
            </div>

            {/* Instrument grid */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-30"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
                    backgroundSize: "80px 80px",
                    maskImage: "radial-gradient(60% 50% at 50% 40%, black, transparent 80%)",
                    WebkitMaskImage: "radial-gradient(60% 50% at 50% 40%, black, transparent 80%)",
                }}
            />

            {/* Scanlines */}
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 opacity-[0.03]"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(to bottom, var(--color-foreground) 0 1px, transparent 1px 3px)",
                }}
            />

            <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
                {/* Centred masthead */}
                <div className="flex flex-col items-center pt-16 pb-12 text-center sm:pt-28 sm:pb-14">
                    <div
                        className="animate-[seal-rise_0.6s_ease-out_both] inline-flex max-w-full flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-full border border-border/60 bg-background/60 px-3.5 py-1 font-mono text-[11px] text-muted-foreground backdrop-blur-sm"
                        style={{ animationDelay: "0ms" }}
                    >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground animate-[seal-pulse_2.4s_ease-in-out_infinite]" />
                        <span className="text-foreground/80">all systems nominal</span>
                        <span className="hidden text-muted-foreground/40 sm:inline">·</span>
                        <span className="hidden sm:inline">envelope encryption</span>
                    </div>

                    <h1
                        className="animate-[seal-rise_0.8s_ease-out_both] mt-8 max-w-5xl text-4xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl xl:text-8xl"
                        style={{ animationDelay: "80ms" }}
                    >
                        Secrets with a memory.
                    </h1>

                    <p
                        className="animate-[seal-rise_0.8s_ease-out_both] mt-7 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
                        style={{ animationDelay: "160ms" }}
                    >
                        Every value versioned. Every change attributed. A bad rotation undone in a single click —
                        without opening a{" "}
                        <code className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-sm text-foreground">
                            .env
                        </code>{" "}
                        file ever again.
                    </p>

                    <div
                        className="animate-[seal-rise_0.8s_ease-out_both] mt-10 flex flex-wrap items-center justify-center gap-3"
                        style={{ animationDelay: "240ms" }}
                    >
                        <Button asChild size="lg" className="font-medium">
                            <Link href={dashboardHref}>
                                {signedIn ? "Open your vault" : "Start free"}
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                        {signedIn ? (
                            <Button asChild size="lg" variant="outline" className="font-medium">
                                <Link href="/account/devices">Authorized devices</Link>
                            </Button>
                        ) : (
                            <Button asChild size="lg" variant="outline" className="font-medium">
                                <Link href="/login">Sign in</Link>
                            </Button>
                        )}
                    </div>

                    <div
                        className="animate-[seal-rise_0.8s_ease-out_both] mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-[11px] text-muted-foreground/60"
                        style={{ animationDelay: "320ms" }}
                    >
                        <span>append-only history</span>
                        <span>one-click rollback</span>
                        <span>read-only tokens</span>
                    </div>
                </div>

                {/* Full-width instrument band */}
                <div className="relative pb-16 sm:pb-20">
                    <div
                        aria-hidden
                        className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-foreground/20 to-transparent"
                    />
                    <div className="grid items-start gap-4 pt-8 sm:pt-10 lg:grid-cols-[1fr_1.35fr_1fr]">
                        <TokenCard className="w-full animate-[seal-rise_0.8s_ease-out_both]" />
                        <HudFrame className="animate-[seal-rise_0.8s_ease-out_both]">
                            <VersionLedger />
                        </HudFrame>
                        <AccessMatrix className="w-full animate-[seal-rise_0.8s_ease-out_both]" />
                    </div>
                </div>
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------- Ticker */

const TICKER_ITEMS = [
    "append-only history",
    "one-click rollback",
    "per-environment permissions",
    "read-only service tokens",
    "envelope encryption",
    "named audit trail",
    "conflict detection",
    "bulk .env import",
];

function Ticker() {
    const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
    return (
        <div className="relative overflow-hidden border-b border-border/60 bg-muted/20 py-3.5">
            <div className="flex w-max animate-[seal-slide_40s_linear_infinite] items-center gap-10">
                {doubled.map((item, index) => (
                    <span
                        key={`${item}-${index}`}
                        className="flex items-center gap-10 whitespace-nowrap font-mono text-xs text-muted-foreground/60"
                    >
                        <span className="h-1 w-1 rounded-full bg-foreground/40" />
                        {item}
                    </span>
                ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-28 bg-gradient-to-r from-background to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-28 bg-gradient-to-l from-background to-transparent" />
        </div>
    );
}

/* ----------------------------------------------------------- Capabilities */

const FEATURES = [
    {
        icon: GitBranch,
        title: "Append-only history",
        body: "Every write becomes a version. Rollback appends a new one carrying the old value, so nothing is destroyed and every mistake stays reversible.",
    },
    {
        icon: Users,
        title: "Per-environment permissions",
        body: "Owner, admin, editor and viewer set the baseline. Any single environment can then be hidden entirely, capped at read, or opened up to write.",
    },
    {
        icon: KeyRound,
        title: "Scoped read-only tokens",
        body: "A service token reads exactly one environment. It cannot write, cannot mint further tokens, and cannot reach anything else. Expiry and IP allowlists included.",
    },
    {
        icon: ScrollText,
        title: "Audit trail with names",
        body: "Reads, writes, rollbacks and token changes are recorded with the actor, their IP and the payload, filterable by action or by who acted.",
    },
    {
        icon: Fingerprint,
        title: "Concurrent edit detection",
        body: "Two people editing the same key produces a visible conflict instead of a silent overwrite, and overwriting becomes a deliberate choice.",
    },
    {
        icon: Boxes,
        title: "Bulk import that reads .env",
        body: "Drop in an environment file. Comments and quoting are handled, keys validated, and binary content rejected by inspecting bytes rather than extension.",
    },
];

function Capabilities() {
    return (
        <section id="capabilities" className="py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <SectionHeading
                    index="01"
                    eyebrow="Capabilities"
                    title="The parts around the value are the parts that hurt"
                    body="Storage is table stakes. History, attribution and reversibility are what actually cost you an incident when they are missing."
                />

                <div className="mt-6 flex justify-center">
                    <div className="w-full max-w-2xl opacity-80">
                        <VersionDeckIllustration />
                    </div>
                </div>

                <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 md:grid-cols-2 lg:grid-cols-3">
                    {FEATURES.map((feature, index) => (
                        <article
                            key={feature.title}
                            className="group animate-[seal-rise_0.6s_ease-out_both] bg-background p-6 transition-colors hover:bg-muted/40"
                            style={{ animationDelay: `${index * 60}ms` }}
                        >
                            <div className="flex items-center justify-between">
                                <feature.icon className="h-5 w-5" />
                                <span className="font-mono text-[10px] text-muted-foreground/40">
                                    {String(index + 1).padStart(2, "0")}
                                </span>
                            </div>
                            <h3 className="mt-4 font-semibold">{feature.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* -------------------------------------------------------------- Sequence */

const STEPS = [
    {
        icon: Users,
        title: "Create a workspace",
        body: "Projects arrive with Development, Staging and Production already provisioned.",
    },
    {
        icon: KeyRound,
        title: "Invite and scope",
        body: "Choose the environments this person should reach, and whether each is hidden, read-only or writable.",
    },
    {
        icon: ShieldCheck,
        title: "Grant a token",
        body: "They generate a read-only token for the one environment their application needs, with an expiry if wanted.",
    },
    {
        icon: Cpu,
        title: "Ship and observe",
        body: "The app reads secrets at runtime. Every read and every change lands in an audit trail with a name attached.",
    },
];

function Sequence() {
    return (
        <section id="how" className="border-y border-border/60 bg-muted/15 py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <SectionHeading
                    index="02"
                    eyebrow="Sequence"
                    title="Four steps, then it is simply infrastructure"
                    body="No key ceremony to run, and nothing for a teammate to install before they can read values they are already trusted with."
                />

                <div className="relative mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                    <div
                        aria-hidden
                        className="absolute left-0 right-0 top-6 hidden h-px opacity-40 lg:block"
                        style={{
                            backgroundImage: "linear-gradient(to right, currentColor 50%, transparent 0%)",
                            backgroundSize: "12px 1px",
                        }}
                    />
                    {STEPS.map((step, index) => (
                        <div
                            key={step.title}
                            className="relative animate-[seal-rise_0.6s_ease-out_both]"
                            style={{ animationDelay: `${index * 90}ms` }}
                        >
                            <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-background">
                                <step.icon className="h-5 w-5" />
                            </span>
                            <h3 className="mt-5 font-semibold">{step.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------- Access */

const ACCESS_POINTS = [
    "A contractor ships to staging without ever seeing production.",
    "A viewer holds a token for their own app without gaining write access.",
    "A project nobody can reach disappears from the dashboard entirely.",
    "Permissions can be tightened or widened later, not frozen at invite time.",
    "Removing someone revokes the credentials they created in the same action.",
];

function AccessSection() {
    return (
        <section id="access" className="py-20 sm:py-24">
            <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-2">
                <div>
                    <SectionHeading
                        index="03"
                        align="left"
                        eyebrow="Access"
                        title="Hand over the keys, not the whole vault"
                        body="Invite someone, then choose the environments they actually need. An override can hide an environment completely, cap it at read, or grant write — per person, per project, per environment."
                    />
                    <ul className="mt-9 space-y-4">
                        {ACCESS_POINTS.map((point) => (
                            <li key={point} className="flex gap-3 text-sm">
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                                <span className="text-muted-foreground">{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="relative">
                    <HudFrame>
                        <div className="rounded-xl border border-border/60 bg-card/40 p-4 backdrop-blur-sm">
                            <EnvironmentPlanesIllustration />
                        </div>
                    </HudFrame>
                </div>
            </div>
        </section>
    );
}

/* ---------------------------------------------------------- Cryptography */

const CRYPTO_STEPS = [
    {
        title: "A fresh key per write",
        body: "Each version is encrypted by its own randomly generated data key, so one compromised key exposes exactly one version and nothing else.",
    },
    {
        title: "Wrapped by a master key",
        body: "That data key is sealed with the current master key and stored beside the value. The master key itself never touches your secrets.",
    },
    {
        title: "Rotated without rewriting",
        body: "Rotating only affects future writes. Older versions stay readable because each carries the key that wrapped it.",
    },
];

function Cryptography() {
    return (
        <section id="cryptography" className="border-y border-border/60 bg-muted/15 py-20 sm:py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6">
                <SectionHeading
                    index="04"
                    eyebrow="Cryptography"
                    title="Envelope encryption, and where the keys actually live"
                    body="The shape of the scheme matters more than the algorithm name: your secrets are never encrypted by a long-lived shared key, and rotation never means re-encrypting your history."
                />

                <div className="mt-10 flex justify-center">
                    <div className="w-full max-w-xl opacity-90">
                        <KeyWrappingIllustration />
                    </div>
                </div>

                <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 md:grid-cols-3">
                    {CRYPTO_STEPS.map((step, index) => (
                        <div
                            key={step.title}
                            className="animate-[seal-rise_0.6s_ease-out_both] bg-background p-6"
                            style={{ animationDelay: `${index * 90}ms` }}
                        >
                            <span className="font-mono text-xs text-muted-foreground/50">
                                {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3 className="mt-3 font-semibold">{step.title}</h3>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------------- FAQ */

const FAQS = [
    {
        q: "Does rolling back destroy the version I rolled back from?",
        a: "No. History is append-only. Restoring version 3 while on version 7 writes version 8 holding version 3's value, so the whole chain stays intact and the move remains auditable.",
    },
    {
        q: "Can a service token write secrets?",
        a: "No. A token is bound to a single environment and can only read it. It cannot write, cannot reach another environment, and cannot mint further tokens.",
    },
    {
        q: "What happens when I remove a teammate?",
        a: "Their environment overrides are deleted and every service token they created is revoked in the same transaction, so credentials do not outlive the access that justified them.",
    },
    {
        q: "Can I change what someone can reach after inviting them?",
        a: "Yes. Permissions are editable from the members page at any point, and the change is recorded in the audit trail.",
    },
    {
        q: "What happens if the API is unreachable?",
        a: "Signed-in areas fail closed. You are redirected to sign in rather than being shown a page that cannot load any of its own data.",
    },
];

function Faq() {
    return (
        <section id="faq" className="py-20 sm:py-24">
            <div className="mx-auto max-w-3xl px-4 sm:px-6">
                <SectionHeading
                    index="05"
                    eyebrow="Questions"
                    title="The things people actually ask"
                    body="Answered the way the system behaves, not the way a brochure would."
                />
                <div className="mt-12 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card/30">
                    {FAQS.map((item) => (
                        <details key={item.q} className="group px-5">
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-sm font-medium">
                                {item.q}
                                <span className="shrink-0 font-mono text-lg leading-none transition-transform duration-300 group-open:rotate-45">
                                    +
                                </span>
                            </summary>
                            <p className="pb-5 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* ------------------------------------------------------------ Closing CTA */

function ClosingCta({ dashboardHref, signedIn }: { dashboardHref: string; signedIn: boolean }) {
    return (
        <section className="relative overflow-hidden border-t border-border/60 py-20 sm:py-28">
            <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]">
                <HairlineField />
            </div>
            <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
                <SealMark className="mx-auto h-14 w-14" animated />
                <h2 className="mt-9 text-3xl font-bold tracking-tight text-balance sm:text-5xl">
                    Stop editing{" "}
                    <code className="rounded border border-border/60 bg-muted/40 px-2 py-1 font-mono text-[0.8em]">
                        .env
                    </code>{" "}
                    files
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-muted-foreground text-pretty">
                    Create a workspace, invite your team, choose who reaches which environment, and hand your
                    application a read-only token you can expire or revoke at any moment.
                </p>
                <div className="mt-9 flex flex-wrap justify-center gap-3">
                    <Button asChild size="lg" className="font-medium">
                        <Link href={dashboardHref}>
                            {signedIn ? "Open your vault" : "Create your workspace"}
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}

/* ---------------------------------------------------------------- Footer */

function SiteFooter({ dashboardHref, signedIn }: { dashboardHref: string; signedIn: boolean }) {
    const columns = [
        {
            heading: "Platform",
            links: [
                { label: "Capabilities", href: "#capabilities" },
                { label: "Sequence", href: "#how" },
                { label: "Access model", href: "#access" },
                { label: "Cryptography", href: "#cryptography" },
            ],
        },
        {
            heading: "Reference",
            links: [
                { label: "Questions", href: "#faq" },
                { label: "Service tokens", href: "#capabilities" },
                { label: "Audit trail", href: "#capabilities" },
                { label: "Version history", href: "#capabilities" },
            ],
        },
        {
            heading: "Account",
            links: [
                { label: "Open vault", href: dashboardHref },
                { label: "Authorized devices", href: "/account/devices" },
                { label: "Sign in", href: "/login" },
                {
                    label: signedIn ? "Create account" : "Accept invitation",
                    href: signedIn ? "/signup" : "/invitations/accept",
                },
            ],
        },
    ];

    return (
        <footer className="relative border-t border-border/60 bg-muted/15">
            <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:pr-8">
                        <Link href="/" className="flex items-center gap-2.5">
                            <SealMark className="h-8 w-8" />
                            <span className="text-lg font-bold tracking-tight">Seal</span>
                        </Link>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                            A developer secrets vault. Versioned, encrypted per version, and reversible — so a
                            rotated key never becomes a lost afternoon.
                        </p>
                        <p className="mt-5 flex items-center gap-2 font-mono text-[11px] text-muted-foreground/60">
                            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
                            all systems nominal
                        </p>
                    </div>

                    {columns.map((column) => (
                        <div key={column.heading}>
                            <h3 className="font-mono text-[11px] tracking-widest text-muted-foreground/60 uppercase">
                                {column.heading}
                            </h3>
                            <ul className="mt-4 space-y-2.5">
                                {column.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-12 flex flex-col gap-3 border-t border-border/60 pt-6 text-xs text-muted-foreground/60 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-mono">© {new Date().getFullYear()} Seal · developer secrets vault</p>
                    <p className="font-mono">envelope encryption · append-only history · read-only tokens</p>
                </div>
            </div>
        </footer>
    );
}

/* ------------------------------------------------------------ Shared bits */

function SectionHeading({
    index,
    eyebrow,
    title,
    body,
    align = "center",
}: {
    index: string;
    eyebrow: string;
    title: string;
    body: string;
    align?: "center" | "left";
}) {
    return (
        <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
            <p className="flex items-center gap-3 font-mono text-xs tracking-widest text-muted-foreground uppercase">
                {align === "left" && <span className="text-foreground">{index}</span>}
                {eyebrow}
                {align === "center" && <span className="text-foreground">{index}</span>}
            </p>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h2>
            <p className="mt-4 text-muted-foreground text-pretty">{body}</p>
        </div>
    );
}
