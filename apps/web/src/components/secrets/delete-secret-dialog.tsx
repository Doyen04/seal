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
import type { SecretMetaDto } from "@repo/core";

interface DeleteSecretDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: SecretMetaDto | null;
  loading: boolean;
  onConfirm: () => Promise<void>;
}

export function DeleteSecretDialog({
  open,
  onOpenChange,
  target,
  loading,
  onConfirm,
}: DeleteSecretDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Secret</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <span className="font-mono font-semibold text-foreground">{target?.key}</span>?
            This soft-deletes the key.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Delete Secret"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
