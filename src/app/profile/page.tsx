"use client";

import { useAuth } from "@/lib/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, User, LogOut, Mail, ShieldCheck, BookOpen, ListChecks } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
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
    <div className="min-h-svh bg-background flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
        <header className="flex md:hidden items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black">Profil Pengguna</h1>
        </header>

        <div className="max-w-2xl mx-auto space-y-10">
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="w-32 h-32 bg-primary/10 rounded-[3rem] flex items-center justify-center border-4 border-white shadow-2xl">
              <User className="w-16 h-16 text-primary" />
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-4xl font-black tracking-tight">{user.email?.split('@')[0]}</h2>
              <p className="text-muted-foreground font-medium">Local User Mode • BukuAkaun Member</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-card">
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="bg-muted p-4 rounded-2xl">
                    <Mail className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Emel Utama</span>
                    <span className="font-bold text-lg">{user.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="bg-muted p-4 rounded-2xl">
                    <ShieldCheck className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Status Keselamatan</span>
                    <span className="font-bold text-lg text-emerald-600">Terjamin (Lokal)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-4">
              <Button 
                variant="outline" 
                className="h-16 rounded-[2rem] font-bold text-lg border-2 hover:bg-muted transition-all"
                onClick={() => router.push('/books')}
              >
                Dashboard Utama
              </Button>
              <Button 
                variant="destructive" 
                className="h-16 rounded-[2rem] font-bold text-lg flex gap-3 shadow-xl shadow-destructive/10"
                onClick={logout}
              >
                <LogOut className="w-6 h-6" /> Log Keluar
              </Button>
            </div>
          </div>

          <footer className="text-center md:text-left text-[11px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-40">
            FlowSnap System Engine v1.0.0-PRO
          </footer>
        </div>
      </main>

      {/* Mobile Footer Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 max-w-md mx-auto z-50">
        <nav className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-full p-2 flex justify-around items-center">
          <Link href="/books" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <BookOpen className="w-6 h-6" />
          </Link>
          <Link href="/checklists" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <ListChecks className="w-6 h-6" />
          </Link>
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <User className="w-6 h-6" />
          </div>
        </nav>
      </div>
    </div>
  );
}
