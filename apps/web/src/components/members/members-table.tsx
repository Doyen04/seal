"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { MemberDto, UserDto } from "@repo/core";

interface MembersTableProps {
  loading: boolean;
  members: MemberDto[];
  user?: UserDto;
  isAdminOrOwner: boolean;
  onRoleChange: (member: MemberDto, newRole: "admin" | "editor" | "viewer") => void;
  onRemoveClick: (member: MemberDto) => void;
}

export function MembersTable({
  loading,
  members,
  user,
  isAdminOrOwner,
  onRoleChange,
  onRemoveClick,
}: MembersTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="font-semibold">User</TableHead>
          <TableHead className="font-semibold">Email</TableHead>
          <TableHead className="font-semibold">Role</TableHead>
          <TableHead className="font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading team members...
            </TableCell>
          </TableRow>
        ) : members.map((mem) => (
          <TableRow key={mem.userId} className="hover:bg-muted/40">
            <TableCell className="font-medium">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center border border-primary/20">
                  {(mem.name || mem.email).charAt(0).toUpperCase()}
                </div>
                <span>{mem.name || "Member"}</span>
              </div>
            </TableCell>
            <TableCell className="text-muted-foreground text-sm">
              {mem.email}
            </TableCell>
            <TableCell>
              {isAdminOrOwner && mem.role !== "owner" && mem.userId !== user?.id ? (
                <Select
                  value={mem.role}
                  onValueChange={(val: any) => onRoleChange(mem, val)}
                >
                  <SelectTrigger className="w-32 h-8 text-xs font-mono">
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
            <TableCell className="text-right">
              {isAdminOrOwner && mem.role !== "owner" && mem.userId !== user?.id && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveClick(mem)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
