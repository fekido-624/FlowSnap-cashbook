"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { subscribeToBooks, createBook, Book } from "@/lib/services/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus, BookOpen, LogOut, ChevronRight, Wallet } from "lucide-react";
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
    <div className="max-w-md mx-auto min-h-svh pb-20 pt-6 px-6 flex flex-col gap-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-primary p-2 rounded-lg">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-primary">FlowSnap</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="rounded-full">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <h2 className="text-2xl font-bold">My Books</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full flex gap-1 h-9">
                <Plus className="w-4 h-4" /> New Book
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl max-w-[90vw] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Book</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="book-name">Book Name</Label>
                  <Input 
                    id="book-name" 
                    placeholder="e.g. Home Expenses, Business" 
                    value={newBookName}
                    onChange={(e) => setNewBookName(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button className="w-full h-12 rounded-xl" onClick={handleCreateBook} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Book"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {books.length === 0 ? (
            <div className="text-center py-12 px-4 bg-muted/30 rounded-3xl border-2 border-dashed">
              <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <p className="text-muted-foreground font-medium">No books yet. Create one to start tracking!</p>
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
                        <span className="text-xs text-muted-foreground">
                          Created {book.createdAt?.toDate ? book.createdAt.toDate().toLocaleDateString() : 'recently'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Balance</span>
                        <span className={`text-lg font-bold ${book.netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}>
                          ${book.netBalance.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex gap-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">In</span>
                          <span className="text-xs font-semibold text-emerald-600">+${book.totalCashIn.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Out</span>
                          <span className="text-xs font-semibold text-rose-600">-${book.totalCashOut.toLocaleString()}</span>
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
    </div>
  );
}