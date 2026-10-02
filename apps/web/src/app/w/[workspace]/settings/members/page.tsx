"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MembersTable } from "@/components/members/members-table";
import { InviteMemberDialog } from "@/components/members/invite-member-dialog";
import { RemoveMemberDialog } from "@/components/members/remove-member-dialog";
import { client } from "@/lib/api-client";
import type { WorkspaceSummaryDto, MemberDto, UserDto, RotationChecklistEntry } from "@repo/core";
import { toast } from "sonner";

export default function WorkspaceMembersPage({ params }: { params: Promise<{ workspace: string }> }) {
    const { workspace: workspaceSlug } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserDto>();
    const [workspaces, setWorkspaces] = useState<WorkspaceSummaryDto[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceSummaryDto>();
    const [members, setMembers] = useState<MemberDto[]>([]);

    // Modals
    const [inviteOpen, setInviteOpen] = useState(false);
    const [removeOpen, setRemoveOpen] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<MemberDto | null>(null);
    const [removeLoading, setRemoveLoading] = useState(false);
    const [rotationChecklist, setRotationChecklist] = useState<RotationChecklistEntry[] | null>(null);

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
        } catch (err: any) {
            toast.error(err.message || "Failed to load members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [workspaceSlug]);

    const handleInvite = async (email: string, role: "admin" | "editor" | "viewer") => {
        if (!currentWorkspace) return;
        try {
            await client.inviteMember(currentWorkspace.id, { email, role });
            toast.success(`Invitation sent to ${email}!`);
            loadData();
        } catch (err: any) {
            toast.error(err.message || "Failed to send invitation");
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
            toast.error(err.message || "Failed to update member role");
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
            toast.error(err.message || "Failed to remove member");
            setRemoveOpen(false);
        } finally {
            setRemoveLoading(false);
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
                    <MembersTable
                        loading={loading}
                        members={members}
                        user={user}
                        isAdminOrOwner={isAdminOrOwner}
                        onRoleChange={handleRoleChange}
                        onRemoveClick={(mem) => {
                            setRemoveTarget(mem);
                            setRotationChecklist(null);
                            setRemoveOpen(true);
                        }}
                    />
                </Card>

                <InviteMemberDialog
                    open={inviteOpen}
                    onOpenChange={setInviteOpen}
                    workspaceName={currentWorkspace?.name}
                    onInvite={handleInvite}
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
