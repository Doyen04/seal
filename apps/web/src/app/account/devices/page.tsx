"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Laptop, Trash2, Loader2 } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { client } from "@/lib/api-client";
import type { DeviceDto, UserDto, WorkspaceDto } from "@repo/core";
import { toast } from "sonner";

export default function AccountDevicesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserDto>();
    const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([]);
    const [devices, setDevices] = useState<DeviceDto[]>([]);
    const [revokeTarget, setRevokeTarget] = useState<DeviceDto | null>(null);
    const [revokeLoading, setRevokeLoading] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const meRes = await client.me();
            setUser(meRes.user);
            setWorkspaces(meRes.workspaces);

            const devRes = await client.listDevices();
            setDevices(devRes.devices);
        } catch (err: any) {
            toast.error(err.message || "Failed to load devices");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRevoke = async () => {
        if (!revokeTarget) return;
        setRevokeLoading(true);

        try {
            await client.revokeDevice(revokeTarget.id);
            toast.success(`Device "${revokeTarget.name}" revoked`);
            setDevices(devices.filter((d) => d.id !== revokeTarget.id));
            setRevokeTarget(null);
        } catch (err: any) {
            toast.error(err.message || "Failed to revoke device");
        } finally {
            setRevokeLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Navbar
                currentWorkspace={workspaces.length > 0 ? workspaces[0] : undefined}
                workspaces={workspaces}
                user={user}
            />

            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Authorized Devices</h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Manage CLI and desktop tokens logged in to your account
                        </p>
                    </div>
                </div>

                <Card className="border-border/60 shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold">Device Name</TableHead>
                                <TableHead className="font-semibold">Platform</TableHead>
                                <TableHead className="font-semibold">Last Active</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="font-semibold text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                                        Loading devices...
                                    </TableCell>
                                </TableRow>
                            ) : devices.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-36 text-center text-muted-foreground">
                                        <Laptop className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                                        <p className="font-medium text-foreground">No active devices</p>
                                        <p className="text-xs mt-1">
                                            Log in via CLI (`Seal login`) to connect a device.
                                        </p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                devices.map((dev) => (
                                    <TableRow key={dev.id} className="hover:bg-muted/40">
                                        <TableCell className="font-medium">
                                            <div className="flex items-center space-x-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                    <Laptop className="h-4 w-4" />
                                                </div>
                                                <span>{dev.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="capitalize text-sm text-muted-foreground">
                                            {dev.platform || "Unknown"}
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {dev.lastSeenAt ? new Date(dev.lastSeenAt).toLocaleString() : "Never"}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            >
                                                Active
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setRevokeTarget(dev)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                aria-label={`Revoke device ${dev.name}`}
                                                title="Revoke device"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>

                {/* Revoke Modal */}
                <Dialog open={!!revokeTarget} onOpenChange={() => setRevokeTarget(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Revoke Device Access</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to revoke access for{" "}
                                <span className="font-semibold text-foreground">{revokeTarget?.name}</span>? Its offline
                                cache will be automatically wiped on its next request.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setRevokeTarget(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleRevoke} disabled={revokeLoading}>
                                {revokeLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Revoke Device"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </main>
        </div>
    );
}
