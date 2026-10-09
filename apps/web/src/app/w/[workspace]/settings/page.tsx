"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, ScrollText, Trash2, Users } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteWorkspaceDialog } from "@/components/members/delete-workspace-dialog";
import { client } from "@/lib/api-client";
import type { WorkspaceSummaryDto, UserDto } from "@repo/core";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/error-message";

export default function WorkspaceSettingsPage({ params }: { params: Promise<{ workspace: string }> }) {
    const { workspace: workspaceSlug } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserDto>();
    const [workspaces, setWorkspaces] = useState<WorkspaceSummaryDto[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceSummaryDto>();
    const [deleteOpen, setDeleteOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const meRes = await client.me();
                setUser(meRes.user);
                setWorkspaces(meRes.workspaces);

                const ws = meRes.workspaces.find((w) => w.slug === workspaceSlug);
                if (!ws) {
                    toast.error("Workspace not found");
                    router.push("/");
                    return;
                }
                setCurrentWorkspace(ws);
            } catch (err: any) {
                toast.error(toUserMessage(err, "Failed to load workspace settings"));
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [workspaceSlug]);

    const handleDeleteWorkspace = async (workspaceId: string) => {
        await client.deleteWorkspace(workspaceId);
    };

    const handleWorkspaceDeleted = () => {
        toast.success("Workspace deleted");
        // The session is still valid but has no workspaces left, so onboarding
        // is the only sensible destination.
        router.push("/onboarding");
        router.refresh();
    };

    const role = currentWorkspace?.role;
    const isOwner = role === "owner";
    const isAdminOrOwner = isOwner || role === "admin";
    const isViewer = role === "viewer";

    const sections = [
        {
            href: `/w/${workspaceSlug}/settings/members`,
            icon: Users,
            title: "Members",
            description: "Invite collaborators, assign roles, and control which environments each member can read.",
            visible: !isViewer,
        },
        {
            href: `/w/${workspaceSlug}/settings/tokens`,
            icon: KeyRound,
            title: "Service Tokens",
            description: "Machine credentials for CI and automation. Create, scope, and revoke tokens per environment.",
            visible: true,
        },
        {
            href: `/w/${workspaceSlug}/settings/audit`,
            icon: ScrollText,
            title: "Audit Log",
            description: "Every change to secrets, members, and tokens, with who did it and from where.",
            visible: !isViewer,
        },
    ].filter((s) => s.visible);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar
                currentWorkspace={currentWorkspace}
                workspaces={workspaces}
                user={user}
                userRole={currentWorkspace?.role}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
                <div className="border-b border-border/40 pb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Workspace Settings</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {currentWorkspace?.name ?? "Loading..."} · {workspaceSlug}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sections.map((section) => {
                        const Icon = section.icon;
                        return (
                            <Card
                                key={section.href}
                                className="group hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between"
                            >
                                <CardHeader className="space-y-2">
                                    <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                        {section.title}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{section.description}</p>
                                </CardContent>

                                <CardFooter className="pt-4 border-t border-border/40">
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="w-full justify-between group-hover:bg-primary/10 group-hover:text-primary font-medium"
                                    >
                                        <Link href={section.href}>
                                            <span>Open {section.title}</span>
                                            <span aria-hidden="true">→</span>
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>

                {/* Deleting the workspace takes every project, environment, secret
                    and service token inside it, so it is owner only. The API checks
                    this too; the button is hidden so nobody discovers it by being
                    refused. */}
                {isOwner && (
                    <Card className="border-destructive/40 bg-destructive/5">
                        <CardContent className="space-y-4 p-6">
                            <div>
                                <h2 className="flex items-center gap-2 font-semibold text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    Danger zone
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Deleting {currentWorkspace?.name} removes every project, environment, secret and
                                    service token inside it. This cannot be undone.
                                </p>
                            </div>
                            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete workspace
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </main>

            <DeleteWorkspaceDialog
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                workspaceName={currentWorkspace?.name}
                workspaceId={currentWorkspace?.id}
                deleteWorkspace={handleDeleteWorkspace}
                onDeleted={handleWorkspaceDeleted}
            />
        </div>
    );
}
