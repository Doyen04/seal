"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    accessMapToInput,
    EnvironmentAccessPicker,
    type AccessMap,
    type AccessPickerProject,
} from "./environment-access-picker";
import type { AccessOverride } from "@repo/core";

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceName?: string;
    projects: AccessPickerProject[];
    onInvite: (
        email: string,
        role: "admin" | "editor" | "viewer",
        access: { environmentId: string; access: AccessOverride }[],
    ) => Promise<void>;
}

export function InviteMemberDialog({ open, onOpenChange, workspaceName, projects, onInvite }: InviteMemberDialogProps) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
    const [access, setAccess] = useState<AccessMap>({});
    const [loading, setLoading] = useState(false);

    // Owners and admins always have full access, so per-environment overrides
    // would be silently ignored. Offering them would be misleading.
    const overridesApply = role !== "admin";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onInvite(email, role, overridesApply ? accessMapToInput(access) : []);
            setEmail("");
            setAccess({});
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                        <DialogDescription>
                            Send an email invitation to join {workspaceName || "workspace"}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2.5">
                            <Label htmlFor="iemail">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="iemail"
                                    type="email"
                                    placeholder="colleague@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-9"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2.5">
                            <Label htmlFor="invite-role">Workspace Role</Label>
                            <Select value={role} onValueChange={(val: any) => setRole(val)}>
                                <SelectTrigger id="invite-role">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin">Admin (Manage members, tokens, secrets)</SelectItem>
                                    <SelectItem value="editor">Editor (Create & update secrets)</SelectItem>
                                    <SelectItem value="viewer">Viewer (Read-only access)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {overridesApply && (
                            <EnvironmentAccessPicker projects={projects} value={access} onChange={setAccess} />
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !email}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Invite"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
