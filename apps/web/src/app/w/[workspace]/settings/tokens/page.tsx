"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Plus } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TokensTable, type ServiceTokenItem } from "@/components/tokens/tokens-table";
import { CreateTokenDialog } from "@/components/tokens/create-token-dialog";
import { PlainTokenDialog } from "@/components/tokens/plain-token-dialog";
import { RevokeTokenDialog } from "@/components/tokens/revoke-token-dialog";
import { client } from "@/lib/api-client";
import type { WorkspaceSummaryDto, ProjectDetailDto, UserDto } from "@repo/core";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/error-message";

export default function WorkspaceTokensPage({ params }: { params: Promise<{ workspace: string }> }) {
    const { workspace: workspaceSlug } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserDto>();
    const [workspaces, setWorkspaces] = useState<WorkspaceSummaryDto[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceSummaryDto>();
    const [projectDetails, setProjectDetails] = useState<ProjectDetailDto[]>([]);
    const [tokens, setTokens] = useState<ServiceTokenItem[]>([]);

    // Modals
    const [createOpen, setCreateOpen] = useState(false);
    const [plainTokenModal, setPlainTokenModal] = useState<string | null>(null);
    const [revokeTarget, setRevokeTarget] = useState<ServiceTokenItem | null>(null);
    const [revokeLoading, setRevokeLoading] = useState(false);
    const [loadWarning, setLoadWarning] = useState<string | null>(null);

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

            const projRes = await client.listProjects(ws.id);

            const details: ProjectDetailDto[] = [];
            const tokenItems: ServiceTokenItem[] = [];
            const failedEnvironments: string[] = [];

            for (const p of projRes.projects) {
                const detail = await client.getProject(p.id);
                details.push(detail);
                for (const env of detail.environments) {
                    try {
                        const tokRes = await client.listServiceTokens(env.id);
                        if (tokRes.tokens) {
                            tokRes.tokens.forEach((t) => {
                                tokenItems.push({
                                    ...t,
                                    environmentId: env.id,
                                    environmentName: env.name,
                                    projectName: p.name,
                                });
                            });
                        }
                    } catch (err: any) {
                        // Swallowing this made a failure look like "this
                        // environment has no tokens", which invites duplicate
                        // tokens. Record it and say so once at the end.
                        failedEnvironments.push(`${p.name} / ${env.name}`);
                    }
                }
            }

            setProjectDetails(details);
            setTokens(tokenItems);
            if (failedEnvironments.length > 0) {
                setLoadWarning(
                    `Could not load tokens for ${failedEnvironments.length} environment(s): ${failedEnvironments.join(", ")}.`,
                );
            }
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to load tokens"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [workspaceSlug]);

    const handleCreateToken = async (envId: string, name: string, ipAllowlistStr: string, expiresAt: string | null) => {
        try {
            const ips = ipAllowlistStr
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

            const res = await client.createServiceToken(envId, {
                name,
                ipAllowlist: ips.length > 0 ? ips : undefined,
                expiresAt: expiresAt ?? undefined,
            });

            setPlainTokenModal(res.token);
            loadData();
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to create service token"));
            throw err;
        }
    };

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        setRevokeLoading(true);

        try {
            await client.revokeServiceToken(revokeTarget.id);
            toast.success(`Service token "${revokeTarget.name}" revoked`);
            setTokens(tokens.filter((t) => t.id !== revokeTarget.id));
            setRevokeTarget(null);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to revoke token"));
        } finally {
            setRevokeLoading(false);
        }
    };

    // Every member may create a service token for an environment they can read,
    // because the token is read-only and scoped to that one environment
    // (tokens.ts:43). Revoking is limited to your own tokens unless you are an
    // admin or owner, and the API enforces that. The environment pickers are
    // already filtered to what this member can read.
    const canManageTokens = currentWorkspace !== undefined;

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar
                currentWorkspace={currentWorkspace}
                workspaces={workspaces}
                user={user}
                userRole={currentWorkspace?.role}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Service Tokens</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Read-only tokens for deployed applications and CI/CD pipelines
                        </p>
                    </div>

                    {canManageTokens && (
                        <Button onClick={() => setCreateOpen(true)} className="font-medium shadow-md shadow-primary/10">
                            <Plus className="mr-2 h-4 w-4" /> Create Service Token
                        </Button>
                    )}
                </div>

                <Card className="border-border/60 shadow-sm">
                    {loadWarning && (
                        <div className="flex items-start gap-2 border-b border-border/40 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{loadWarning}</span>
                        </div>
                    )}
                    <CardContent>
                        <TokensTable loading={loading} tokens={tokens} onRevokeClick={(tok) => setRevokeTarget(tok)} />
                    </CardContent>
                </Card>

                <CreateTokenDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    projects={projectDetails}
                    onCreateToken={handleCreateToken}
                />

                <PlainTokenDialog token={plainTokenModal} onClose={() => setPlainTokenModal(null)} />

                <RevokeTokenDialog
                    target={revokeTarget}
                    loading={revokeLoading}
                    onClose={() => setRevokeTarget(null)}
                    onRevoke={handleRevoke}
                />
            </main>
        </div>
    );
}
