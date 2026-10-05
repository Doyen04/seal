"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, Mail, User, KeyRound, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/lib/api-client";
import { toast } from "sonner";
import { toUserMessage } from "@/lib/error-message";

export default function SignupPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await client.signup({ name, email, password });
            setRegistered(true);
            toast.success("Account created successfully!");
        } catch (err: any) {
            toast.error(toUserMessage(err, "Failed to create account"));
        } finally {
            setLoading(false);
        }
    };

    if (registered) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 p-4">
                <Card className="w-full max-w-md border-border/60 shadow-xl text-center">
                    <CardHeader className="space-y-3">
                        <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl">Check your email</CardTitle>
                        <CardDescription className="text-base">
                            We&apos;ve sent a verification link to{" "}
                            <span className="font-semibold text-foreground">{email}</span>.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <p>Please click the link in your email to verify your address before logging in.</p>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-2">
                        <Button asChild className="w-full" variant="outline">
                            <Link href="/login">Return to Sign In</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 p-4">
            <div className="w-full max-w-md space-y-6">
                <div className="flex flex-col items-center space-y-2 text-center">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
                        <Lock className="h-6 w-6" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight">Create your Seal account</h1>
                    <p className="text-sm text-muted-foreground">Start managing your app secrets securely</p>
                </div>

                <Card className="border-border/60 shadow-xl backdrop-blur-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-xl">Get started</CardTitle>
                        <CardDescription>Create a free developer account to set up your workspace</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit} className="contents">
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Alex Johnson"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="alex@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password (min 10 characters)</Label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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

                        <CardFooter className="flex flex-col space-y-4 pt-2">
                            <Button type="submit" className="w-full font-medium" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    <>
                                        Create Account
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-primary font-medium hover:underline">
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
