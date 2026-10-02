"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface ExportSecretsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    envName?: string;
    exportData: string;
}

export function ExportSecretsDialog({ open, onOpenChange, envName, exportData }: ExportSecretsDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Export Secrets ({envName || "Environment"})</DialogTitle>
                    <DialogDescription>Decrypted secret values for the current environment.</DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                    <Textarea readOnly value={exportData} className="font-mono text-xs min-h-[220px] bg-muted/50" />
                </div>
                <DialogFooter>
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText(exportData);
                            toast.success("Export copied to clipboard!");
                        }}
                    >
                        <Copy className="mr-2 h-4 w-4" /> Copy to Clipboard
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
