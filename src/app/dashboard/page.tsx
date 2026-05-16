"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/contexts/auth-context";
import { subscribeToBooks, subscribeToChecklists, getTransactionsByBook, Book, Checklist, Transaction } from "@/lib/services/db";
import { Sidebar } from "@/components/Sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  ListChecks, 
  History, 
  ChevronRight,
  LayoutDashboard,
  BookOpen,
  User
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const unsubBooks = subscribeToBooks(user.uid, async (data) => {
        setBooks(data);

        const allTxs: Transaction[] = [];
        await Promise.all(
          data.map(async (book) => {
            const bookTxs = await getTransactionsByBook(book.id);
            allTxs.push(...bookTxs);
          })
        );

        const sorted = allTxs
          .sort((a, b) => new Date(b.timestamp as any).getTime() - new Date(a.timestamp as any).getTime())
          .slice(0, 5);
        setRecentTransactions(sorted);
      });
      const unsubChecklists = subscribeToChecklists(user.uid, setChecklists);

      return () => {
        unsubBooks();
        unsubChecklists();
      };
    }
  }, [user]);

  const globalStats = useMemo(() => {
    return books.reduce((acc, book) => {
      acc.totalBalance += book.netBalance;
      acc.totalIn += book.totalCashIn;
      acc.totalOut += book.totalCashOut;
      return acc;
    }, { totalBalance: 0, totalIn: 0, totalOut: 0 });
  }, [books]);

  const checklistStats = useMemo(() => {
    const monthKey = format(new Date(), "yyyy-MM");
    let total = 0;
    let paid = 0;

    checklists.forEach(c => {
      c.items.forEach(item => {
        const isStillValid = !item.validUntil || item.validUntil >= monthKey;
        const isNotExcluded = !item.excludedMonths?.includes(monthKey);
        
        if (isStillValid && isNotExcluded) {
          total += item.amount;
          if (item.payments?.[monthKey]?.isPaid) {
            paid += item.amount;
          }
        }
      });
    });

    return {
      total,
      paid,
      percentage: total > 0 ? (paid / total) * 100 : 0
    };
  }, [checklists]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Selamat Pagi";
    if (hour >= 12 && hour < 16) return "Selamat Tengah Hari";
    if (hour >= 16 && hour < 19) return "Selamat Petang";
    return "Selamat Malam";
  }, []);

  if (loading || !user) return null;

  return (
    <div className="min-h-svh bg-background flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
        <header className="mb-10">
          <h1 className="text-3xl font-black tracking-tight">{greeting}! 👋</h1>
          <p className="text-muted-foreground">Berikut adalah ringkasan kewangan anda hari ini.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card className="bg-primary text-white border-none shadow-xl rounded-[2.5rem] p-8">
            <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Jumlah Baki Bersih</span>
            <div className="text-3xl font-black mt-1">RM{globalStats.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <Wallet className="w-8 h-8 mt-4 opacity-20" />
          </Card>
          
          <Card className="border-none shadow-sm rounded-[2.5rem] bg-card p-8 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Jumlah Wang Masuk</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-600">RM{globalStats.totalIn.toLocaleString()}</span>
              <ArrowUpRight className="w-5 h-5 text-emerald-500" />
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-card p-8 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Jumlah Wang Keluar</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl font-black text-rose-600">RM{globalStats.totalOut.toLocaleString()}</span>
              <ArrowDownRight className="w-5 h-5 text-rose-500" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-card p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-lg flex items-center gap-2">
                  <ListChecks className="w-5 h-5 text-primary" /> Komitmen Bulan Ini
                </h3>
                <Link href="/checklists" className="text-xs font-bold text-primary hover:underline">Lihat Semua</Link>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-medium">Kemajuan Bayaran</span>
                  <span className="text-sm font-black">{checklistStats.percentage.toFixed(0)}%</span>
                </div>
                <Progress value={checklistStats.percentage} className="h-3 rounded-full" />
                <div className="flex justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  <span>Dibayar: RM{checklistStats.paid.toLocaleString()}</span>
                  <span>Jumlah: RM{checklistStats.total.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               {books.slice(0, 4).map(book => (
                 <Link key={book.id} href={`/books/${book.id}`}>
                    <Card className="border-none shadow-sm rounded-3xl p-6 hover:shadow-md transition-all active:scale-95 bg-card">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-primary/10 p-2 rounded-xl">
                          <BookOpen className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-black text-sm truncate">{book.name}</span>
                      </div>
                      <div className="text-lg font-black">RM{book.netBalance.toLocaleString()}</div>
                    </Card>
                 </Link>
               ))}
            </div>
          </div>

          <Card className="border-none shadow-sm rounded-[2.5rem] bg-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-lg flex items-center gap-2">
                <History className="w-5 h-5 text-primary" /> Transaksi Terkini
              </h3>
            </div>
            <div className="space-y-4">
              {recentTransactions.length === 0 ? (
                <div className="text-center py-10 opacity-30 italic text-sm">Tiada transaksi direkodkan.</div>
              ) : (
                recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-lg ${tx.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {tx.type === 'in' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{tx.category}</div>
                        <div className="text-[10px] text-muted-foreground">{format(new Date(tx.timestamp as any), "MMM dd")}</div>
                      </div>
                    </div>
                    <div className={`font-black text-sm ${tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'in' ? '+' : '-'}RM{tx.amount.toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>

      {/* Mobile Footer Nav */}
      <div className="md:hidden fixed bottom-6 left-6 right-6 max-w-md mx-auto z-50">
        <nav className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-full p-2 flex justify-around items-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg shadow-primary/30">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <Link href="/books" className="p-3 rounded-full hover:bg-muted text-muted-foreground transition-colors">
            <BookOpen className="w-6 h-6" />
          </Link>
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
