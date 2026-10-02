"use client";

import { Check, Copy, Eye, EyeOff, History, Loader2, Lock, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { SecretMetaDto } from "@repo/core";

interface SecretsTableProps {
  loading: boolean;
  secrets: SecretMetaDto[];
  revealedValues: Record<string, string>;
  copiedKey: string | null;
  isViewer: boolean;
  onReveal: (key: string) => void;
  onCopy: (key: string) => void;
  onHistoryClick: (sec: SecretMetaDto) => void;
  onEditClick: (sec: SecretMetaDto) => void;
  onDeleteClick: (sec: SecretMetaDto) => void;
}

export function SecretsTable({
  loading,
  secrets,
  revealedValues,
  copiedKey,
  isViewer,
  onReveal,
  onCopy,
  onHistoryClick,
  onEditClick,
  onDeleteClick,
}: SecretsTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-[30%] font-semibold">Key</TableHead>
          <TableHead className="w-[40%] font-semibold">Value</TableHead>
          <TableHead className="w-[10%] font-semibold text-center">Version</TableHead>
          <TableHead className="w-[20%] font-semibold text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              Loading secrets...
            </TableCell>
          </TableRow>
        ) : secrets.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="h-40 text-center text-muted-foreground">
              <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="font-medium text-foreground">No secrets in this environment</p>
              <p className="text-xs mt-1">Add a key or import a .env file to get started.</p>
            </TableCell>
          </TableRow>
        ) : (
          secrets.map((sec) => {
            const isRevealed = revealedValues[sec.key] !== undefined;
            const val = revealedValues[sec.key];

            return (
              <TableRow key={sec.id} className="group hover:bg-muted/40">
                <TableCell className="font-mono text-sm font-semibold">
                  {sec.key}
                </TableCell>

                <TableCell className="font-mono text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="truncate max-w-[280px]">
                      {isRevealed ? (
                        <span className="text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded">
                          {val}
                        </span>
                      ) : (
                        <span className="text-muted-foreground tracking-widest">
                          ••••••••••••••••
                        </span>
                      )}
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-center font-mono text-xs">
                  <Badge variant="outline" className="font-mono">
                    v{sec.version}
                  </Badge>
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onReveal(sec.key)}
                      title={isRevealed ? "Hide value" : "Reveal value (30s)"}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      {isRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onCopy(sec.key)}
                      title="Copy value"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      {copiedKey === sec.key ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onHistoryClick(sec)}
                      title="Version History"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <History className="h-4 w-4" />
                    </Button>

                    {!isViewer && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEditClick(sec)}
                          title="Edit secret"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteClick(sec)}
                          title="Delete secret"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
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
