import { LandingPage } from "@/components/landing/landing-page";
import { getServerSession } from "@/lib/require-session";

/**
 * The public landing page.
 *
 * This replaces the previous behaviour, where `/` bounced signed-in users
 * straight to their workspace. It now renders for everyone, with the call to
 * action pointed at the dashboard when there is a session and at sign-up when
 * there is not.
 */
export const metadata = {
    title: "Seal — developer secrets vault",
    description:
        "Versioned, encrypted secrets for development teams. Append-only history with one-click rollback, per-environment permissions, and scoped read-only service tokens.",
};

export default async function HomePage() {
    const session = await getServerSession();

    // No session means there is nothing to open, so send the visitor to sign in.
    const dashboardHref = !session
        ? "/login"
        : session.workspaces && session?.workspaces.length > 0
          ? `/w/${session?.workspaces[0]?.slug}`
          : "/onboarding";

    return <LandingPage dashboardHref={dashboardHref} />;
}
