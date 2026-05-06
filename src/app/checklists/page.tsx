"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { subscribeToChecklists, createChecklist, subscribeToBooks, Checklist, Book } from "@/lib/services/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, ListChecks, ArrowLeft, ChevronRight, ShoppingBag, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ChecklistsPage() {
  const { user, loading } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string>("none");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const unsubChecklists = subscribeToChecklists(user.uid, setChecklists);
      const unsubBooks = subscribeToBooks(user.uid, setBooks);
      return () => {
        unsubChecklists();
        unsubBooks();
      };
    }
  }, [user]);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    await createChecklist(
      user.uid, 
      newName.trim(), 
      selectedBookId === "none" ? undefined : selectedBookId
    );
    setNewName("");
    setSelectedBookId("none");
    setIsDialogOpen(false);
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-md mx-auto min-h-svh bg-background p-6 pb-24">
      <header className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.push("/books")} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-black">Checklist Bayaran</h1>
      </header>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Senarai Anda</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full h-9 flex gap-1">
                <Plus className="w-4 h-4" /> Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Buat Checklist Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nama Checklist</Label>
                  <Input 
                    placeholder="Contoh: Barang Dapur, Bil Bulanan" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Potong dari Buku Akaun (Pilihan)</Label>
                  <Select value={selectedBookId} onValueChange={setSelectedBookId}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Tiada / Manual" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">Tiada (Manual Sahaja)</SelectItem>
                      {books.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground">Jika dipilih, transaksi akan direkod secara automatik bila anda tanda item sebagai 'dibayar'.</p>
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-12 rounded-xl font-bold" onClick={handleCreate}>
                  Simpan Checklist
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {checklists.length === 0 ? (
            <div className="text-center py-16 opacity-30">
              <ListChecks className="w-16 h-16 mx-auto mb-4" />
              <p className="font-medium text-sm">Tiada checklist lagi</p>
            </div>
          ) : (
            checklists.map((c) => (
              <Link key={c.id} href={`/checklists/${c.id}`}>
                <Card className="border-none shadow-sm rounded-2xl overflow-hidden group active:scale-95 transition-transform">
                  <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-2xl group-hover:bg-primary/20 transition-colors">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <CardTitle className="text-lg font-bold">{c.name}</CardTitle>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          {c.items.filter(i => i.isPaid).length} / {c.items.length} ITEM SELESAI
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardHeader>
                </Card>
              </Link>
            ))
          )}
        </div>
      </div>
      
      {/* Footer Nav */}
      <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto">
        <nav className="bg-white/80 backdrop-blur-lg border border-white shadow-2xl rounded-full p-2 flex justify-around items-center">
          <Link href="/books" className="p-3 rounded-full hover:bg-muted text-muted-foreground">
            <ShoppingBag className="w-6 h-6" />
          </Link>
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <ListChecks className="w-6 h-6" />
          </div>
          <Link href="/profile" className="p-3 rounded-full hover:bg-muted text-muted-foreground">
            <Plus className="w-6 h-6 rotate-45" />
          </Link>
        </nav>
      </div>
    </div>
  );
}
