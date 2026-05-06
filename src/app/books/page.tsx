"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { subscribeToBooks, createBook, Book } from "@/lib/services/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, BookOpen, LogOut, ChevronRight, Wallet, User, ListChecks } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BooksPage() {
  const { user, loading, logout } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [newBookName, setNewBookName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToBooks(user.uid, (data) => {
        setBooks(data);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleCreateBook = async () => {
    if (!user || !newBookName.trim()) return;
    setIsCreating(true);
    try {
      await createBook(user.uid, newBookName.trim());
      setNewBookName("");
      setIsDialogOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  if (loading || !user) return null;

  return (
    <div className="max-w-md mx-auto min-h-svh pb-24 pt-6 px-6 flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <Link href="/profile" className="flex items-center gap-2 group transition-transform active:scale-95">
          <div className="bg-primary p-2 rounded-lg group-hover:shadow-md transition-all">
            <User className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-primary">BukuAkaun</h1>
        </Link>
        <Button variant="ghost" size="icon" onClick={logout} className="rounded-full">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">Buku Akaun</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full flex gap-1 h-9">
                <Plus className="w-4 h-4" /> Buku Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Cipta Buku Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="book-name">Nama Buku</Label>
                  <Input 
                    id="book-name" 
                    placeholder="e.g. Belanja Rumah, Bisnes" 
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-12 rounded-xl font-bold" onClick={handleCreateBook} disabled={isCreating}>
                  {isCreating ? "Mencipta..." : "Simpan Buku"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {books.length === 0 ? (
            <div className="text-center py-12 px-4 bg-muted/30 rounded-3xl border-2 border-dashed">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium text-sm">Belum ada buku lagi.</p>
            </div>
          ) : (
            books.map((book) => (
              <Link key={book.id} href={`/books/${book.id}`}>
                <Card className="hover:shadow-lg transition-shadow border-none shadow-sm rounded-2xl overflow-hidden group">
                  <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2.5 rounded-xl group-hover:bg-primary/20 transition-colors">
                        <BookOpen className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <CardTitle className="text-lg font-bold">{book.name}</CardTitle>
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          Dicipta {book.createdAt?.toDate ? book.createdAt.toDate().toLocaleDateString() : 'baru-baru ini'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Baki</span>
                        <span className={`text-lg font-bold ${book.netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          RM{book.netBalance.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Masuk</span>
                          <span className="text-xs font-semibold text-emerald-600">RM{book.totalCashIn.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Keluar</span>
                          <span className="text-xs font-semibold text-rose-600">RM{book.totalCashOut.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Footer Nav */}
      <div className="fixed bottom-6 left-6 right-6 max-w-md mx-auto">
        <nav className="bg-white/80 backdrop-blur-lg border border-white shadow-2xl rounded-full p-2 flex justify-around items-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <BookOpen className="w-6 h-6" />
          </div>
          <Link href="/checklists" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <ListChecks className="w-6 h-6" />
          </Link>
          <Link href="/profile" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <User className="w-6 h-6" />
          </Link>
        </nav>
      </div>
    </div>
  );
}
