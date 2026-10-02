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
import type { ServiceTokenItem } from "./tokens-table";

interface RevokeTokenDialogProps {
    target: ServiceTokenItem | null;
    loading: boolean;
    onClose: () => void;
    onRevoke: () => Promise<void>;
}

export function RevokeTokenDialog({ target, loading, onClose, onRevoke }: RevokeTokenDialogProps) {
    return (
        <Dialog open={!!target} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Revoke Service Token</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to revoke{" "}
                        <span className="font-semibold text-foreground">{target?.name}</span>? Any app using this token
                        will lose access immediately.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onRevoke} disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Revoke Token"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
