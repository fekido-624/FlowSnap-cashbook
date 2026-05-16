"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, LayoutDashboard, ListChecks, User, LogOut, Wallet, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/contexts/auth-context";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="hidden md:flex w-64 flex-col bg-card border-r sticky top-0 h-svh p-6">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="bg-primary p-2 rounded-xl">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-black text-primary">BukuAkaun</h1>
      </div>

      <nav className="flex-1 space-y-2">
        <SidebarLink href="/dashboard" icon={<LayoutDashboard />} label="Dashboard" active={pathname === '/dashboard'} />
        <SidebarLink href="/books" icon={<Wallet />} label="Buku Akaun" active={pathname.startsWith('/books')} />
        <SidebarLink href="/checklists" icon={<ListChecks />} label="Checklists" active={pathname.startsWith('/checklists')} />
        <SidebarLink href="/profile" icon={<User />} label="Profil" active={pathname === '/profile'} />
        {user?.role === 'admin' && (
          <SidebarLink href="/admin" icon={<ShieldCheck />} label="Pengurusan Pengguna" active={pathname === '/admin'} />
        )}
      </nav>

      <div className="pt-6 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={logout}>
          <LogOut className="w-4 h-4" /> Log Keluar
        </Button>
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-bold ${
        active 
          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <span className="[&_svg]:w-5 [&_svg]:h-5">{icon}</span>
      {label}
    </Link>
  );
}
