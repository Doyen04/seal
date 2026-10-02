"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ConflictDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    serverVersion: number | null;
    pendingValue: string;
    loading: boolean;
    onForceOverwrite: () => Promise<void>;
}

export function ConflictDialog({
    open,
    onOpenChange,
    serverVersion,
    pendingValue,
    loading,
    onForceOverwrite,
}: ConflictDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="mx-auto h-10 w-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
                        <AlertTriangle className="h-5 w-5" />
                    </div>
                    <DialogTitle className="text-center">Secret Conflict Detected (409)</DialogTitle>
                    <DialogDescription className="text-center">
                        This secret was modified on the server (now version v{serverVersion}) since you opened it.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 text-sm">
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground font-medium">Your Pending Value:</Label>
                        <div className="p-3 bg-muted rounded-md font-mono text-xs break-all">{pendingValue}</div>
                    </div>
                </div>

                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={onForceOverwrite} disabled={loading}>
                        Force Overwrite (Use Mine)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
