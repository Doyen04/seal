"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    accessMapToInput,
    EnvironmentAccessPicker,
    type AccessMap,
    type AccessPickerProject,
} from "./environment-access-picker";
import type { AccessOverride } from "@repo/core";

interface EditMemberAccessDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    memberName?: string;
    memberRole?: string;
    projects: AccessPickerProject[];
    /** Current overrides, or null when the dialog has nothing to edit yet. */
    initialAccess: { environmentId: string; access: AccessOverride }[] | null;
    loading?: boolean;
    onSave: (access: { environmentId: string; access: AccessOverride }[]) => Promise<void>;
}

export function EditMemberAccessDialog({
    open,
    onOpenChange,
    memberName,
    memberRole,
    projects,
    initialAccess,
    loading,
    onSave,
}: EditMemberAccessDialogProps) {
    const [access, setAccess] = useState<AccessMap>({});
    const [saving, setSaving] = useState(false);

    // Reload from the server each time the dialog opens so a stale map from a
    // previous member can never be saved onto this one.
    useEffect(() => {
        if (!open) return;
        const next: AccessMap = {};
        for (const entry of initialAccess ?? []) next[entry.environmentId] = entry.access;
        setAccess(next);
    }, [open, initialAccess]);

    const isOwnerOrAdmin = memberRole === "owner" || memberRole === "admin";

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave(accessMapToInput(access));
            onOpenChange(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Environment access for {memberName || "this member"}</DialogTitle>
                    <DialogDescription>
                        {isOwnerOrAdmin
                            ? "Owners and admins already have full access to every environment."
                            : "Override individual environments. Anything left on Inherit follows the workspace role."}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <p className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading current access...
                        </p>
                    ) : isOwnerOrAdmin ? (
                        <p className="text-sm text-muted-foreground">There is nothing to change for this role.</p>
                    ) : (
                        <EnvironmentAccessPicker projects={projects} value={access} onChange={setAccess} />
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={saving || loading || isOwnerOrAdmin}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save access
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
