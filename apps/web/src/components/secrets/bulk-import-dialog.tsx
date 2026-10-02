"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  envName?: string;
  onImport: (bulkText: string) => Promise<void>;
}

export function BulkImportDialog({
  open,
  onOpenChange,
  envName,
  onImport,
}: BulkImportDialogProps) {
  const [bulkText, setBulkText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onImport(bulkText);
      setBulkText("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Import .env File</DialogTitle>
            <DialogDescription>
              Paste the contents of your .env file below to bulk import secret keys into {envName || "environment"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder={`STRIPE_KEY=sk_test_123\nDATABASE_URL=postgres://...`}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              className="font-mono text-xs min-h-[200px]"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !bulkText}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Import Secrets"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
