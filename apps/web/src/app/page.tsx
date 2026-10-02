"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock } from "lucide-react";
import { client } from "@/lib/api-client";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function init() {
      try {
        const { workspaces } = await client.me();
        const firstWs = workspaces && workspaces.length > 0 ? workspaces[0] : null;
        if (firstWs) {
          router.replace(`/w/${firstWs.slug}`);
        } else {
          router.replace("/onboarding");
        }
      } catch {
        router.replace("/login");
      }
    }
    init();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
          <Lock className="h-6 w-6" />
        </div>
        <div className="flex items-center space-x-2 text-muted-foreground text-sm font-medium">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading workspace...</span>
        </div>
      </div>
    </div>
  );
}
