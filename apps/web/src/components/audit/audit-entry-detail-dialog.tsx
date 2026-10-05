"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AuditEntryDto } from "@repo/core";

interface AuditEntryDetailDialogProps {
    entry: AuditEntryDto | null;
    onOpenChange: (open: boolean) => void;
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-[7rem_1fr] gap-2 py-1.5">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="min-w-0 text-sm break-words">{children}</span>
    </div>
);

export function AuditEntryDetailDialog({ entry, onOpenChange }: AuditEntryDetailDialogProps) {
    return (
        <Dialog open={entry !== null} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Audit entry details</DialogTitle>
                    <DialogDescription>{entry ? new Date(entry.createdAt).toLocaleString() : null}</DialogDescription>
                </DialogHeader>

                {entry && (
                    <div className="divide-y divide-border/40">
                        <Row label="Actor">
                            <span className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="font-normal">
                                    {entry.actorType}
                                </Badge>
                                <span className="font-medium">{entry.actorName ?? "Unknown"}</span>
                            </span>
                        </Row>

                        <Row label="Actor ID">
                            <span className="font-mono text-xs">{entry.actorId ?? "—"}</span>
                        </Row>

                        <Row label="Action">
                            <span className="font-mono text-xs">{entry.action}</span>
                        </Row>

                        <Row label="Target">
                            {entry.targetType ? (
                                <span className="font-mono text-xs">
                                    {entry.targetType}
                                    {entry.targetId ? `:${entry.targetId}` : ""}
                                </span>
                            ) : (
                                "—"
                            )}
                        </Row>

                        <Row label="IP address">
                            <span className="font-mono text-xs">{entry.ip ?? "Not recorded"}</span>
                        </Row>

                        <Row label="Timestamp">
                            <span className="font-mono text-xs">{new Date(entry.createdAt).toISOString()}</span>
                        </Row>

                        <Row label="Details">
                            {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                                <pre className="max-h-64 overflow-auto rounded-md bg-muted/40 p-2 font-mono text-xs whitespace-pre-wrap break-all">
                                    {JSON.stringify(entry.metadata, null, 2)}
                                </pre>
                            ) : (
                                <span className="text-muted-foreground">No additional details</span>
                            )}
                        </Row>
                    </div>
                )}

                <div className="flex justify-end">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
