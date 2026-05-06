"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/books");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center h-svh bg-background p-6">
      <div className="flex items-center gap-2 mb-4 animate-pulse">
        <div className="bg-primary p-3 rounded-2xl shadow-lg">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-primary">(BukuAkaun)</h1>
      </div>
      <p className="text-muted-foreground text-center max-w-xs">
        Your elegant cash flow companion.
      </p>
    </div>
  );
}
