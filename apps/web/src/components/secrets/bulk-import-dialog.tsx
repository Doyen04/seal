"use client";

import { useMemo, useRef, useState } from "react";
import { fileTypeFromBlob } from "file-type";
import { FileUp, Loader2, Upload } from "lucide-react";
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

const MAX_FILE_BYTES = 256 * 1024;

// Detects the file's real format from its magic number. Guessing from the
// name or from encoding is unreliable: a PDF begins with readable ASCII, and
// null bytes are valid UTF-8, so neither encoding nor extension rules catch
// every binary format. Magic numbers do.
const BINARY_FORMAT_LABEL: Record<string, string> = {
    pdf: "a PDF",
    zip: "an archive",
    doc: "a Word document",
    docx: "a Word document",
    xls: "a spreadsheet",
    xlsx: "a spreadsheet",
    ppt: "a presentation",
    pptx: "a presentation",
};

export function BulkImportDialog({ open, onOpenChange, envName, onImport }: BulkImportDialogProps) {
    const [bulkText, setBulkText] = useState("");
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [fileError, setFileError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Counts lines the same way the import parser reads them, so the count
    // matches what will actually be imported.
    const parsedCount = useMemo(() => {
        let count = 0;
        for (const rawLine of bulkText.split("\n")) {
            const line = rawLine.trim();
            if (!line || line.startsWith("#")) continue;
            if (line.includes("=")) count += 1;
        }
        return count;
    }, [bulkText]);

    const reset = () => {
        setBulkText("");
        setFileName(null);
        setFileError(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleFile = async (file: File | undefined) => {
        if (!file) return;
        setFileError(null);

        if (file.size > MAX_FILE_BYTES) {
            setFileError(`"${file.name}" is larger than 256 KB. Split it into smaller imports.`);
            return;
        }
        // The file picker's filter cannot be trusted as a correctness guarantee: it
        // cannot express names like ".env.local" or ".env.production", a user
        // can override it, and it does not apply to files supplied any other way.
        // So the bytes themselves have to be checked.
        try {
            const detected = await fileTypeFromBlob(file);
            if (detected) {
                const label = BINARY_FORMAT_LABEL[detected.ext] ?? "a binary file";
                setFileError(`"${file.name}" is ${label}, not a plain text environment file.`);
                return;
            }
        } catch {
            // Detection is a best-effort hint, so fall through to the text
            // import rather than blocking the user outright.
        }

        try {
            setBulkText(await file.text());
            setFileName(file.name);
        } catch {
            setFileError(`Could not read "${file.name}".`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onImport(bulkText);
            reset();
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => {
                if (!next) reset();
                onOpenChange(next);
            }}
        >
            <DialogContent className="sm:max-w-lg">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Import .env File</DialogTitle>
                        <DialogDescription>
                            Choose a .env file or paste its contents to bulk import secret keys into{" "}
                            {envName || "environment"}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                onChange={(e) => handleFile(e.target.files?.[0])}
                            />
                            <div className="flex flex-wrap items-center gap-2">
                                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                                    <FileUp className="mr-2 h-4 w-4" /> Choose file
                                </Button>
                                {fileName && (
                                    <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
                                        <Upload className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate">{fileName}</span>
                                    </span>
                                )}
                            </div>
                            {fileError && <p className="text-xs text-destructive">{fileError}</p>}
                            {parsedCount > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {parsedCount} {parsedCount === 1 ? "key" : "keys"} detected
                                </p>
                            )}
                            {parsedCount === 0 && bulkText.trim().length > 0 && (
                                <p className="text-xs text-destructive">No KEY=VALUE lines found in this file.</p>
                            )}
                        </div>

                        <Textarea
                            placeholder={`STRIPE_KEY=sk_test_123\nDATABASE_URL=postgres://...`}
                            value={bulkText}
                            onChange={(e) => {
                                setBulkText(e.target.value);
                                setFileError(null);
                            }}
                            className="font-mono text-xs min-h-50 max-h-[40vh] field-sizing-fixed w-full min-w-0 break-words"
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Any text file works, including .env.local, .env.production, and .envrc. Images and other
                            binary files are rejected. Blank lines and lines starting with # are ignored. Surrounding
                            quotes are stripped.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !bulkText.trim()}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Import Secrets"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
