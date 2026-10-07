"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { History, Shield, Loader2, ChevronLeft, ChevronRight, User, Laptop, Key } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AuditEntryDetailDialog } from "@/components/audit/audit-entry-detail-dialog";
import { client } from "@/lib/api-client";
import type { WorkspaceDto, AuditEntryDto, UserDto, AuditQuery } from "@repo/core";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/error-message";

export default function WorkspaceAuditPage({ params }: { params: Promise<{ workspace: string }> }) {
    const { workspace: workspaceSlug } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserDto>();
    const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceDto>();
    const [entries, setEntries] = useState<AuditEntryDto[]>([]);
    const [nextCursor, setNextCursor] = useState<string | null>(null);
    const [detailEntry, setDetailEntry] = useState<AuditEntryDto | null>(null);

    const [actorFilter, setActorFilter] = useState<string>("all");
    const [actionFilter, setActionFilter] = useState<string>("all");

    // Cursors already visited, so Previous can walk back without re-querying
    // from the start. Empty string marks the first page.
    const [cursorHistory, setCursorHistory] = useState<string[]>([]);

    const fetchPage = async (cursor: string | undefined, filters: { actor: string; action: string }) => {
        const meRes = await client.me();
        setUser(meRes.user);
        setWorkspaces(meRes.workspaces);

        const ws = meRes.workspaces.find((w) => w.slug === workspaceSlug);
        if (!ws) {
            toast.error("Workspace not found");
            router.push("/");
            return null;
        }
        setCurrentWorkspace(ws);

        const query: Partial<AuditQuery> = { limit: 20 };
        if (cursor) query.cursor = cursor;
        if (filters.actor !== "all") query.actorType = filters.actor as AuditQuery["actorType"];
        if (filters.action !== "all") query.action = filters.action;

        const res = await client.audit(ws.id, query);
        setNextCursor(res.nextCursor || null);
        return res.entries;
    };

    const loadData = async (cursor?: string) => {
        try {
            setLoading(true);
            const page = await fetchPage(cursor, { actor: actorFilter, action: actionFilter });
            if (page) setEntries(page);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to load audit logs"));
        } finally {
            setLoading(false);
        }
    };

    const loadNextPage = async () => {
        if (!nextCursor) return;
        try {
            setLoading(true);
            const page = await fetchPage(nextCursor, { actor: actorFilter, action: actionFilter });
            if (page) {
                setEntries((prev) => [...prev, ...page]);
                setCursorHistory((prev) => [...prev, nextCursor]);
            }
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to load audit logs"));
        } finally {
            setLoading(false);
        }
    };

    const loadPreviousPage = async () => {
        if (cursorHistory.length === 0) return;
        try {
            setLoading(true);
            const targetIndex = cursorHistory.length - 1;
            const cursor = targetIndex === 0 ? undefined : cursorHistory[targetIndex - 1];
            const page = await fetchPage(cursor, { actor: actorFilter, action: actionFilter });
            if (page) {
                setEntries(page);
                setCursorHistory((prev) => prev.slice(0, targetIndex));
            }
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to load audit logs"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setCursorHistory([]);
        loadData();
    }, [workspaceSlug, actorFilter, actionFilter]);

    const getActorIcon = (actorType: string) => {
        switch (actorType) {
            case "user":
                return <User className="h-3.5 w-3.5" />;
            case "device":
                return <Laptop className="h-3.5 w-3.5" />;
            case "service_token":
                return <Key className="h-3.5 w-3.5" />;
            default:
                return <Shield className="h-3.5 w-3.5" />;
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar
                currentWorkspace={currentWorkspace}
                workspaces={workspaces}
                user={user}
                userRole={currentWorkspace?.role}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Immutable record of security events, key access, and workspace modifications
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        <Select value={actorFilter} onValueChange={(val) => setActorFilter(val)}>
                            <SelectTrigger className="w-36 h-9 text-xs" aria-label="Filter by actor type">
                                <SelectValue placeholder="Actor Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actors</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="device">Device</SelectItem>
                                <SelectItem value="service_token">Service Token</SelectItem>
                                <SelectItem value="system">System</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={actionFilter} onValueChange={(val) => setActionFilter(val)}>
                            <SelectTrigger className="w-48 h-9 text-xs" aria-label="Filter by action">
                                <SelectValue placeholder="Action" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Actions</SelectItem>
                                {/* Only values the API actually writes. The old list
                                    offered "secret.write", which matched nothing. */}
                                <SelectItem value="secret.read">secret.read</SelectItem>
                                <SelectItem value="secret.create">secret.create</SelectItem>
                                <SelectItem value="secret.update">secret.update</SelectItem>
                                <SelectItem value="secret.delete">secret.delete</SelectItem>
                                <SelectItem value="secret.rollback">secret.rollback</SelectItem>
                                <SelectItem value="secrets.export">secrets.export</SelectItem>
                                <SelectItem value="secrets.bulk_write">secrets.bulk_write</SelectItem>
                                <SelectItem value="member.invite">member.invite</SelectItem>
                                <SelectItem value="member.accept">member.accept</SelectItem>
                                <SelectItem value="member.remove">member.remove</SelectItem>
                                <SelectItem value="member.role_change">member.role_change</SelectItem>
                                <SelectItem value="member.access_change">member.access_change</SelectItem>
                                <SelectItem value="token.create">token.create</SelectItem>
                                <SelectItem value="token.revoke">token.revoke</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Card className="border-border/60 shadow-sm">
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-semibold">Timestamp</TableHead>
                                    <TableHead className="font-semibold">Actor</TableHead>
                                    <TableHead className="font-semibold">Action</TableHead>
                                    <TableHead className="font-semibold">Target</TableHead>
                                    <TableHead className="font-semibold text-right">IP Address</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                                            Loading audit trail...
                                        </TableCell>
                                    </TableRow>
                                ) : entries.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-36 text-center text-muted-foreground">
                                            <History className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                                            <p className="font-medium text-foreground">No audit entries found</p>
                                            <p className="text-xs mt-1">
                                                Audit log records all security events in real-time.
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    entries.map((entry) => (
                                        <TableRow
                                            key={entry.id}
                                            className="hover:bg-muted/40 font-mono text-xs cursor-pointer"
                                            onClick={() => setDetailEntry(entry)}
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    setDetailEntry(entry);
                                                }
                                            }}
                                        >
                                            <TableCell className="text-muted-foreground">
                                                {new Date(entry.createdAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Badge
                                                        variant="outline"
                                                        className="flex shrink-0 items-center space-x-1 capitalize font-normal"
                                                    >
                                                        {getActorIcon(entry.actorType)}
                                                        <span>{entry.actorType}</span>
                                                    </Badge>
                                                    {/* Name, truncated. Clicking the row
                                                    opens the full details. */}
                                                    <span className="max-w-40 truncate font-sans text-xs text-foreground">
                                                        {entry.actorName ?? entry.actorId?.slice(0, 8) ?? "—"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className="font-mono text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-0">
                                                    {entry.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {entry.targetType
                                                    ? `${entry.targetType}:${entry.targetId ? entry.targetId.slice(0, 8) : ""}...`
                                                    : "—"}
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {/* Never invent an address: a row with no
                                                recorded IP previously displayed
                                                127.0.0.1, which reads as evidence
                                                that the action came from localhost. */}
                                                {entry.ip || "—"}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>

                    {/* Pagination sits outside CardContent so its top border still
                    spans the full card width. Pages accumulate and Previous walks
                    back through the cursor chain, because replacing the rows
                    discarded whatever the user was already looking at. */}
                    {(nextCursor || cursorHistory.length > 0) && (
                        <div className="p-4 border-t border-border/40 flex items-center justify-between gap-3">
                            <span className="text-xs text-muted-foreground">
                                Showing {entries.length} entries
                                {cursorHistory.length > 0 && ` across ${cursorHistory.length + 1} pages`}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={loadPreviousPage}
                                    disabled={loading || cursorHistory.length === 0}
                                >
                                    <ChevronLeft className="mr-1 h-4 w-4" /> Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => loadNextPage()}
                                    disabled={loading || !nextCursor}
                                >
                                    Next <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                <AuditEntryDetailDialog entry={detailEntry} onOpenChange={(open) => !open && setDetailEntry(null)} />
            </main>
        </div>
    );
}
