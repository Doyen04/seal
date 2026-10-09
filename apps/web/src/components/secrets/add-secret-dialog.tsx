"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface AddSecretDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    envName?: string;
    onAdd: (key: string, value: string) => Promise<void>;
}

export function AddSecretDialog({ open, onOpenChange, envName, onAdd }: AddSecretDialogProps) {
    const [key, setKey] = useState("");
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onAdd(key, value);
            setKey("");
            setValue("");
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Add Secret Key</DialogTitle>
                        <DialogDescription>
                            Store a new encrypted secret key in {envName || "environment"}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2.5">
                            <Label htmlFor="skey">Key Name (uppercase, e.g. STRIPE_API_KEY)</Label>
                            <Input
                                id="skey"
                                placeholder="DATABASE_URL"
                                value={key}
                                onChange={(e) => setKey(e.target.value.toUpperCase())}
                                className="font-mono"
                                required
                            />
                        </div>
                        <div className="space-y-2.5">
                            <Label htmlFor="sval">Secret Value</Label>
                            <Textarea
                                id="sval"
                                placeholder="sk_live_..."
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
                        <Button type="submit" disabled={loading || !key || !value}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Secret"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
