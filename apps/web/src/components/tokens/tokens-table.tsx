"use client";

import { Key, Loader2, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ServiceTokenDto } from "@repo/core";

export interface ServiceTokenItem extends ServiceTokenDto {
    environmentId: string;
    environmentName?: string;
    projectName?: string;
}

interface TokensTableProps {
    loading: boolean;
    tokens: ServiceTokenItem[];
    isAdminOrOwner: boolean;
    onRevokeClick: (token: ServiceTokenItem) => void;
}

export function TokensTable({ loading, tokens, isAdminOrOwner, onRevokeClick }: TokensTableProps) {
    return (
        <Table className="min-w-190">
            <TableHeader>
                <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Project & Environment</TableHead>
                    <TableHead className="font-semibold">Token Prefix</TableHead>
                    <TableHead className="font-semibold">Last Used</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                            Loading service tokens...
                        </TableCell>
                    </TableRow>
                ) : tokens.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-36 text-center text-muted-foreground">
                            <Key className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                            <p className="font-medium text-foreground">No service tokens created</p>
                            <p className="text-xs mt-1">Create a service token to connect SDKs or CLI pipelines.</p>
                        </TableCell>
                    </TableRow>
                ) : (
                    tokens.map((tok) => (
                        <TableRow key={tok.id} className="hover:bg-muted/40">
                            <TableCell className="font-medium">{tok.name}</TableCell>
                            <TableCell>
                                <div className="flex items-center space-x-2 text-xs">
                                    <span className="font-semibold text-foreground">{tok.projectName}</span>
                                    <span>/</span>
                                    <Badge variant="outline" className="capitalize">
                                        {tok.environmentName}
                                    </Badge>
                                </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {tok.prefix}...{tok.last4}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                                {tok.lastUsedAt ? new Date(tok.lastUsedAt).toLocaleString() : "Never"}
                            </TableCell>
                            <TableCell className="text-right">
                                {isAdminOrOwner && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onRevokeClick(tok)}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                        aria-label={`Revoke service token ${tok.name}`}
                                        title="Revoke token"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );
}
