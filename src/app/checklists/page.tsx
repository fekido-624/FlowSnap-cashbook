"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { subscribeToChecklists, createChecklist, updateChecklist, subscribeToBooks, deleteChecklist, Checklist, Book } from "@/lib/services/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ListChecks, ArrowLeft, ChevronRight, ShoppingBag, Trash2, Wallet, Edit3, BookOpen, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/Sidebar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function ChecklistsPage() {
  const { user, loading } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string>("none");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const router = useRouter();
  const { toast } = useToast();

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

  const handleSave = async () => {
    if (!user || !newName.trim()) return;
    try {
      if (editingChecklist) {
        await updateChecklist(editingChecklist.id, newName.trim(), selectedBookId);
        toast({ title: "Dikemas Kini", description: "Checklist telah berjaya dikemas kini." });
      } else {
        await createChecklist(
          user.uid, 
          newName.trim(), 
          selectedBookId === "none" ? undefined : selectedBookId
        );
        toast({ title: "Berjaya", description: "Checklist baru telah dicipta." });
      }
      setNewName("");
      setSelectedBookId("none");
      setEditingChecklist(null);
      setIsDialogOpen(false);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ralat", description: e.message });
    }
  };

  const handleEdit = (e: React.MouseEvent, checklist: Checklist) => {
    e.stopPropagation();
    setEditingChecklist(checklist);
    setNewName(checklist.name);
    setSelectedBookId(checklist.bookId || "none");
    setIsDialogOpen(true);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Padam keseluruhan checklist ini?")) return;
    try {
      await deleteChecklist(id);
      toast({ title: "Dipadam", description: "Checklist telah berjaya dibuang." });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Ralat", description: e.message });
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-svh bg-background flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
        <header className="flex md:hidden items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push("/books")} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-black">Checklist Bayaran</h1>
        </header>

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Checklist Bayaran</h2>
              <p className="text-muted-foreground text-sm">Senarai komitmen dan perbelanjaan berulang.</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                setEditingChecklist(null);
                setNewName("");
                setSelectedBookId("none");
              }
            }}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl flex gap-2 h-12 px-6 shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5" /> Checklist Baru
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingChecklist ? 'Edit Checklist' : 'Buat Checklist Baru'}</DialogTitle>
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
                  <Button className="w-full h-12 rounded-xl font-bold" onClick={handleSave}>
                    {editingChecklist ? 'Kemas Kini' : 'Simpan Checklist'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {checklists.length === 0 ? (
              <div className="col-span-full text-center py-20 px-4 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted">
                <ListChecks className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-lg font-bold">Tiada checklist lagi</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Klik butang 'Checklist Baru' untuk mula menyusun bayaran anda.</p>
              </div>
            ) : (
              checklists.map((c) => (
                <div 
                  key={c.id} 
                  onClick={() => router.push(`/checklists/${c.id}`)}
                  className="cursor-pointer group"
                >
                  <Card className="h-full hover:shadow-xl transition-all border-none shadow-sm rounded-[2rem] overflow-hidden bg-card active:scale-[0.98]">
                    <CardHeader className="p-6 flex flex-row items-center justify-between space-y-0">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-2xl group-hover:bg-primary/20 transition-colors">
                          <ShoppingBag className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <CardTitle className="text-lg font-bold truncate max-w-[150px]">{c.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {c.items.filter(i => Object.values(i.payments || {}).some(p => p.isPaid)).length} SEJARAH BAYARAN
                            </span>
                            {c.bookId && <Wallet className="w-3 h-3 text-primary opacity-50" />}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleEdit(e, c)}
                          className="rounded-full h-9 w-9 text-muted-foreground hover:text-primary hover:bg-primary/5"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          onClick={(e) => handleDelete(e, c.id)}
                          className="rounded-full h-9 w-9 text-muted-foreground hover:text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <div className="p-6 pt-0">
                      <div className="bg-muted/30 rounded-3xl p-4 flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Item</span>
                          <span className="text-xl font-black">{c.items.length}</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Mobile Footer Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 max-w-md mx-auto z-50">
        <nav className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-full p-2 flex justify-around items-center">
          <Link href="/books" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <BookOpen className="w-6 h-6" />
          </Link>
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <ListChecks className="w-6 h-6" />
          </div>
          <Link href="/profile" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <User className="w-6 h-6" />
          </Link>
        </nav>
      </div>
    </div>
  );
}
