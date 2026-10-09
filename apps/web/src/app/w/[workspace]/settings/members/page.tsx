"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Users } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MembersTable } from "@/components/members/members-table";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import { RemoveMemberDialog } from "@/components/members/remove-member-dialog";
import { EditMemberAccessDialog } from "@/components/members/edit-member-access-dialog";
import type { AccessPickerProject } from "@/components/members/environment-access-picker";
import { client } from "@/lib/api-client";
import type { WorkspaceSummaryDto, MemberDto, UserDto, RotationChecklistEntry, AccessOverride } from "@repo/core";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/error-message";

export default function WorkspaceMembersPage({ params }: { params: Promise<{ workspace: string }> }) {
    const { workspace: workspaceSlug } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserDto>();
    const [workspaces, setWorkspaces] = useState<WorkspaceSummaryDto[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceSummaryDto>();
    const [members, setMembers] = useState<MemberDto[]>([]);
    const [projects, setProjects] = useState<AccessPickerProject[]>([]);

    // Modals
    const [inviteOpen, setInviteOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<MemberDto | null>(null);
    const [removeLoading, setRemoveLoading] = useState(false);
    const [rotationChecklist, setRotationChecklist] = useState<RotationChecklistEntry[] | null>(null);
    const [accessOpen, setAccessOpen] = useState(false);
    const [accessTarget, setAccessTarget] = useState<MemberDto | null>(null);
    const [accessLoading, setAccessLoading] = useState(false);

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

            const memRes = await client.listMembers(ws.id);
            setMembers(memRes.members);

            // Needed by both the invite picker and the access editor. Two guarantees come
            // from the API rather than from filtering here: listProjects omits
            // archived projects, and getProject returns only the environments the
            // caller can read. So the picker can never offer an environment the
            // person granting it is unable to see.
            const projRes = await client.listProjects(ws.id);
            const withEnvs = await Promise.all(
                projRes.projects.map(async (proj) => {
                    const detail = await client.getProject(proj.id);
                    return {
                        id: proj.id,
                        name: proj.name,
                        environments: detail.environments.map((e) => ({ id: e.id, name: e.name })),
                    };
                }),
            );
            setProjects(withEnvs);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to load members"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [workspaceSlug]);

    const handleInvite = async (
        email: string,
        role: "admin" | "editor" | "viewer",
        access: { environmentId: string; access: AccessOverride }[],
    ) => {
        if (!currentWorkspace) return;
        try {
            await client.inviteMember(currentWorkspace.id, { email, role, access });
            toast.success(`Invitation sent to ${email}!`);
            loadData();
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to send invitation"));
            throw err;
        }
    };

    /** Re-reads one member's overrides so the editor never shows a stale map. */
    const openAccessEditor = async (member: MemberDto) => {
        setAccessTarget(member);
        setAccessLoading(true);
        setAccessOpen(true);
        try {
            if (currentWorkspace) {
                const fresh = await client.listMembers(currentWorkspace.id);
                const updated = fresh.members.find((m) => m.userId === member.userId) ?? null;
                setAccessTarget(updated);
                setMembers(fresh.members);
            }
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to load current access"));
            setAccessOpen(false);
        } finally {
            setAccessLoading(false);
        }
    };

    const handleSaveAccess = async (access: { environmentId: string; access: AccessOverride }[]) => {
        if (!currentWorkspace || !accessTarget) return;
        try {
            await client.updateMemberAccess(currentWorkspace.id, accessTarget.userId, access);
            toast.success(`Updated access for ${accessTarget.name || accessTarget.email}`);
            const fresh = await client.listMembers(currentWorkspace.id);
            setMembers(fresh.members);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to update environment access"));
            throw err;
        }
    };

    const handleRoleChange = async (member: MemberDto, newRole: "admin" | "editor" | "viewer") => {
        if (!currentWorkspace) return;
        try {
            await client.updateMember(currentWorkspace.id, member.userId, { role: newRole });
            toast.success(`Updated ${member.name || member.email}'s role to ${newRole}`);
            loadData();
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to update member role"));
        }
    };

    const handleRemoveMember = async () => {
        if (!currentWorkspace || !removeTarget) return;
        setRemoveLoading(true);

        try {
            const res = await client.removeMember(currentWorkspace.id, removeTarget.userId);
            toast.success(`Removed ${removeTarget.name || removeTarget.email} from workspace`);
            setMembers(members.filter((m) => m.userId !== removeTarget.userId));

            if (res.rotationChecklist && res.rotationChecklist.length > 0) {
                setRotationChecklist(res.rotationChecklist);
            } else {
                setRemoveOpen(false);
                setRemoveTarget(null);
            }
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to remove member"));
            setRemoveOpen(false);
        } finally {
            setRemoveLoading(false);
        }
    };

    const isAdminOrOwner = currentWorkspace?.role === "owner" || currentWorkspace?.role === "admin";

    // Viewers are not offered Members in the navigation; without this guard they
    // could still reach it by typing the address. The API allows viewers to list
    // members, so the restriction is enforced here.
    if (!loading && currentWorkspace && currentWorkspace.role === "viewer") {
        return (
            <div className="min-h-screen bg-background flex flex-col">
                <Navbar
                    currentWorkspace={currentWorkspace}
                    workspaces={workspaces}
                    user={user}
                    userRole={currentWorkspace.role}
                />
                <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
                    <Card className="border-border/60 shadow-sm">
                        <div className="p-8 text-center text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-3 opacity-50" />
                            <p className="font-medium text-foreground">Members are not visible to viewers</p>
                            <p className="text-xs mt-1">Ask an admin if you need access to this page.</p>
                        </div>
                    </Card>
                </main>
            </div>
        );
    }

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
                        <h1 className="text-3xl font-bold tracking-tight">Team Members</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Manage workspace members, invite collaborators, and assign roles
                        </p>
                    </div>

                    {isAdminOrOwner && (
                        <Button onClick={() => setInviteOpen(true)} className="font-medium shadow-md shadow-primary/10">
                            <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                        </Button>
                    )}
                </div>

                <Card className="border-border/60 shadow-sm">
                    <CardContent>
                        <MembersTable
                            loading={loading}
                            members={members}
                            user={user}
                            isAdminOrOwner={isAdminOrOwner}
                            onRoleChange={handleRoleChange}
                            onAccessClick={openAccessEditor}
                            onRemoveClick={(mem) => {
                                setRemoveTarget(mem);
                                setRotationChecklist(null);
                                setRemoveOpen(true);
                            }}
                        />
                    </CardContent>
                </Card>

                {/* Danger zone. Owner only, because deleting the workspace takes
                    every project and secret in it with it. */}
                {isOwner && (
                    <Card className="border-destructive/40 bg-destructive/5">
                        <CardContent className="space-y-4">
                            <div>
                                <h2 className="flex items-center gap-2 font-semibold text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                    Danger zone
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Deleting {currentWorkspace?.name} removes every project, environment,
                                    secret and service token inside it. This cannot be undone.
                                </p>
                            </div>
                            <Button variant="destructive" onClick={() => setDeleteWorkspaceOpen(true)}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete workspace
                            </Button>
                        </CardContent>
                    </Card>
                )}

                <DeleteWorkspaceDialog
                    open={deleteWorkspaceOpen}
                    onOpenChange={setDeleteWorkspaceOpen}
                    workspaceName={currentWorkspace?.name}
                    workspaceId={currentWorkspace?.id}
                    deleteWorkspace={handleDeleteWorkspace}
                    onDeleted={handleWorkspaceDeleted}
                />

                <InviteMemberDialog
                    open={inviteOpen}
                    onOpenChange={setInviteOpen}
                    workspaceName={currentWorkspace?.name}
                    projects={projects}
                    onInvite={handleInvite}
                />

                <EditMemberAccessDialog
                    open={accessOpen}
                    onOpenChange={setAccessOpen}
                    memberName={accessTarget?.name || accessTarget?.email}
                    memberRole={accessTarget?.role}
                    projects={projects}
                    initialAccess={accessTarget?.access ?? null}
                    loading={accessLoading}
                    onSave={handleSaveAccess}
                />

                <RemoveMemberDialog
                    open={removeOpen}
                    onOpenChange={setRemoveOpen}
                    target={removeTarget}
                    loading={removeLoading}
                    rotationChecklist={rotationChecklist}
                    onConfirm={handleRemoveMember}
                />
            </main>
        </div>
    );
}
