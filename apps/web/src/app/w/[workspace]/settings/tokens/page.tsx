"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TokensTable, type ServiceTokenItem } from "@/components/tokens/tokens-table";
import { CreateTokenDialog } from "@/components/tokens/create-token-dialog";
import { PlainTokenDialog } from "@/components/tokens/plain-token-dialog";
import { RevokeTokenDialog } from "@/components/tokens/revoke-token-dialog";
import { client } from "@/lib/api-client";
import type { WorkspaceSummaryDto, EnvironmentDto, UserDto } from "@repo/core";
import { toast } from "sonner";

export default function WorkspaceTokensPage({ params }: { params: Promise<{ workspace: string }> }) {
    const { workspace: workspaceSlug } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserDto>();
    const [workspaces, setWorkspaces] = useState<WorkspaceSummaryDto[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceSummaryDto>();
    const [environments, setEnvironments] = useState<EnvironmentDto[]>([]);
    const [tokens, setTokens] = useState<ServiceTokenItem[]>([]);

    // Modals
    const [createOpen, setCreateOpen] = useState(false);
    const [selectedEnvId, setSelectedEnvId] = useState("");
    const [plainTokenModal, setPlainTokenModal] = useState<string | null>(null);
    const [revokeTarget, setRevokeTarget] = useState<ServiceTokenItem | null>(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

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

            const allEnvs: EnvironmentDto[] = [];
            const tokenItems: ServiceTokenItem[] = [];

            for (const p of projRes.projects) {
                const detail = await client.getProject(p.id);
                for (const env of detail.environments) {
                    allEnvs.push(env);
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
                    } catch {
                        // empty if unauthorized or none
                    }
                }
            }

            setEnvironments(allEnvs);
            const firstEnv = allEnvs.length > 0 ? allEnvs[0] : null;
            if (firstEnv) setSelectedEnvId(firstEnv.id);
            setTokens(tokenItems);
        } catch (err: any) {
            toast.error(err.message || "Failed to load tokens");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [workspaceSlug]);

    const handleCreateToken = async (envId: string, name: string, ipAllowlistStr: string) => {
        try {
            const ips = ipAllowlistStr
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);

            const res = await client.createServiceToken(envId, {
                name,
                ipAllowlist: ips.length > 0 ? ips : undefined,
            });

            setPlainTokenModal(res.token);
            loadData();
        } catch (err: any) {
            toast.error(err.message || "Failed to create service token");
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
            toast.error(err.message || "Failed to revoke token");
        } finally {
            setRevokeLoading(false);
        }
    };

    const isAdminOrOwner = currentWorkspace?.role === "owner" || currentWorkspace?.role === "admin";

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

                    {isAdminOrOwner && (
                        <Button onClick={() => setCreateOpen(true)} className="font-medium shadow-md shadow-primary/10">
                            <Plus className="mr-2 h-4 w-4" /> Create Service Token
                        </Button>
                    )}
                </div>

                <Card className="border-border/60 shadow-sm">
                    <TokensTable
                        loading={loading}
                        tokens={tokens}
                        isAdminOrOwner={isAdminOrOwner}
                        onRevokeClick={(tok) => setRevokeTarget(tok)}
                    />
                </Card>

                <CreateTokenDialog
                    open={createOpen}
                    onOpenChange={setCreateOpen}
                    environments={environments}
                    initialEnvId={selectedEnvId}
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
