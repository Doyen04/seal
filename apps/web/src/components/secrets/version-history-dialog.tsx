"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SecretMetaDto, SecretVersionDto } from "@repo/core";

interface VersionHistoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    target: SecretMetaDto | null;
    versions: SecretVersionDto[];
    loading: boolean;
    isViewer: boolean;
    onRollback: (version: number) => Promise<void>;
}

export function VersionHistoryDialog({
    open,
    onOpenChange,
    target,
    versions,
    loading,
    isViewer,
    onRollback,
}: VersionHistoryDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Version History: {target?.key}</DialogTitle>
                    <DialogDescription>
                        Review previous versions of this secret and roll back if needed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4 max-h-[300px] overflow-y-auto">
                    {loading ? (
                        <div className="text-center py-6 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                            Loading version history...
                        </div>
                    ) : versions.length === 0 ? (
                        <p className="text-center text-sm text-muted-foreground">No versions found.</p>
                    ) : (
                        versions.map((ver) => (
                            <div
                                key={`${ver.version}-${ver.createdAt}`}
                                className="flex items-center justify-between p-3 border border-border/60 rounded-lg bg-muted/20"
                            >
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <Badge variant="outline" className="font-mono text-xs">
                                            v{ver.version}
                                        </Badge>
                                        <span className="text-xs uppercase font-semibold text-muted-foreground">
                                            {ver.op}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {new Date(ver.createdAt).toLocaleString()}
                                    </p>
                                </div>

                                {/* A deletion version has no value to restore, and the API rejects it
                                    outright (secrets.ts:302), so do not offer the
                                    button at all. */}
                                {!isViewer && ver.op !== "delete" && (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onRollback(ver.version)}
                                        className="text-xs font-medium"
                                    >
                                        <RotateCcw className="mr-1 h-3.5 w-3.5" /> Rollback
                                    </Button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
