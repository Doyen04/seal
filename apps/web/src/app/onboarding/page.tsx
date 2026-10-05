"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/lib/api-client";
import { toast } from "sonner";

export default function OnboardingPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [loading, setLoading] = useState(false);

    const handleNameChange = (val: string) => {
        setName(val);
        setSlug(
            val
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, ""),
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const ws = await client.createWorkspace({ name, slug });
            toast.success(`Workspace "${ws.name}" created!`);
            router.push(`/w/${ws.slug}`);
        } catch (err: any) {
            toast.error(err.message || "Failed to create workspace");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Create your Workspace</h1>
                    <p className="text-sm text-muted-foreground">
                        Workspaces organize your team projects and environments
                    </p>
                </div>

                <Card className="border-border/60 shadow-xl backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="contents">
                        <CardHeader className="space-y-1">
                            <CardTitle className="text-xl">Workspace Details</CardTitle>
                            <CardDescription>
                                Choose a display name and unique URL slug for your workspace
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Workspace Name</Label>
                                <Input
                                    id="name"
                                    placeholder="Acme Corp"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Workspace Slug</Label>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs text-muted-foreground font-mono bg-muted px-2.5 py-2 rounded-md border border-border">
                                        seal.dev/w/
                                    </span>
                                    <Input
                                        id="slug"
                                        placeholder="acme-corp"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-2">
                            <Button type="submit" className="w-full font-medium" disabled={loading || !name || !slug}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating workspace...
                                    </>
                                ) : (
                                    <>
                                        Create Workspace
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
