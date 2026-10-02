"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EnvironmentDto } from "@repo/core";

interface CreateTokenDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    environments: EnvironmentDto[];
    initialEnvId: string;
    onCreateToken: (envId: string, name: string, ipAllowlist: string) => Promise<void>;
}

export function CreateTokenDialog({
    open,
    onOpenChange,
    environments,
    initialEnvId,
    onCreateToken,
}: CreateTokenDialogProps) {
    const [selectedEnvId, setSelectedEnvId] = useState(initialEnvId);
    const [tokenName, setTokenName] = useState("");
    const [ipAllowlist, setIpAllowlist] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const targetEnv = selectedEnvId || initialEnvId;
        if (!targetEnv) return;
        setLoading(true);

        try {
            await onCreateToken(targetEnv, tokenName, ipAllowlist);
            setTokenName("");
            setIpAllowlist("");
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Service Token</DialogTitle>
                        <DialogDescription>
                            Generate a read-only service token for a specific environment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Environment</Label>
                            <Select
                                value={selectedEnvId || initialEnvId}
                                onValueChange={(val) => setSelectedEnvId(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select environment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {environments.map((e) => (
                                        <SelectItem key={e.id} value={e.id}>
                                            {e.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="tname">Token Name</Label>
                            <Input
                                id="tname"
                                placeholder="Vercel Production Token"
                                value={tokenName}
                                onChange={(e) => setTokenName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ip">IP Allowlist (optional, comma-separated)</Label>
                            <Input
                                id="ip"
                                placeholder="192.168.1.1, 10.0.0.0/24"
                                value={ipAllowlist}
                                onChange={(e) => setIpAllowlist(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !tokenName || !(selectedEnvId || initialEnvId)}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Token"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
