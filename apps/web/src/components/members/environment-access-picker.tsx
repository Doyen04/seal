"use client";

import { useEffect, useState } from "react";
import { FolderKanban, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AccessOverride } from "@repo/core";

export interface AccessPickerProject {
    id: string;
    name: string;
    environments: { id: string; name: string }[];
}

/** Keyed by environment id. A missing key means "inherit the workspace role". */
export type AccessMap = Record<string, AccessOverride | undefined>;

interface EnvironmentAccessPickerProps {
    projects: AccessPickerProject[];
    value: AccessMap;
    onChange: (next: AccessMap) => void;
    disabled?: boolean;
}

const ACCESS_LABEL: Record<AccessOverride, string> = {
    none: "No access",
    read: "Read only",
    write: "Read and write",
};

export function accessMapToInput(value: AccessMap): { environmentId: string; access: AccessOverride }[] {
    return Object.entries(value)
        .filter((entry): entry is [string, AccessOverride] => entry[1] !== undefined)
        .map(([environmentId, access]) => ({ environmentId, access }));
}

export function EnvironmentAccessPicker({ projects, value, onChange, disabled }: EnvironmentAccessPickerProps) {
    const [activeProjectId, setActiveProjectId] = useState<string>("");

    // Only ever expand one project at a time. Listing every environment of every
    // project at once does not scale past a handful of projects.
    useEffect(() => {
        if (!activeProjectId || !projects.some((p) => p.id === activeProjectId)) {
            setActiveProjectId(projects[0]?.id ?? "");
        }
    }, [projects, activeProjectId]);

    const activeProject = projects.find((p) => p.id === activeProjectId);

    const countFor = (projectId: string) =>
        projects.find((p) => p.id === projectId)?.environments.filter((env) => value[env.id] !== undefined).length ?? 0;

    const setAllInProject = (project: AccessPickerProject, access: AccessOverride | undefined) => {
        const next = { ...value };
        for (const env of project.environments) {
            if (access === undefined) delete next[env.id];
            else next[env.id] = access;
        }
        onChange(next);
    };

    // A flat list of what is currently overridden, so switching projects never
    // hides the fact that something was already set elsewhere.
    const summary = projects.flatMap((project) =>
        project.environments
            .filter((env) => value[env.id] !== undefined)
            .map((env) => ({
                key: env.id,
                projectName: project.name,
                environmentName: env.name,
                access: value[env.id] as AccessOverride,
            })),
    );

    const clearAll = () => onChange({});

    return (
        <div className="space-y-3">
            <div>
                <p className="text-sm font-medium">Environment access</p>
                <p className="text-xs text-muted-foreground">
                    Pick a project, then set access per environment. Anything left on Inherit follows the workspace role
                    above.
                </p>
            </div>

            {projects.length === 0 ? (
                <p className="text-xs text-muted-foreground">This workspace has no projects yet.</p>
            ) : (
                <>
                    <div className="flex flex-wrap items-center gap-2">
                        <Select value={activeProjectId} onValueChange={setActiveProjectId} disabled={disabled}>
                            <SelectTrigger className="flex-1 min-w-45" aria-label="Choose a project to configure">
                                <SelectValue placeholder="Choose a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => {
                                    const count = countFor(project.id);
                                    return (
                                        <SelectItem key={project.id} value={project.id}>
                                            {project.name}
                                            {count > 0 ? ` (${count} set)` : ""}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>

                        {activeProject && activeProject.environments.length > 0 && (
                            <>
                                <Button
                                    type="button"
                                    size="xs"
                                    className="h-8"
                                    variant="ghost"
                                    disabled={disabled}
                                    onClick={() => setAllInProject(activeProject, undefined)}
                                >
                                    Inherit all
                                </Button>
                                <Button
                                    type="button"
                                    size="xs"
                                    className="h-8"
                                    variant="ghost"
                                    disabled={disabled}
                                    onClick={() => setAllInProject(activeProject, "read")}
                                >
                                    Read all
                                </Button>
                            </>
                        )}
                    </div>

                    {activeProject && (
                        <div className="rounded-lg border border-border/60 divide-y divide-border/40 max-h-56 overflow-y-auto">
                            {activeProject.environments.map((env) => (
                                <div key={env.id} className="flex items-center justify-between gap-2 px-3 py-2">
                                    <span className="flex min-w-0 items-center gap-2 text-sm">
                                        <FolderKanban className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                        <span className="truncate">{env.name}</span>
                                    </span>
                                    <Select
                                        value={value[env.id] ?? "inherit"}
                                        onValueChange={(next) => {
                                            const updated = { ...value };
                                            if (next === "inherit") delete updated[env.id];
                                            else updated[env.id] = next as AccessOverride;
                                            onChange(updated);
                                        }}
                                        disabled={disabled}
                                    >
                                        <SelectTrigger
                                            className="w-32 shrink-0 sm:w-40"
                                            aria-label={`Access for ${activeProject.name} ${env.name}`}
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="inherit">Inherit role</SelectItem>
                                            <SelectItem value="none">{ACCESS_LABEL.none}</SelectItem>
                                            <SelectItem value="read">{ACCESS_LABEL.read}</SelectItem>
                                            <SelectItem value="write">{ACCESS_LABEL.write}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                            {activeProject.environments.length === 0 && (
                                <p className="px-3 py-2 text-xs text-muted-foreground">
                                    This project has no environments.
                                </p>
                            )}
                        </div>
                    )}

                    {summary.length > 0 && (
                        <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-medium">
                                    {summary.length} override{summary.length === 1 ? "" : "s"} across all projects
                                </p>
                                <Button
                                    type="button"
                                    size="xs"
                                    variant="ghost"
                                    className="h-8"
                                    disabled={disabled}
                                    onClick={clearAll}
                                >
                                    Clear all
                                </Button>
                            </div>
                            <div className="mt-2 max-h-24 overflow-y-auto pr-1">
                                <div className="flex flex-wrap gap-1.5">
                                    {summary.map((item) => (
                                        <Badge
                                            key={item.key}
                                            variant="outline"
                                            className="gap-1 text-[11px] font-normal"
                                        >
                                            {item.projectName} / {item.environmentName}
                                            <span className="text-muted-foreground">{ACCESS_LABEL[item.access]}</span>
                                            <button
                                                type="button"
                                                disabled={disabled}
                                                onClick={() => {
                                                    const next = { ...value };
                                                    delete next[item.key];
                                                    onChange(next);
                                                }}
                                                aria-label={`Remove override for ${item.projectName} ${item.environmentName}`}
                                                className="-m-1 inline-flex size-7 shrink-0 items-center justify-center rounded-full transition-colors hover:text-foreground"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
