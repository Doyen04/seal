"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/lib/api-client";
import { toast } from "sonner";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryToken = searchParams.get("token") || "";

    const [token, setToken] = useState(queryToken);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await client.resetPassword({ token, password });
            setSuccess(true);
            toast.success("Password reset successfully!");
        } catch (err: any) {
            toast.error(err.message || "Password reset failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md border-border/60 shadow-xl backdrop-blur-sm">
            {success ? (
                <>
                    <CardHeader className="text-center space-y-3">
                        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl">Password Reset!</CardTitle>
                        <CardDescription>
                            Your password has been reset. All existing active sessions have been invalidated.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2">
                        <Button asChild className="w-full">
                            <Link href="/login">Sign In with New Password</Link>
                        </Button>
                    </CardFooter>
                </>
            ) : (
                <form onSubmit={handleSubmit}>
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">Set New Password</CardTitle>
                        <CardDescription>Enter your reset token and new password below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!queryToken && (
                            <div className="space-y-2">
                                <Label htmlFor="token">Reset Token</Label>
                                <Input
                                    id="token"
                                    placeholder="Paste token from email"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">New Password (min 10 chars)</Label>
                            <div className="relative">
                                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-9"
                                    minLength={10}
                                    required
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-3 pt-2">
                        <Button type="submit" className="w-full font-medium" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </Button>

                        <Button asChild variant="ghost" className="w-full">
                            <Link href="/login">
                                <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
                            </Link>
                        </Button>
                    </CardFooter>
                </form>
            )}
        </Card>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 p-4">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
