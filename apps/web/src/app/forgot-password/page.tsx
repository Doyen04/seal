"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/lib/api-client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await client.forgotPassword({ email });
            setSubmitted(true);
            toast.success("Password reset request sent");
        } catch (err: any) {
            toast.error(err.message || "Request failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 p-4">
            <div className="w-full max-w-md space-y-6">
                <Card className="border-border/60 shadow-xl backdrop-blur-sm">
                    {submitted ? (
                        <>
                            <CardHeader className="text-center space-y-3">
                                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                    <CheckCircle2 className="h-6 w-6" />
                                </div>
                                <CardTitle className="text-2xl">Check your inbox</CardTitle>
                                <CardDescription>
                                    If an account exists for{" "}
                                    <span className="font-semibold text-foreground">{email}</span>, password reset
                                    instructions have been sent.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter className="pt-2">
                                <Button asChild variant="outline" className="w-full">
                                    <Link href="/login">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                                    </Link>
                                </Button>
                            </CardFooter>
                        </>
                    ) : (
                        <form onSubmit={handleSubmit} className="contents">
                            <CardHeader className="space-y-1">
                                <CardTitle className="text-xl">Reset your password</CardTitle>
                                <CardDescription>
                                    Enter your email address and we&apos;ll send you a password reset link.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@company.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-9"
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
                                            Sending...
                                        </>
                                    ) : (
                                        "Send Reset Link"
                                    )}
                                </Button>

                                <Button asChild variant="ghost" className="w-full">
                                    <Link href="/login">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Sign In
                                    </Link>
                                </Button>
                            </CardFooter>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );
}
