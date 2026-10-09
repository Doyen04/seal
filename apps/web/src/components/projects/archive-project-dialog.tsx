"use client";

import { useState } from "react";
import { Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ArchiveProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectName?: string;
    onArchive: () => Promise<void>;
}

/**
 * Archiving is a soft delete: the project leaves every list immediately, but the
 * rows stay in the database. Wording says "archive" rather than "delete" because
 * nothing is actually destroyed.
 */
export function ArchiveProjectDialog({ open, onOpenChange, projectName, onArchive }: ArchiveProjectDialogProps) {
    const [loading, setLoading] = useState(false);

    const handleArchive = async () => {
        setLoading(true);
        try {
            await onArchive();
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Archive className="h-5 w-5" />
                        Archive {projectName || "this project"}?
                    </DialogTitle>
                    <DialogDescription>
                        The project and its secrets stop appearing in the dashboard immediately. Nothing is erased, so
                        this cannot be undone from the interface today.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={handleArchive} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Archive project
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
