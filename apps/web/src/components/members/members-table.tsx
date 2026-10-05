"use client";

import { Loader2, ShieldCheck, Trash2, Users } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { MemberDto, UserDto } from "@repo/core";

interface MembersTableProps {
    loading: boolean;
    members: MemberDto[];
    user?: UserDto;
    isAdminOrOwner: boolean;
    onRoleChange: (member: MemberDto, newRole: "admin" | "editor" | "viewer") => void;
    onAccessClick: (member: MemberDto) => void;
    onRemoveClick: (member: MemberDto) => void;
}

export function MembersTable({
    loading,
    members,
    user,
    isAdminOrOwner,
    onRoleChange,
    onAccessClick,
    onRemoveClick,
}: MembersTableProps) {
    return (
        <Table className="min-w-150">
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Environment Access</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                            Loading team members...
                        </TableCell>
                    </TableRow>
                ) : members.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            <Users className="h-6 w-6 mx-auto mb-2 opacity-50" />
                            No members yet. Invite someone to get started.
                        </TableCell>
                    </TableRow>
                ) : (
                    members.map((mem) => {
                        const manageable = isAdminOrOwner && mem.role !== "owner" && mem.userId !== user?.id;
                        const overrideCount = mem.access?.length ?? 0;
                        return (
                            <TableRow key={mem.userId} className="hover:bg-muted/40">
                                <TableCell className="font-medium">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                                            {(mem.name || mem.email).charAt(0).toUpperCase()}
                                        </div>
                                        <span>{mem.name || "Member"}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-sm">{mem.email}</TableCell>
                                <TableCell>
                                    {manageable ? (
                                        <Select value={mem.role} onValueChange={(val: any) => onRoleChange(mem, val)}>
                                            <SelectTrigger
                                                className="w-32 h-8 text-xs font-mono"
                                                aria-label={`Role for ${mem.name || mem.email}`}
                                            >
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin">ADMIN</SelectItem>
                                                <SelectItem value="editor">EDITOR</SelectItem>
                                                <SelectItem value="viewer">VIEWER</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Badge variant="outline" className="font-mono uppercase text-xs">
                                            {mem.role}
                                        </Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {overrideCount > 0 ? (
                                        <Badge variant="outline" className="text-xs">
                                            {overrideCount} override{overrideCount === 1 ? "" : "s"}
                                        </Badge>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Inherits role</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {manageable && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onAccessClick(mem)}
                                                className="h-8 w-8 text-muted-foreground"
                                                aria-label={`Edit environment access for ${mem.name || mem.email}`}
                                                title="Edit environment access"
                                            >
                                                <ShieldCheck className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {manageable && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onRemoveClick(mem)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                aria-label={`Remove ${mem.name || mem.email} from workspace`}
                                                title="Remove member"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </TableBody>
        </Table>
    );
}
