"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderKanban, Plus, ArrowRight, Layers, Clock, Loader2, Search } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { client } from "@/lib/api-client";
import type { WorkspaceSummaryDto, ProjectDto, UserDto } from "@repo/core";
import { toast } from "sonner";

export default function WorkspaceProjectsPage({ params }: { params: Promise<{ workspace: string }> }) {
    const { workspace: workspaceSlug } = use(params);
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserDto>();
    const [workspaces, setWorkspaces] = useState<WorkspaceSummaryDto[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<WorkspaceSummaryDto>();
    const [projects, setProjects] = useState<ProjectDto[]>([]);
    const [search, setSearch] = useState("");

    // Create Project Form
    const [dialogOpen, setDialogOpen] = useState(false);
    const [projectName, setProjectName] = useState("");
    const [projectSlug, setProjectSlug] = useState("");
    const [creating, setCreating] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const meRes = await client.me();
            setUser(meRes.user);
            setWorkspaces(meRes.workspaces);

            const target = meRes.workspaces.find((w) => w.slug === workspaceSlug);
            if (!target) {
                toast.error("Workspace not found");
                router.push("/");
                return;
            }
            setCurrentWorkspace(target);

            const projRes = await client.listProjects(target.id);
            setProjects(projRes.projects);
        } catch (err: any) {
            toast.error(err.message || "Failed to load workspace");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [workspaceSlug]);

    const handleNameChange = (val: string) => {
        setProjectName(val);
        setProjectSlug(
            val
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
        );
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentWorkspace) return;
        setCreating(true);

        try {
            const newProj = await client.createProject(currentWorkspace.id, {
                name: projectName,
                slug: projectSlug,
            });

            toast.success(`Project "${newProj.name}" created!`);
            setDialogOpen(false);
            setProjectName("");
            setProjectSlug("");
            loadData();
        } catch (err: any) {
            toast.error(err.message || "Failed to create project");
        } finally {
            setCreating(false);
        }
    };

    const filteredProjects = projects.filter(
        (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) || p.slug.toLowerCase().includes(search.toLowerCase()),
    );

    const isViewer = currentWorkspace?.role === "viewer";

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar
                currentWorkspace={currentWorkspace}
                workspaces={workspaces}
                user={user}
                userRole={currentWorkspace?.role}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
                {/* Header section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Manage secret keys and environments across your projects
                        </p>
                    </div>

                    {!isViewer && (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="font-medium shadow-md shadow-primary/10">
                                    <Plus className="mr-2 h-4 w-4" /> New Project
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <form onSubmit={handleCreateProject} className="contents">
                                    <DialogHeader>
                                        <DialogTitle>Create New Project</DialogTitle>
                                        <DialogDescription>
                                            Projects group secrets by environments (Development, Staging, Production).
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="pname">Project Name</Label>
                                            <Input
                                                id="pname"
                                                placeholder="Backend API"
                                                value={projectName}
                                                onChange={(e) => handleNameChange(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pslug">Project Slug</Label>
                                            <Input
                                                id="pslug"
                                                placeholder="backend-api"
                                                value={projectSlug}
                                                onChange={(e) => setProjectSlug(e.target.value)}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={creating || !projectName || !projectSlug}>
                                            {creating ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                                                </>
                                            ) : (
                                                "Create Project"
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Search & Filter */}
                <div className="flex items-center space-x-3 max-w-sm">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search projects..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Projects Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader className="h-24 bg-muted/30" />
                                <CardContent className="h-20 bg-muted/20" />
                            </Card>
                        ))}
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <Card className="border-dashed border-2 text-center p-12 space-y-4">
                        <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                            <FolderKanban className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg">No projects found</h3>
                            <p className="text-sm text-muted-foreground">
                                {search
                                    ? "No projects match your search query."
                                    : "Get started by creating your first project."}
                            </p>
                        </div>
                        {!isViewer && !search && (
                            <Button onClick={() => setDialogOpen(true)} variant="outline">
                                <Plus className="mr-2 h-4 w-4" /> Create Project
                            </Button>
                        )}
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.map((project) => (
                            <Card
                                key={project.id}
                                className="group hover:border-primary/50 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between"
                            >
                                <CardHeader className="space-y-2">
                                    <div className="flex items-start justify-between">
                                        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                                            <Layers className="h-5 w-5" />
                                        </div>
                                        <Badge variant="secondary" className="font-mono text-[11px]">
                                            {project.slug}
                                        </Badge>
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                        {project.name}
                                    </CardTitle>
                                </CardHeader>

                                <CardContent className="space-y-3">
                                    <div className="flex items-center text-xs text-muted-foreground space-x-2">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>Offline Cache Limit: {project.offlineMaxAgeHours}h</span>
                                    </div>
                                </CardContent>

                                <CardFooter className="pt-4 border-t border-border/40">
                                    <Button
                                        asChild
                                        variant="ghost"
                                        className="w-full justify-between group-hover:bg-primary/10 group-hover:text-primary font-medium"
                                    >
                                        <Link href={`/w/${workspaceSlug}/p/${project.slug}`}>
                                            <span>Manage Secrets</span>
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
