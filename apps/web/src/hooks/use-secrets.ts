"use client";

import { useEffect, useRef, useState } from "react";
import { client } from "@/lib/api-client";
import type { EnvironmentDto, SecretMetaDto, SecretVersionDto } from "@repo/core";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/error-message";

export function useSecrets(activeEnv?: EnvironmentDto) {
    const [secrets, setSecrets] = useState<SecretMetaDto[]>([]);
    const [loadingSecrets, setLoadingSecrets] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const REVEAL_TIMEOUT_MS = 30_000;
    const revealTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const clearRevealTimer = (key: string) => {
        const existing = revealTimers.current.get(key);
        if (existing !== undefined) {
            clearTimeout(existing);
            revealTimers.current.delete(key);
        }
    };

    // Drop pending timers so a value cannot reappear or vanish after the
    // component goes away.
    useEffect(() => {
        const timers = revealTimers.current;
        return () => {
            for (const timer of timers.values()) clearTimeout(timer);
            timers.clear();
        };
    }, []);

    // Modal States
    const [addOpen, setAddOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<SecretMetaDto | null>(null);
    const [editValue, setEditValue] = useState("");
    const [editLoading, setEditLoading] = useState(false);

    const [conflictOpen, setConflictOpen] = useState(false);
    const [conflictServerVersion, setConflictServerVersion] = useState<number | null>(null);
    const [conflictPendingValue, setConflictPendingValue] = useState("");

    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SecretMetaDto | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [bulkOpen, setBulkOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [exportData, setExportData] = useState<string>("");

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyTarget, setHistoryTarget] = useState<SecretMetaDto | null>(null);
    const [versions, setVersions] = useState<SecretVersionDto[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const loadSecrets = async (envId: string) => {
        try {
            setLoadingSecrets(true);
            const res = await client.listSecrets(envId);
            setSecrets(res.secrets);
            setRevealedValues({});
            setLoadError(null);
        } catch (err: any) {
            // Clear first. Keeping the previous list meant a failed fetch after
            // switching environments rendered the old environment's keys and
            // decrypted values under the newly selected tab, and a failed first
            // load looked like an empty environment.
            setSecrets([]);
            setRevealedValues({});
            setLoadError(toUserMessage(err, "Failed to load secrets"));
            toast.error(toUserMessage(err, "Failed to load secrets"));
        } finally {
            setLoadingSecrets(false);
        }
    };

    const handleReveal = async (key: string) => {
        if (!activeEnv) return;
        if (revealedValues[key] !== undefined) {
            // Hide it now and cancel its pending auto-hide, otherwise that timer
            // would fire later and wipe a value re-revealed in the meantime.
            clearRevealTimer(key);
            const next = { ...revealedValues };
            delete next[key];
            setRevealedValues(next);
            return;
        }

        try {
            const sec = await client.getSecret(activeEnv.id, key);
            clearRevealTimer(key);
            setRevealedValues((prev) => ({ ...prev, [key]: sec.value }));

            const timer = setTimeout(() => {
                revealTimers.current.delete(key);
                setRevealedValues((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });
            }, REVEAL_TIMEOUT_MS);
            revealTimers.current.set(key, timer);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to decrypt secret value"));
        }
    };

    const handleCopy = async (key: string) => {
        if (!activeEnv) return;
        try {
            let val = revealedValues[key];
            if (val === undefined) {
                const sec = await client.getSecret(activeEnv.id, key);
                val = sec.value;
            }
            await navigator.clipboard.writeText(val);
            setCopiedKey(key);
            toast.success(`Copied "${key}" to clipboard`);
            setTimeout(() => setCopiedKey(null), 2000);
        } catch {
            toast.error("Failed to copy value");
        }
    };

    const handleAddSecret = async (key: string, value: string) => {
        if (!activeEnv) return;
        try {
            await client.putSecret(activeEnv.id, key, { value });
            toast.success(`Secret "${key}" created!`);
            loadSecrets(activeEnv.id);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to add secret"));
            throw err;
        }
    };

    const openEditModal = async (sec: SecretMetaDto) => {
        if (!activeEnv) return;
        setEditTarget(sec);
        setEditValue("");
        setEditLoading(true);
        try {
            const valDto = await client.getSecret(activeEnv.id, sec.key);
            setEditValue(valDto.value);
            setEditOpen(true);
        } catch (err: any) {
            // Opening the dialog anyway dropped the user into an empty textarea
            // that looked like a secret whose value was the empty string, with
            // no message at all.
            toast.error(toUserMessage(err, "Could not load this secret's current value"));
        } finally {
            setEditLoading(false);
        }
    };

    const handleEditSecret = async (valueToSave: string, forceOverwrite = false) => {
        if (!activeEnv || !editTarget) return;
        setEditLoading(true);

        try {
            await client.putSecret(activeEnv.id, editTarget.key, {
                value: valueToSave,
                ...(forceOverwrite ? {} : { baseVersion: editTarget.version }),
            });

            toast.success(`Secret "${editTarget.key}" updated!`);
            setEditOpen(false);
            setConflictOpen(false);
            setEditTarget(null);
            loadSecrets(activeEnv.id);
        } catch (err: any) {
            if (err.status === 409) {
                // Remember what the user actually typed. editValue still holds
                // the value fetched when the dialog opened, so the conflict
                // dialog was showing the stale server value under the heading
                // "Your Pending Value".
                setConflictPendingValue(valueToSave);
                setConflictServerVersion(err.details?.serverVersion || null);
                setEditOpen(false);
                setConflictOpen(true);
            } else {
                toast.error(toUserMessage(err, "Failed to update secret"));
            }
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteSecret = async () => {
        if (!activeEnv || !deleteTarget) return;
        setDeleteLoading(true);

        try {
            await client.deleteSecret(activeEnv.id, deleteTarget.key, deleteTarget.version);
            toast.success(`Secret "${deleteTarget.key}" deleted!`);
            setDeleteOpen(false);
            setDeleteTarget(null);
            loadSecrets(activeEnv.id);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to delete secret"));
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleBulkImport = async (bulkText: string) => {
        if (!activeEnv) return;
        try {
            const lines = bulkText.split("\n");
            const items: { key: string; value: string }[] = [];

            for (let line of lines) {
                line = line.trim();
                if (!line || line.startsWith("#")) continue;
                const eqIdx = line.indexOf("=");
                if (eqIdx === -1) continue;
                const key = line.slice(0, eqIdx).trim();
                let val = line.slice(eqIdx + 1).trim();
                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.slice(1, -1);
                }
                if (key) {
                    items.push({ key, value: val });
                }
            }

            if (items.length === 0) {
                toast.error("No valid secret keys found in .env text");
                return;
            }

            const res = await client.bulkSecrets(activeEnv.id, { items });
            toast.success(`Bulk import completed (${res.applied.length} secrets processed)!`);
            loadSecrets(activeEnv.id);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Bulk import failed"));
            throw err;
        }
    };

    const openExportModal = async () => {
        if (!activeEnv) return;
        try {
            const exp = await client.exportEnvironment(activeEnv.id);
            const envStr = Object.entries(exp.secrets)
                .map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`)
                .join("\n");
            setExportData(envStr);
            setExportOpen(true);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to export secrets"));
        }
    };

    const openHistoryModal = async (sec: SecretMetaDto) => {
        setHistoryTarget(sec);
        setHistoryLoading(true);
        setHistoryOpen(true);

        try {
            const res = await client.listSecretVersions(sec.id);
            setVersions(res.versions);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to load version history"));
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleRollback = async (version: number) => {
        if (!historyTarget || !activeEnv) return;
        try {
            await client.rollbackSecret(historyTarget.id, version);
            toast.success(`Rolled back "${historyTarget.key}" to version ${version}`);
            setHistoryOpen(false);
            loadSecrets(activeEnv.id);
        } catch (err: any) {
            toast.error(toUserMessage(err, "Rollback failed"));
        }
    };

    return {
        secrets,
        loadingSecrets,
        loadError,
        revealedValues,
        copiedKey,
        loadSecrets,
        handleReveal,
        handleCopy,
        handleAddSecret,
        openEditModal,
        handleEditSecret,
        handleDeleteSecret,
        handleBulkImport,
        openExportModal,
        openHistoryModal,
        handleRollback,
        // Dialog state props
        addOpen,
        setAddOpen,
        editOpen,
        setEditOpen,
        editTarget,
        editValue,
        editLoading,
        conflictOpen,
        setConflictOpen,
        conflictServerVersion,
        conflictPendingValue,
        deleteOpen,
        setDeleteOpen,
        deleteTarget,
        setDeleteTarget,
        deleteLoading,
        bulkOpen,
        setBulkOpen,
        exportOpen,
        setExportOpen,
        exportData,
        historyOpen,
        setHistoryOpen,
        historyTarget,
        versions,
        historyLoading,
    };
}
