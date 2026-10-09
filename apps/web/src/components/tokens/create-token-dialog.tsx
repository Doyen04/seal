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
import type { ProjectDetailDto } from "@repo/core";

interface CreateTokenDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Projects with their environments. A token is scoped to one environment. */
    projects: ProjectDetailDto[];
    onCreateToken: (envId: string, name: string, ipAllowlist: string, expiresAt: string | null) => Promise<void>;
}

export function CreateTokenDialog({ open, onOpenChange, projects, onCreateToken }: CreateTokenDialogProps) {
    const [selectedProjectId, setSelectedProjectId] = useState("");
    const [selectedEnvId, setSelectedEnvId] = useState("");
    const [tokenName, setTokenName] = useState("");
    const [ipAllowlist, setIpAllowlist] = useState("");
    const [expiresOn, setExpiresOn] = useState("");
    const [loading, setLoading] = useState(false);

    // The API requires the expiry to be in the future, so past dates are not
    // offered in the first place.
    const today = new Date().toISOString().slice(0, 10);

    // Fall back to the first project and its first environment whenever the
    // stored choice is empty or no longer present, so the dialog stays correct
    // as projects load in the background.
    const projectOptions = projects.filter((p) => p.environments.length > 0);
    const activeProjectId = projectOptions.some((p) => p.id === selectedProjectId)
        ? selectedProjectId
        : (projectOptions[0]?.id ?? "");
    const projectEnvs = projectOptions.find((p) => p.id === activeProjectId)?.environments ?? [];
    const activeEnvId = projectEnvs.some((e) => e.id === selectedEnvId) ? selectedEnvId : (projectEnvs[0]?.id ?? "");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!activeEnvId) return;
        setLoading(true);

        try {
            // The date input gives a day; treat it as the end of that day so a
            // token set to expire "today" is not immediately stale.
            const expiresAt = expiresOn ? new Date(`${expiresOn}T23:59:59`).toISOString() : null;
            await onCreateToken(activeEnvId, tokenName, ipAllowlist, expiresAt);
            setTokenName("");
            setIpAllowlist("");
            setExpiresOn("");
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* Five stacked sections put this near 720px tall. Without a height
                cap the centred dialog clips both ends and Generate Token ends up
                off-screen with no way to scroll to it. */}
            <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Service Token</DialogTitle>
                        <DialogDescription>
                            Generate a read-only service token for a specific environment.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Project</Label>
                            <Select
                                value={activeProjectId}
                                onValueChange={(val) => {
                                    setSelectedProjectId(val);
                                    // The environment list belongs to the new project.
                                    setSelectedEnvId("");
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectOptions.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Environment</Label>
                            <Select value={activeEnvId} onValueChange={setSelectedEnvId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select environment" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projectEnvs.map((env) => (
                                        <SelectItem key={env.id} value={env.id}>
                                            {env.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                The token can only read secrets in this environment.
                            </p>
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
                            <Label htmlFor="texp">Expires (optional)</Label>
                            <Input
                                id="texp"
                                type="date"
                                value={expiresOn}
                                min={today}
                                onChange={(e) => setExpiresOn(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty for a token that never expires. The token stops working at the end of the
                                selected day.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ip">IP Allowlist (optional, comma-separated)</Label>
                            <Input
                                id="ip"
                                placeholder="192.168.1.1, 203.0.113.10"
                                value={ipAllowlist}
                                onChange={(e) => setIpAllowlist(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Exact IP addresses only. CIDR ranges are not supported.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !tokenName || !activeEnvId}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Generate Token"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
