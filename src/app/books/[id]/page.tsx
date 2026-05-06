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
import { Sidebar } from "@/components/Sidebar";

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
    <div className="min-h-svh bg-background flex flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 pb-32 md:pb-10 max-w-7xl mx-auto w-full">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-black truncate">{book.name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={handleDeleteBook}>
              <Trash2 className="w-5 h-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className={`rounded-full ${isFilterActive ? 'text-primary border-primary' : ''}`} 
              onClick={() => setIsFilterOpen(true)}
            >
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Balance & Stats */}
          <div className="space-y-6">
            <Card className="bg-primary text-white border-none shadow-2xl rounded-[3rem] p-10">
              <div className="flex flex-col items-center gap-2 text-center mb-10">
                <span className="text-xs font-bold opacity-70 uppercase tracking-widest">
                  {isFilterActive ? 'Baki (Ditapis)' : 'Baki Bersih'}
                </span>
                <span className="text-5xl font-black tracking-tighter">
                  RM{filteredStats.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-[2rem] p-5 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] uppercase font-bold opacity-70">Masuk</span>
                  </div>
                  <span className="text-lg font-black truncate">RM{filteredStats.totalIn.toLocaleString()}</span>
                </div>
                <div className="bg-white/10 rounded-[2rem] p-5 flex flex-col items-center">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                    <span className="text-[10px] uppercase font-bold opacity-70">Keluar</span>
                  </div>
                  <span className="text-lg font-black truncate">RM{filteredStats.totalOut.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <div className="hidden lg:block">
               <Card className="border-none shadow-sm rounded-[2.5rem] bg-card p-8 space-y-8">
                  <div className="flex flex-col gap-1 border-b border-dashed pb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-500" />
                      Pecahan Perbelanjaan
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black">RM{totalExpenseSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  
                  {categoryStats.length === 0 ? (
                    <p className="text-center py-10 text-sm text-muted-foreground italic">Tiada data perbelanjaan.</p>
                  ) : (
                    <div className="space-y-6">
                      {categoryStats.map((stat) => (
                        <div key={stat.name} className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-sm font-bold">{stat.name}</span>
                            <div className="text-right">
                              <span className="text-xs font-black">RM{stat.value.toLocaleString()}</span>
                              <span className="text-[10px] text-muted-foreground ml-2">({stat.percentage.toFixed(0)}%)</span>
                            </div>
                          </div>
                          <Progress value={stat.percentage} className="h-2 rounded-full" />
                        </div>
                      ))}
                    </div>
                  )}
               </Card>
            </div>
          </div>

          {/* Right Column: Transactions & Search (Mobile Tabs) */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="transactions" className="w-full">
              <TabsList className="lg:hidden grid w-full grid-cols-2 rounded-2xl h-12 bg-muted/50 p-1 mb-6">
                <TabsTrigger value="transactions" className="rounded-xl font-bold flex gap-2">
                  <History className="w-4 h-4" /> Transaksi
                </TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-xl font-bold flex gap-2">
                  <PieChartIcon className="w-4 h-4" /> Analisis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="transactions" className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="Cari kategori atau catatan..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-12 h-14 rounded-2xl border-none bg-card shadow-sm"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      className="h-14 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-bold flex gap-2 flex-1"
                      onClick={() => { setTxType('in'); setEditingTx(null); setIsTxModalOpen(true); }}
                    >
                      <Plus className="w-5 h-5" /> Masuk
                    </Button>
                    <Button 
                      className="h-14 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 font-bold flex gap-2 flex-1"
                      onClick={() => { setTxType('out'); setEditingTx(null); setIsTxModalOpen(true); }}
                    >
                      <ArrowDownCircle className="w-5 h-5" /> Keluar
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    {isFilterActive ? 'Hasil Carian' : 'Rekod Terkini'}
                  </h2>
                  <span className="text-[10px] font-bold bg-muted px-2 py-0.5 rounded-full">{filteredTransactions.length} item</span>
                </div>

                <div className="grid gap-4">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-20 opacity-50 bg-muted/20 rounded-[3rem] border-2 border-dashed">
                      <Smartphone className="w-12 h-12 mx-auto mb-3" />
                      <p className="font-bold">Tiada rekod dijumpai</p>
                    </div>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <Card 
                        key={tx.id} 
                        className="border-none shadow-sm rounded-3xl overflow-hidden p-5 flex items-center gap-5 cursor-pointer hover:shadow-md transition-all bg-card"
                        onClick={() => handleEditTx(tx)}
                      >
                        <div className={`p-4 rounded-2xl ${tx.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                          {tx.type === 'in' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-black text-base truncate">{tx.category}</h3>
                            <span className={`font-black text-lg ${tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {tx.type === 'in' ? '+' : '-'}RM{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] text-muted-foreground flex items-center gap-1 font-medium">
                                <Wallet className="w-3.5 h-3.5" /> {tx.method}
                                <span className="mx-1">•</span>
                                {format(tx.timestamp.toDate(), "MMM dd, hh:mm a")}
                              </span>
                              {tx.description && <p className="text-xs text-muted-foreground italic truncate max-w-[200px]">{tx.description}</p>}
                            </div>
                            <span className="text-[10px] bg-muted px-3 py-1 rounded-full font-bold text-muted-foreground">
                              Baki: RM{tx.runningBalance.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="lg:hidden">
                 <Card className="border-none shadow-sm rounded-[2.5rem] bg-card p-8 space-y-8">
                    <div className="flex flex-col gap-1 border-b border-dashed pb-4">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-rose-500" />
                        Pecahan Perbelanjaan
                      </h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black">RM{totalExpenseSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    
                    {categoryStats.length === 0 ? (
                      <p className="text-center py-10 text-sm text-muted-foreground italic">Tiada data perbelanjaan.</p>
                    ) : (
                      <div className="space-y-6">
                        {categoryStats.map((stat) => (
                          <div key={stat.name} className="space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-sm font-bold">{stat.name}</span>
                              <div className="text-right">
                                <span className="text-xs font-black">RM{stat.value.toLocaleString()}</span>
                                <span className="text-[10px] text-muted-foreground ml-2">({stat.percentage.toFixed(0)}%)</span>
                              </div>
                            </div>
                            <Progress value={stat.percentage} className="h-2 rounded-full" />
                          </div>
                        ))}
                      </div>
                    )}
                 </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

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
