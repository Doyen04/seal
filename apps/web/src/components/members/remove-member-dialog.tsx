"use client";

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
import type { MemberDto, RotationChecklistEntry } from "@repo/core";

interface RemoveMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: MemberDto | null;
    loading: boolean;
    rotationChecklist: RotationChecklistEntry[] | null;
    onConfirm: () => Promise<void>;
}

export function RemoveMemberDialog({
    open,
    onOpenChange,
    target,
    loading,
    rotationChecklist,
    onConfirm,
}: RemoveMemberDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {rotationChecklist ? "Member Removed - Security Rotation Required" : "Remove Member"}
                    </DialogTitle>
                    <DialogDescription>
                        {rotationChecklist
                            ? "As a security precaution, please rotate the following secret keys that the removed member previously had access to."
                            : `Are you sure you want to remove ${target?.name || target?.email} from the workspace?`}
                    </DialogDescription>
                </DialogHeader>

                {rotationChecklist ? (
                    <div className="space-y-3 py-2 max-h-[250px] overflow-y-auto">
                        {rotationChecklist.map((item) => (
                            <div
                                key={item.environmentId}
                                className="p-3 border rounded-md bg-amber-500/5 border-amber-500/20"
                            >
                                <p className="font-semibold text-xs text-amber-500 uppercase">
                                    Env: {item.environmentName}
                                </p>
                                <ul className="mt-1 space-y-1">
                                    {item.keys.map((k) => (
                                        <li key={k} className="font-mono text-xs text-foreground">
                                            • {k}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                ) : (
                    <DialogFooter className="mt-4">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={onConfirm} disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Confirm Remove"}
                        </Button>
                    </DialogFooter>
                )}

                {rotationChecklist && (
                    <DialogFooter>
                        <Button onClick={() => onOpenChange(false)}>Close & Acknowledge</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    );
}
