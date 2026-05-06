
"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { subscribeToTransactions, subscribeToBook, deleteBook, Book, Transaction } from "@/lib/services/db";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Filter, 
  Plus, 
  History, 
  Calendar,
  Wallet,
  Smartphone,
  Trash2,
  Search,
  PieChart as PieChartIcon,
  TrendingDown
} from "lucide-react";
import { TransactionModal } from "@/components/TransactionModal";
import { FilterDrawer } from "@/components/FilterDrawer";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function BookDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState({ method: 'All', category: 'All', dateRange: null as any });
  const [searchQuery, setSearchQuery] = useState("");
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'in' | 'out'>('in');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (id) {
      const unsubBook = subscribeToBook(id, (data) => {
        setBook(data);
      });

      const unsubTxs = subscribeToTransactions(id, {}, (data) => {
        setTransactions(data);
      });

      return () => {
        unsubBook();
        unsubTxs();
      };
    }
  }, [id]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchMethod = filter.method === 'All' || tx.method === filter.method;
      const matchCategory = filter.category === 'All' || tx.category === filter.category;
      const matchSearch = tx.category.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
                          tx.amount.toString().includes(searchQuery);
      return matchMethod && matchCategory && matchSearch;
    });
  }, [transactions, filter, searchQuery]);

  // Statistik perbelanjaan mengikut kategori dengan pembulatan tepat
  const { categoryStats, totalExpenseSum } = useMemo(() => {
    const expenses = filteredTransactions.filter(tx => tx.type === 'out');
    const totalExpense = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    
    const stats = expenses.reduce((acc: any, tx) => {
      if (!acc[tx.category]) acc[tx.category] = 0;
      acc[tx.category] += tx.amount;
      return acc;
    }, {});

    const mappedStats = Object.entries(stats)
      .map(([name, value]: any) => ({
        name,
        value: Math.round(value * 100) / 100,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);

    return {
      categoryStats: mappedStats,
      totalExpenseSum: Math.round(totalExpense * 100) / 100
    };
  }, [filteredTransactions]);

  const filteredStats = useMemo(() => {
    const stats = filteredTransactions.reduce((acc, tx) => {
      if (tx.type === 'in') {
        acc.totalIn += tx.amount;
        acc.net += tx.amount;
      } else {
        acc.totalOut += tx.amount;
        acc.net -= tx.amount;
      }
      return acc;
    }, { totalIn: 0, totalOut: 0, net: 0 });

    return {
      totalIn: Math.round(stats.totalIn * 100) / 100,
      totalOut: Math.round(stats.totalOut * 100) / 100,
      net: Math.round(stats.net * 100) / 100
    };
  }, [filteredTransactions]);

  const handleEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTxModalOpen(false);
    setEditingTx(null);
  };

  const handleDeleteBook = async () => {
    if (!confirm("Adakah anda pasti mahu memadam buku ini beserta semua transaksinya? Tindakan ini tidak boleh dibatalkan.")) return;
    
    try {
      await deleteBook(id);
      toast({
        title: "Buku Dipadam",
        description: "Buku akaun telah berjaya dipadamkan.",
      });
      router.push("/books");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Ralat",
        description: error.message,
      });
    }
  };

  if (!book) return (
    <div className="flex items-center justify-center h-svh">
      <p className="text-muted-foreground animate-pulse font-bold">Memuatkan buku...</p>
    </div>
  );

  const isFilterActive = filter.method !== 'All' || filter.category !== 'All' || searchQuery !== "";

  return (
    <div className="max-w-md mx-auto min-h-svh flex flex-col bg-background pb-32">
      <header className="p-6 pb-2 sticky top-0 bg-background/80 backdrop-blur-lg z-10 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold truncate">{book.name}</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={handleDeleteBook}>
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={`rounded-full ${isFilterActive ? 'text-primary bg-primary/10' : ''}`} 
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="px-6 space-y-6 overflow-y-auto mobile-scroll-container">
        {/* Balance Card */}
        <Card className="bg-primary text-white border-none shadow-xl rounded-[2.5rem] p-8">
          <div className="flex flex-col items-center gap-1 text-center mb-8">
            <span className="text-sm font-medium opacity-80 uppercase tracking-widest">
              {isFilterActive ? 'Baki (Ditapis)' : 'Baki Bersih'}
            </span>
            <span className="text-5xl font-black tracking-tighter">
              RM{filteredStats.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-3xl p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] uppercase font-bold opacity-70">Masuk</span>
              </div>
              <span className="text-lg font-bold truncate">RM{filteredStats.totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-white/10 rounded-3xl p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-[10px] uppercase font-bold opacity-70">Keluar</span>
              </div>
              <span className="text-lg font-bold truncate">RM{filteredStats.totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </Card>

        {/* Search & Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-2xl h-12 bg-muted/50 p-1 mb-6">
            <TabsTrigger value="transactions" className="rounded-xl font-bold flex gap-2">
              <History className="w-4 h-4" /> Transaksi
            </TabsTrigger>
            <TabsTrigger value="analytics" className="rounded-xl font-bold flex gap-2">
              <PieChartIcon className="w-4 h-4" /> Analisis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Cari kategori atau catatan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-2xl border-none bg-muted/30 focus-visible:ring-primary shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                {isFilterActive ? 'Hasil Carian' : 'Semua Rekod'}
              </h2>
              <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full">{filteredTransactions.length} item</span>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-10 opacity-50 bg-muted/20 rounded-3xl border-2 border-dashed">
                  <Smartphone className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm font-medium">Tiada rekod dijumpai</p>
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <Card 
                    key={tx.id} 
                    className="border-none shadow-sm rounded-2xl overflow-hidden p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform bg-card"
                    onClick={() => handleEditTx(tx)}
                  >
                    <div className={`p-3 rounded-2xl ${tx.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {tx.type === 'in' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm truncate">{tx.category}</h3>
                        <span className={`font-black text-sm ${tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === 'in' ? '+' : '-'}RM{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Wallet className="w-3 h-3" /> {tx.method}
                            <span className="mx-1">•</span>
                            {format(tx.timestamp.toDate(), "MMM dd, hh:mm a")}
                          </span>
                          {tx.description && <p className="text-[10px] text-muted-foreground italic truncate">{tx.description}</p>}
                        </div>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold text-muted-foreground">
                          {isFilterActive ? 'Baki Sejarah' : 'Baki'}: RM{tx.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="bg-card p-6 rounded-[2rem] shadow-sm space-y-6">
              <div className="flex flex-col gap-1 border-b border-dashed pb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-500" />
                  Pecahan Perbelanjaan
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black">RM{totalExpenseSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Jumlah (Keluar)</span>
                </div>
              </div>
              
              {categoryStats.length === 0 ? (
                <p className="text-center py-10 text-sm text-muted-foreground italic">Tiada data perbelanjaan untuk dipaparkan.</p>
              ) : (
                <div className="space-y-6">
                  {categoryStats.map((stat) => (
                    <div key={stat.name} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="text-sm font-bold">{stat.name}</span>
                        <div className="text-right">
                          <span className="text-xs font-black">RM{stat.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                          <span className="text-[10px] text-muted-foreground ml-2">({stat.percentage.toFixed(0)}%)</span>
                        </div>
                      </div>
                      <Progress value={stat.percentage} className="h-2 rounded-full" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-6 flex gap-4 max-w-md mx-auto bg-gradient-to-t from-background via-background to-transparent pointer-events-none">
        <Button 
          className="flex-1 h-14 rounded-2xl shadow-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-lg flex gap-2 pointer-events-auto transition-transform active:scale-95"
          onClick={() => { setTxType('in'); setEditingTx(null); setIsTxModalOpen(true); }}
        >
          <Plus className="w-6 h-6" /> Masuk
        </Button>
        <Button 
          className="flex-1 h-14 rounded-2xl shadow-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-lg flex gap-2 pointer-events-auto transition-transform active:scale-95"
          onClick={() => { setTxType('out'); setEditingTx(null); setIsTxModalOpen(true); }}
        >
          <ArrowDownCircle className="w-6 h-6" /> Keluar
        </Button>
      </div>

      <TransactionModal 
        isOpen={isTxModalOpen} 
        onClose={handleCloseModal} 
        type={txType} 
        bookId={id} 
        editingTransaction={editingTx}
      />

      <FilterDrawer 
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        currentFilter={filter}
        onApply={setFilter}
        bookId={id}
      />
    </div>
  );
}
