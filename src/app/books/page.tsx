"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { subscribeToBooks, createBook, Book } from "@/lib/services/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, BookOpen, LogOut, ChevronRight, Wallet, ListChecks, User, LayoutDashboard } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/Sidebar";
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
    <div className="min-h-svh bg-background flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
        {/* Mobile Header */}
        <header className="flex md:hidden justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-primary">BukuAkaun</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={logout} className="rounded-full">
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black tracking-tight text-foreground">Buku Akaun</h2>
              <p className="text-muted-foreground text-sm">Urus dan pantau aliran tunai anda di sini.</p>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl flex gap-2 h-12 px-6 shadow-lg shadow-primary/20">
                  <Plus className="w-5 h-5" /> Buku Baru
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.length === 0 ? (
              <div className="col-span-full text-center py-20 px-4 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-muted">
                <Wallet className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-30" />
                <h3 className="text-lg font-bold">Belum ada buku lagi</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto">Klik butang 'Buku Baru' untuk mula merekod transaksi anda.</p>
              </div>
            ) : (
              books.map((book) => (
                <Link key={book.id} href={`/books/${book.id}`} className="group">
                  <Card className="h-full hover:shadow-xl transition-all border-none shadow-sm rounded-[2rem] overflow-hidden bg-card active:scale-[0.98]">
                    <CardHeader className="p-6 flex flex-row items-start justify-between space-y-0 gap-4">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className="bg-primary/10 p-3 rounded-2xl group-hover:bg-primary/20 transition-colors shrink-0">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <CardTitle className="text-base sm:text-lg font-black leading-tight line-clamp-2 min-h-[3rem]">
                            {book.name}
                          </CardTitle>
                          <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                            Dicipta {book.createdAt ? new Date(book.createdAt).toLocaleDateString() : 'Baru'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0 mt-1" />
                    </CardHeader>
                    <CardContent className="p-6 pt-0">
                      <div className="bg-muted/30 rounded-3xl p-5 space-y-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Baki Bersih</span>
                          <span className={`text-2xl font-black ${book.netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                            RM{book.netBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t border-muted pt-4">
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Masuk</span>
                            <span className="text-sm font-bold text-emerald-600">RM{book.totalCashIn.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Keluar</span>
                            <span className="text-sm font-bold text-rose-600">RM{book.totalCashOut.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Mobile Footer Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 max-w-md mx-auto z-50">
        <nav className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-full p-2 flex justify-around items-center">
          <Link href="/dashboard" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <LayoutDashboard className="w-6 h-6" />
          </Link>
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
