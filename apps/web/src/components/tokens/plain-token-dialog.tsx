"use client";

import { useState } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface PlainTokenDialogProps {
  token: string | null;
  onClose: () => void;
}

export function PlainTokenDialog({ token, onClose }: PlainTokenDialogProps) {
  const [copied, setCopied] = useState(false);

  return (
    <Dialog open={!!token} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md border-amber-500/50">
        <DialogHeader>
          <div className="mx-auto h-12 w-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center">Save your service token!</DialogTitle>
          <DialogDescription className="text-center text-amber-500 font-medium">
            You will not be able to see this token again!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input
            readOnly
            value={token || ""}
            className="font-mono text-xs bg-muted border-amber-500/30"
          />
        </div>

        <DialogFooter>
          <Button
            className="w-full"
            onClick={() => {
              if (token) {
                navigator.clipboard.writeText(token);
                setCopied(true);
                toast.success("Token copied to clipboard!");
                setTimeout(() => setCopied(false), 2000);
              }
            }}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-emerald-400" /> Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" /> Copy Token
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
