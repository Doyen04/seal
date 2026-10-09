"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { SecretMetaDto } from "@repo/core";

interface EditSecretDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: SecretMetaDto | null;
    initialValue: string;
    loading: boolean;
    onSave: (value: string) => Promise<void>;
}

export function EditSecretDialog({ open, onOpenChange, target, initialValue, loading, onSave }: EditSecretDialogProps) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(value);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Secret: {target?.key}</DialogTitle>
                        <DialogDescription>
                            Update the secret value. This creates version v{(target?.version || 0) + 1}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="eval">Secret Value</Label>
                            <Textarea
                                id="eval"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                className="field-sizing-fixed max-h-[40vh] font-mono text-sm min-h-[100px]"
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Secret"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
