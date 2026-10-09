import Link from "next/link";
import {
    ArrowRight,
    Boxes,
    CheckCircle2,
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

/**
 * Keyframes live here rather than in the global stylesheet so the landing page
 * ships them only on the page that uses them. Motion is suppressed entirely for
 * anyone who has asked for reduced motion.
 */
const STYLES = `
@keyframes seal-rise {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes seal-ring {
  0% { opacity: 0.7; transform: scale(1); }
  70% { opacity: 0; transform: scale(1.35); }
  100% { opacity: 0; transform: scale(1.35); }
}
@keyframes seal-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-7px); }
}
@keyframes seal-sweep {
  0% { transform: translateX(-100%); }
  55%, 100% { transform: translateX(200%); }
}
@keyframes seal-drift {
  0%, 100% { opacity: 0.5; transform: translate3d(0,0,0) scale(1); }
  50% { opacity: 0.85; transform: translate3d(2%, -3%, 0) scale(1.08); }
}
@keyframes seal-caret {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .seal-motion, .seal-motion * { animation: none !important; }
}
`;

export function LandingPage({ dashboardHref }: { dashboardHref: string }) {
    const signedIn = dashboardHref !== "/login";

    return (
        <div className="seal-motion relative min-h-screen overflow-x-hidden bg-background">
            <style dangerouslySetInnerHTML={{ __html: STYLES }} />

            {/* Ambient backdrop */}
            <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute inset-0 bg-[radial-gradient(80rem_50rem_at_50%_-10%,var(--color-primary)/14,transparent_60%)]" />
                <div className="absolute top-1/3 -left-40 h-[34rem] w-[34rem] rounded-full bg-primary/8 blur-3xl animate-[seal-drift_18s_ease-in-out_infinite]" />
                <div className="absolute right-0 bottom-0 h-[28rem] w-[28rem] rounded-full bg-chart-2/8 blur-3xl animate-[seal-drift_22s_ease-in-out_infinite_1.5s]" />
                {/* Fine grid, faded out toward the bottom */}
                <div
                    className="absolute inset-0 opacity-[0.35]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
                        backgroundSize: "64px 64px",
                        maskImage: "radial-gradient(70% 50% at 50% 0%, black, transparent 75%)",
                        WebkitMaskImage: "radial-gradient(70% 50% at 50% 0%, black, transparent 75%)",
                    }}
                />
            </div>

            <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2.5">
                        <SealMark className="h-8 w-8" />
                        <span className="text-lg font-bold tracking-tight">Seal</span>
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
                    </nav>

                    <Button asChild size="sm" className="font-medium">
                        <Link href={dashboardHref}>
                            {signedIn ? "Open dashboard" : "Get started"}
                            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
            </header>

            <main>
                {/* ---------------------------------------------------------- Hero */}
                <section className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24">
                    <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
                        <div>
                            <div
                                className="animate-[seal-rise_0.6s_ease-out_both] inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1 font-mono text-[11px] text-muted-foreground"
                                style={{ animationDelay: "0ms" }}
                            >
                                <ShieldCheck className="h-3 w-3 text-primary" />
                                envelope encryption · per-version keys
                            </div>

                            <h1
                                className="animate-[seal-rise_0.7s_ease-out_both] mt-6 text-4xl font-bold tracking-tight text-balance sm:text-6xl"
                                style={{ animationDelay: "80ms" }}
                            >
                                Secrets with
                                <br />
                                <span className="bg-gradient-to-r from-primary via-primary to-chart-2 bg-clip-text text-transparent">
                                    a memory.
                                </span>
                            </h1>

                            <p
                                className="animate-[seal-rise_0.7s_ease-out_both] mt-6 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty sm:text-lg"
                                style={{ animationDelay: "160ms" }}
                            >
                                A developer secrets vault where every value is versioned, every change is named,
                                and a bad rotation is one click from undone — without ever editing a{" "}
                                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">.env</code> file
                                again.
                            </p>

                            <div
                                className="animate-[seal-rise_0.7s_ease-out_both] mt-8 flex flex-wrap items-center gap-3"
                                style={{ animationDelay: "240ms" }}
                            >
                                <Button asChild size="lg" className="font-medium shadow-lg shadow-primary/20">
                                    <Link href={dashboardHref}>
                                        {signedIn ? "Open your vault" : "Start free"}
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                {signedIn && (
                                    <Button asChild size="lg" variant="ghost" className="font-medium">
                                        <Link href="/account/devices">Authorized devices</Link>
                                    </Button>
                                )}
                            </div>

                            <div
                                className="animate-[seal-rise_0.7s_ease-out_both] mt-10 rounded-xl border border-border/60 bg-card/40 p-4 font-mono text-xs backdrop-blur-sm"
                                style={{ animationDelay: "320ms" }}
                            >
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <span className="text-primary">$</span>
                                    <span>seal</span>
                                    <span className="text-foreground">env</span>
                                    <span className="text-muted-foreground">export production</span>
                                    <span className="inline-block h-4 w-2 animate-[seal-caret_1.1s_step-end_infinite] bg-primary/70 align-middle" />
                                </div>
                                <div className="mt-2 space-y-1 text-muted-foreground">
                                    <p>
                                        <span className="text-foreground/70">STRIPE_KEY</span>=
                                        <span className="text-foreground">"sk_live_••••••••"</span>
                                    </p>
                                    <p>
                                        <span className="text-foreground/70">DATABASE_URL</span>=
                                        <span className="text-foreground">"postgres://••••@r2/main"</span>
                                    </p>
                                    <p className="text-muted-foreground/50"># decrypted on demand, never at rest in plaintext</p>
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div
                                aria-hidden
                                className="absolute -inset-8 -z-10 rounded-[2rem] bg-primary/10 blur-2xl"
                            />
                            <VersionLedger className="animate-[seal-rise_0.8s_ease-out_both]" />
                            <TokenCard className="relative z-10 mt-4 ml-auto -mt-16 mr-4 w-60 animate-[seal-rise_0.8s_ease-out_both] sm:w-64" />
                            <AccessMatrix className="relative z-10 -mt-10 ml-6 w-64 animate-[seal-rise_0.8s_ease-out_both] sm:w-72" />
                        </div>
                    </div>
                </section>

                {/* ------------------------------------------------------ Capabilities */}
                <section id="capabilities" className="border-t border-border/40 bg-muted/15 py-20">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <SectionHeading
                            eyebrow="Capabilities"
                            title="Everything a secret needs to be trustworthy"
                            body="Not just storage. The history, the permissions and the paper trail around a value are the parts that actually hurt when they are missing."
                        />

                        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {FEATURES.map((feature) => (
                                <article
                                    key={feature.title}
                                    className="group relative overflow-hidden rounded-xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-primary/40"
                                >
                                    <span
                                        aria-hidden
                                        className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100"
                                    />
                                    <feature.icon className="h-5 w-5 text-primary" />
                                    <h3 className="mt-4 font-semibold">{feature.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ------------------------------------------------------------ Access */}
                <section id="access" className="py-20">
                    <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
                        <div>
                            <SectionHeading
                                align="left"
                                eyebrow="Access"
                                title="Hand over exactly the keys, not the whole vault"
                                body="Invite someone, then choose the environments they actually need. An override can hide an environment completely, cap it at read, or grant write — per person, per project, per environment."
                            />
                            <ul className="mt-8 space-y-4">
                                {ACCESS_POINTS.map((point) => (
                                    <li key={point} className="flex gap-3 text-sm">
                                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <span className="text-muted-foreground">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="relative">
                            <div
                                aria-hidden
                                className="absolute -inset-6 -z-10 rounded-3xl bg-chart-2/8 blur-2xl"
                            />
                            <AccessMatrix />
                        </div>
                    </div>
                </section>

                {/* ------------------------------------------------------ Cryptography */}
                <section id="cryptography" className="border-t border-border/40 bg-muted/15 py-20">
                    <div className="mx-auto max-w-6xl px-4 sm:px-6">
                        <SectionHeading
                            eyebrow="Cryptography"
                            title="One key per version, wrapped by a master key you rotate"
                            body="Each write produces a fresh data key. That key encrypts the value and is itself wrapped by the current master key, so a value written last year stays readable after you rotate — and a leaked value is scoped to the version it came from."
                        />

                        <div className="mt-12 grid gap-4 lg:grid-cols-3">
                            {CRYPTO_STEPS.map((step, index) => (
                                <div
                                    key={step.title}
                                    className="relative rounded-xl border border-border/60 bg-card/40 p-5"
                                >
                                    <span className="font-mono text-[11px] text-primary">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <h3 className="mt-3 font-semibold">{step.title}</h3>
                                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                                    {index < CRYPTO_STEPS.length - 1 && (
                                        <ArrowRight
                                            aria-hidden
                                            className="absolute top-1/2 -right-3 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground/50 lg:block"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ----------------------------------------------------------- Closing */}
                <section className="py-24">
                    <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
                        <SealMark className="mx-auto h-12 w-12" animated />
                        <h2 className="mt-8 text-3xl font-bold tracking-tight text-balance sm:text-4xl">
                            Stop editing{" "}
                            <code className="rounded bg-muted px-2 py-1 font-mono text-[0.85em]">.env</code> files
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-muted-foreground text-pretty">
                            Create a workspace, invite your team, choose who reaches which environment, and hand
                            your application a read-only token that you can expire or revoke.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <Button asChild size="lg" className="font-medium shadow-lg shadow-primary/20">
                                <Link href={dashboardHref}>
                                    {signedIn ? "Open your vault" : "Create your workspace"}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="border-t border-border/40">
                <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <SealMark className="h-6 w-6" />
                        <span className="font-medium text-foreground">Seal</span>
                        <span>· developer secrets vault</span>
                    </div>
                    <nav className="flex gap-6">
                        <Link href="/login" className="transition-colors hover:text-foreground">
                            Sign in
                        </Link>
                        <Link href="/signup" className="transition-colors hover:text-foreground">
                            Create account
                        </Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}

function SectionHeading({
    eyebrow,
    title,
    body,
    align = "center",
}: {
    eyebrow: string;
    title: string;
    body: string;
    align?: "center" | "left";
}) {
    return (
        <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl"}>
            <p className="font-mono text-xs tracking-widest text-primary uppercase">{eyebrow}</p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-balance sm:text-3xl">{title}</h2>
            <p className="mt-4 text-muted-foreground text-pretty">{body}</p>
        </div>
    );
}

const FEATURES = [
    {
        icon: GitBranch,
        title: "Append-only version history",
        body: "Every write becomes a version. Rollback adds a new one holding the old value, so nothing is ever overwritten and any mistake is reversible.",
    },
    {
        icon: Users,
        title: "Per-environment permissions",
        body: "Owner, admin, editor and viewer set the baseline. Individual environments can then be hidden, capped at read, or opened up to write.",
    },
    {
        icon: KeyRound,
        title: "Scoped read-only tokens",
        body: "A service token reads exactly one environment and cannot write, mint further tokens, or reach anything else. Expiry and IP allowlists included.",
    },
    {
        icon: ScrollText,
        title: "An audit trail with names",
        body: "Reads, writes, rollbacks and token changes are all recorded with the actor, their IP and the details, filterable by action or actor.",
    },
    {
        icon: Fingerprint,
        title: "Concurrent edit detection",
        body: "Two people editing the same key produces a conflict instead of a silent overwrite. You see the server value and choose deliberately.",
    },
    {
        icon: Boxes,
        title: "Bulk import that understands .env",
        body: "Drop in an environment file. Comments and quoting are handled, keys are validated, and binary files are rejected by content rather than by extension.",
    },
];

const ACCESS_POINTS = [
    "A contractor can ship to staging without ever seeing production.",
    "A viewer can hold a token for their own app without gaining write access.",
    "Projects nobody can reach disappear from the dashboard entirely.",
    "Permissions can be tightened or widened at any time, not just at invite.",
    "Removing someone revokes the credentials they created in the same action.",
];

const CRYPTO_STEPS = [
    {
        title: "Fresh data key per write",
        body: "Every version is encrypted with its own randomly generated data key, so a single compromised key never exposes more than one version.",
    },
    {
        title: "Wrapped by a master key",
        body: "That data key is sealed with the current master key and stored alongside the value. The master key itself never touches your secrets.",
    },
    {
        title: "Rotate without re-encrypting",
        body: "Rotating the master key only affects future writes. Historical versions stay readable because each carries the key that wrapped it.",
    },
];
