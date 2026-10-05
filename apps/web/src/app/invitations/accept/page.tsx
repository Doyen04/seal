"use client";

import { useCallback, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, LogIn, UserPlus, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError, client } from "@/lib/api-client";
import { toast } from "sonner";

type Status = "checking" | "needsAuth" | "ready" | "loading" | "success" | "error";

function AcceptInvitationCard() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";

    const [status, setStatus] = useState<Status>("checking");
    const [errorMessage, setErrorMessage] = useState("");
    const [workspaceName, setWorkspaceName] = useState("");
    const [workspaceSlug, setWorkspaceSlug] = useState("");

    // Accepting requires an authenticated session whose email matches the
    // invitation, so check for a session before offering the accept button.
    useEffect(() => {
        let cancelled = false;
        if (!token) {
            setStatus("error");
            setErrorMessage("This link is missing its invitation token.");
            return;
        }
        (async () => {
            try {
                await client.me();
                if (!cancelled) setStatus("ready");
            } catch (err) {
                if (cancelled) return;
                if (err instanceof ApiError && err.status === 401) {
                    setStatus("needsAuth");
                } else {
                    setStatus("error");
                    setErrorMessage("Could not verify your session. Please try again.");
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [token]);

    const accept = useCallback(async () => {
        setStatus("loading");
        try {
            const { workspace } = await client.acceptInvitation(token);
            setWorkspaceName(workspace.name);
            setWorkspaceSlug(workspace.slug);
            setStatus("success");
            toast.success(`You joined ${workspace.name}`);
        } catch (err) {
            setStatus("error");
            if (err instanceof ApiError && err.status === 404) {
                setErrorMessage("This invitation is no longer valid. It may have expired or already been used.");
            } else {
                setErrorMessage(err instanceof Error ? err.message : "Could not accept the invitation.");
            }
        }
    }, [token]);

    const returnTo = `/invitations/accept?token=${encodeURIComponent(token)}`;
    const loginHref = `/login?returnTo=${encodeURIComponent(returnTo)}`;

    const icon =
        status === "success" ? (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
            </div>
        ) : status === "error" ? (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="h-6 w-6" />
            </div>
        ) : status === "needsAuth" ? (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <LogIn className="h-6 w-6" />
            </div>
        ) : (
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Loader2 className={`h-6 w-6 ${status === "checking" || status === "loading" ? "animate-spin" : ""}`} />
            </div>
        );

    const title =
        status === "success"
            ? "Invitation Accepted"
            : status === "error"
              ? "Invitation Not Accepted"
              : status === "needsAuth"
                ? "Sign in to Accept"
                : status === "ready"
                  ? "Join Workspace"
                  : "Checking Invitation";

    const description =
        status === "success"
            ? `You now have access to ${workspaceName}.`
            : status === "error"
              ? errorMessage
              : status === "needsAuth"
                ? "Sign in with the email address that received this invitation, then come back to accept it."
                : status === "ready"
                  ? "Accepting will add you to the workspace with the role chosen by the person who invited you."
                  : "One moment while we check this invitation.";

    return (
        <Card className="w-full max-w-md border-border/60 text-center shadow-xl backdrop-blur-sm">
            <CardHeader className="space-y-2">
                {icon}
                <CardTitle className="text-2xl">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
                {status === "ready" && (
                    <Button className="w-full font-medium" onClick={accept}>
                        Accept Invitation
                    </Button>
                )}

                {status === "needsAuth" && (
                    <div className="space-y-3">
                        <Button asChild className="w-full font-medium">
                            <Link href={loginHref}>
                                <LogIn className="mr-2 h-4 w-4" /> Sign in to accept
                            </Link>
                        </Button>
                        <p className="text-sm text-muted-foreground">
                            No account yet? Create one with that email address, verify it, then sign in and open this
                            link again.
                        </p>
                        <Button asChild variant="outline" className="w-full font-medium">
                            <Link href="/signup">
                                <UserPlus className="mr-2 h-4 w-4" /> Create an account
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex-col space-y-2">
                {status === "success" ? (
                    <Button asChild className="w-full font-medium">
                        <Link href={`/w/${workspaceSlug}`}>
                            Open {workspaceName} <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                ) : (
                    <>
                        <Button asChild variant="ghost" className="w-full">
                            <Link href="/login">
                                <LogIn className="mr-2 h-4 w-4" /> Sign in
                            </Link>
                        </Button>
                        <Button asChild variant="ghost" className="w-full">
                            <Link href="/signup">
                                <UserPlus className="mr-2 h-4 w-4" /> Create an account
                            </Link>
                        </Button>
                    </>
                )}
            </CardFooter>
        </Card>
    );
}

export default function AcceptInvitationPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 p-4">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
                <AcceptInvitationCard />
            </Suspense>
        </div>
    );
}
