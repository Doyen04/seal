"use client";

import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DeleteWorkspaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceName?: string;
    /** Called after the workspace is gone, so the caller can leave the section. */
    onDeleted: () => void;
    deleteWorkspace: (workspaceId: string) => Promise<void>;
    workspaceId?: string;
}

/**
 * Requires the workspace name to be typed exactly. This cannot be undone and
 * takes every secret in it with it, so a single mis-click must not be enough.
 */
export function DeleteWorkspaceDialog({
    open,
    onOpenChange,
    workspaceName,
    onDeleted,
    deleteWorkspace,
    workspaceId,
}: DeleteWorkspaceDialogProps) {
    const [confirmation, setConfirmation] = useState("");
    const [loading, setLoading] = useState(false);

    const expected = workspaceName ?? "";
    const matches = confirmation.trim() === expected && expected.length > 0;

    const handleOpenChange = (next: boolean) => {
        if (!next) setConfirmation("");
        onOpenChange(next);
    };

    const handleDelete = async () => {
        if (!matches || !workspaceId) return;
        setLoading(true);
        try {
            await deleteWorkspace(workspaceId);
            handleOpenChange(false);
            onDeleted();
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Delete {expected || "this workspace"}?
                    </DialogTitle>
                    <DialogDescription>This cannot be undone. It permanently removes:</DialogDescription>
                </DialogHeader>

                <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {[
                        "Every project, environment and secret key",
                        "Every version of those secrets, including their history",
                        "Every service token issued for them",
                        "The workspace audit log",
                    ].map((item) => (
                        <li key={item} className="flex gap-2">
                            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current" />
                            {item}
                        </li>
                    ))}
                </ul>

                <div className="space-y-2 pt-2">
                    <label htmlFor="confirm-workspace" className="text-sm">
                        Type <span className="font-mono font-medium">{expected}</span> to confirm
                    </label>
                    <input
                        id="confirm-workspace"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder={expected}
                        autoComplete="off"
                        className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleDelete} disabled={!matches || loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Delete workspace
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
