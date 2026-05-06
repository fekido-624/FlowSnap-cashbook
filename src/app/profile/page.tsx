"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, LogOut, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="max-w-md mx-auto min-h-svh p-6 bg-background flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-black">Profil Pengguna</h1>
      </header>

      <div className="flex flex-col items-center gap-4 mb-4">
        <div className="w-24 h-24 bg-primary/10 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-xl">
          <User className="w-12 h-12 text-primary" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold">{user.email?.split('@')[0]}</h2>
          <p className="text-sm text-muted-foreground">Local User Mode</p>
        </div>
      </div>

      <div className="space-y-4">
        <Card className="border-none shadow-sm rounded-3xl p-2">
          <CardContent className="p-4 space-y-6">
            <div className="flex items-center gap-4">
              <div className="bg-muted p-3 rounded-2xl">
                <Mail className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Emel</span>
                <span className="font-semibold">{user.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-muted p-3 rounded-2xl">
                <ShieldCheck className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status Akaun</span>
                <span className="font-semibold text-emerald-600">Aktif (Lokal)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="destructive" 
          className="w-full h-14 rounded-2xl font-bold flex gap-2 shadow-lg"
          onClick={logout}
        >
          <LogOut className="w-5 h-5" /> Log Keluar
        </Button>
      </div>

      <footer className="mt-auto text-center text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-50">
        BukuAkaun v1.0.0
      </footer>
    </div>
  );
}
