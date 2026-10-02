"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import {
  History,
  Shield,
  Loader2,
  ChevronRight,
  User,
  Laptop,
  Key,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { client } from "@/lib/api-client";
import type { WorkspaceDto, AuditEntryDto, UserDto } from "@repo/core";
import { toast } from "sonner";

export default function WorkspaceAuditPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceSlug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDto>();
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceDto>();
  const [entries, setEntries] = useState<AuditEntryDto[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [actorFilter, setActorFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const loadData = async (cursor?: string) => {
    try {
      setLoading(true);
      const meRes = await client.me();
      setUser(meRes.user);
      setWorkspaces(meRes.workspaces);

      const ws = meRes.workspaces.find((w) => w.slug === workspaceSlug);
      if (!ws) {
        toast.error("Workspace not found");
        router.push("/");
        return;
      }
      setCurrentWorkspace(ws);

      const query: any = { limit: 20 };
      if (cursor) query.cursor = cursor;
      if (actorFilter !== "all") query.actorType = actorFilter;
      if (actionFilter !== "all") query.action = actionFilter;

      const res = await client.audit(ws.id, query);
      setEntries(res.entries);
      setNextCursor(res.nextCursor || null);
    } catch (err: any) {
      toast.error(err.message || "Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
          <div className="flex items-center space-x-3">
            <Select value={actorFilter} onValueChange={(val) => setActorFilter(val)}>
              <SelectTrigger className="w-36 h-9 text-xs">
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
              <SelectTrigger className="w-40 h-9 text-xs">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="secret.read">secret.read</SelectItem>
                <SelectItem value="secret.write">secret.write</SelectItem>
                <SelectItem value="secret.delete">secret.delete</SelectItem>
                <SelectItem value="secrets.export">secrets.export</SelectItem>
                <SelectItem value="member.invite">member.invite</SelectItem>
                <SelectItem value="member.remove">member.remove</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="border-border/60 shadow-sm">
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
                    <p className="text-xs mt-1">Audit log records all security events in real-time.</p>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id} className="hover:bg-muted/40 font-mono text-xs">
                    <TableCell className="text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="flex items-center space-x-1 capitalize font-normal">
                          {getActorIcon(entry.actorType)}
                          <span>{entry.actorType}</span>
                        </Badge>
                        <span className="truncate max-w-[120px] text-muted-foreground">
                          {entry.actorId ? `${entry.actorId.slice(0, 8)}...` : "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="font-mono text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 border-0">
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.targetType ? `${entry.targetType}:${entry.targetId ? entry.targetId.slice(0, 8) : ""}...` : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {entry.ip || "127.0.0.1"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {nextCursor && (
            <div className="p-4 border-t border-border/40 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => loadData(nextCursor)}
                disabled={loading}
              >
                Next Page <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
