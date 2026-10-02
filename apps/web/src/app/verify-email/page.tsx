"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { client } from "@/lib/api-client";
import { toast } from "sonner";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token");

  const [token, setToken] = useState(queryToken || "");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleVerify = async (tokenToVerify: string) => {
    if (!tokenToVerify) return;
    setStatus("loading");
    try {
      await client.verifyEmail({ token: tokenToVerify });
      setStatus("success");
      toast.success("Email verified!");
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Verification failed");
    }
  };

  useEffect(() => {
    if (queryToken) {
      handleVerify(queryToken);
    }
  }, [queryToken]);

  return (
    <Card className="w-full max-w-md border-border/60 shadow-xl text-center backdrop-blur-sm">
      <CardHeader className="space-y-2">
        {status === "success" ? (
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        ) : status === "error" ? (
          <div className="mx-auto h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
            <XCircle className="h-6 w-6" />
          </div>
        ) : (
          <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Loader2 className={`h-6 w-6 ${status === "loading" ? "animate-spin" : ""}`} />
          </div>
        )}
        <CardTitle className="text-2xl">
          {status === "success"
            ? "Email Verified!"
            : status === "error"
            ? "Verification Failed"
            : "Verify Email"}
        </CardTitle>
        <CardDescription>
          {status === "success"
            ? "Your email address has been verified. You can now log in."
            : status === "error"
            ? errorMessage
            : "Enter your verification token below"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {status === "idle" && (
          <div className="space-y-3 text-left">
            <Input
              placeholder="Enter verification token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!token}
              onClick={() => handleVerify(token)}
            >
              Verify Email
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col space-y-2">
        {status === "success" ? (
          <Button asChild className="w-full">
            <Link href="/login">
              Proceed to Login <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">Back to Login</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 p-4">
      <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
        <VerifyEmailForm />
      </Suspense>
    </div>
  );
}
