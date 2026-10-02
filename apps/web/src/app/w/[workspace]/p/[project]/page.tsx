"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Download, FileSpreadsheet, Search } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SecretsTable } from "@/components/secrets/secrets-table";
import { AddSecretDialog } from "@/components/secrets/add-secret-dialog";
import { EditSecretDialog } from "@/components/secrets/edit-secret-dialog";
import { ConflictDialog } from "@/components/secrets/conflict-dialog";
import { DeleteSecretDialog } from "@/components/secrets/delete-secret-dialog";
import { BulkImportDialog } from "@/components/secrets/bulk-import-dialog";
import { ExportSecretsDialog } from "@/components/secrets/export-secrets-dialog";
import { VersionHistoryDialog } from "@/components/secrets/version-history-dialog";
import { useSecrets } from "@/hooks/use-secrets";
import { client } from "@/lib/api-client";
import type {
  WorkspaceSummaryDto,
  ProjectDetailDto,
  EnvironmentDto,
  UserDto,
} from "@repo/core";
import { toast } from "sonner";

export default function ProjectSecretsPage({
  params,
}: {
  params: Promise<{ workspace: string; project: string }>;
}) {
  const { workspace: workspaceSlug, project: projectSlug } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserDto>();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummaryDto[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceSummaryDto>();
  const [projectDetail, setProjectDetail] = useState<ProjectDetailDto>();
  const [activeEnv, setActiveEnv] = useState<EnvironmentDto>();
  const [search, setSearch] = useState("");

  const secretsManager = useSecrets(activeEnv);

  const loadData = async () => {
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

      const projList = await client.listProjects(ws.id);
      const projSummary = projList.projects.find((p) => p.slug === projectSlug);
      if (!projSummary) {
        toast.error("Project not found");
        router.push(`/w/${workspaceSlug}`);
        return;
      }

      const detail = await client.getProject(projSummary.id);
      setProjectDetail(detail);

      const defaultEnv = detail.environments.length > 0 ? detail.environments[0] : null;
      if (defaultEnv) {
        setActiveEnv(defaultEnv);
        secretsManager.loadSecrets(defaultEnv.id);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load project details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [workspaceSlug, projectSlug]);

  const handleEnvChange = (envId: string) => {
    const env = projectDetail?.environments.find((e) => e.id === envId);
    if (env) {
      setActiveEnv(env);
      secretsManager.loadSecrets(env.id);
    }
  };

  const isViewer = currentWorkspace?.role === "viewer";
  const filteredSecrets = secretsManager.secrets.filter((s) =>
    s.key.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Link href={`/w/${workspaceSlug}`} className="hover:underline">
                Projects
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{projectDetail?.name}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{projectDetail?.name}</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={secretsManager.openExportModal} className="font-medium">
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
            {!isViewer && (
              <>
                <Button variant="outline" onClick={() => secretsManager.setBulkOpen(true)} className="font-medium">
                  <FileSpreadsheet className="mr-2 h-4 w-4" /> Import .env
                </Button>
                <Button onClick={() => secretsManager.setAddOpen(true)} className="font-medium shadow-md shadow-primary/10">
                  <Plus className="mr-2 h-4 w-4" /> Add Secret
                </Button>
              </>
            )}
          </div>
        </div>

        {projectDetail && (
          <Tabs value={activeEnv?.id} onValueChange={handleEnvChange} className="w-full space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <TabsList className="bg-muted/60 p-1">
                {projectDetail.environments.map((env) => (
                  <TabsTrigger key={env.id} value={env.id} className="capitalize font-medium text-sm px-4 py-1.5">
                    {env.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter keys..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-sm"
                />
              </div>
            </div>

            <TabsContent value={activeEnv?.id || ""} className="m-0">
              <Card className="border-border/60 shadow-sm">
                <SecretsTable
                  loading={loading || secretsManager.loadingSecrets}
                  secrets={filteredSecrets}
                  revealedValues={secretsManager.revealedValues}
                  copiedKey={secretsManager.copiedKey}
                  isViewer={isViewer}
                  onReveal={secretsManager.handleReveal}
                  onCopy={secretsManager.handleCopy}
                  onHistoryClick={secretsManager.openHistoryModal}
                  onEditClick={secretsManager.openEditModal}
                  onDeleteClick={(sec) => {
                    secretsManager.setDeleteTarget(sec);
                    secretsManager.setDeleteOpen(true);
                  }}
                />
              </Card>
            </TabsContent>
          </Tabs>
        )}

        <AddSecretDialog
          open={secretsManager.addOpen}
          onOpenChange={secretsManager.setAddOpen}
          envName={activeEnv?.name}
          onAdd={secretsManager.handleAddSecret}
        />

        <EditSecretDialog
          open={secretsManager.editOpen}
          onOpenChange={secretsManager.setEditOpen}
          target={secretsManager.editTarget}
          initialValue={secretsManager.editValue}
          loading={secretsManager.editLoading}
          onSave={(val) => secretsManager.handleEditSecret(val, false)}
        />

        <ConflictDialog
          open={secretsManager.conflictOpen}
          onOpenChange={secretsManager.setConflictOpen}
          serverVersion={secretsManager.conflictServerVersion}
          pendingValue={secretsManager.editValue}
          loading={secretsManager.editLoading}
          onForceOverwrite={() => secretsManager.handleEditSecret(secretsManager.editValue, true)}
        />

        <DeleteSecretDialog
          open={secretsManager.deleteOpen}
          onOpenChange={secretsManager.setDeleteOpen}
          target={secretsManager.deleteTarget}
          loading={secretsManager.deleteLoading}
          onConfirm={secretsManager.handleDeleteSecret}
        />

        <BulkImportDialog
          open={secretsManager.bulkOpen}
          onOpenChange={secretsManager.setBulkOpen}
          envName={activeEnv?.name}
          onImport={secretsManager.handleBulkImport}
        />

        <ExportSecretsDialog
          open={secretsManager.exportOpen}
          onOpenChange={secretsManager.setExportOpen}
          envName={activeEnv?.name}
          exportData={secretsManager.exportData}
        />

        <VersionHistoryDialog
          open={secretsManager.historyOpen}
          onOpenChange={secretsManager.setHistoryOpen}
          target={secretsManager.historyTarget}
          versions={secretsManager.versions}
          loading={secretsManager.historyLoading}
          isViewer={isViewer}
          onRollback={secretsManager.handleRollback}
        />
      </main>
    </div>
  );
}
