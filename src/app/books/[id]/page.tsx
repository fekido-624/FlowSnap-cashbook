"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/auth-context";
import { subscribeToTransactions, subscribeToBook, Book, Transaction } from "@/lib/services/db";
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
  Smartphone
} from "lucide-react";
import { TransactionModal } from "@/components/TransactionModal";
import { FilterDrawer } from "@/components/FilterDrawer";
import { format } from "date-fns";

export default function BookDetailPage() {
  const { id } = useParams() as { id: string };
  const { user, loading } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState({ method: 'All', category: 'All', dateRange: null as any });
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'in' | 'out'>('in');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();

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
      return matchMethod && matchCategory;
    });
  }, [transactions, filter]);

  const handleEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setIsTxModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsTxModalOpen(false);
    setEditingTx(null);
  };

  if (!book) return (
    <div className="flex items-center justify-center h-svh">
      <p className="text-muted-foreground animate-pulse">Memuatkan buku...</p>
    </div>
  );

  return (
    <div className="max-w-md mx-auto min-h-svh flex flex-col bg-background pb-32">
      <header className="p-6 pb-2 sticky top-0 bg-background/80 backdrop-blur-lg z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold truncate max-w-[200px]">{book.name}</h1>
        </div>
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsFilterOpen(true)}>
          <Filter className="w-5 h-5" />
        </Button>
      </header>

      <div className="px-6 space-y-6 overflow-y-auto mobile-scroll-container">
        {/* Balance Card */}
        <Card className="bg-primary text-white border-none shadow-xl rounded-[2.5rem] p-8">
          <div className="flex flex-col items-center gap-1 text-center mb-8">
            <span className="text-sm font-medium opacity-80 uppercase tracking-widest">Baki Bersih</span>
            <span className="text-5xl font-black tracking-tighter">
              RM{book.netBalance.toLocaleString()}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-3xl p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-[10px] uppercase font-bold opacity-70">Masuk</span>
              </div>
              <span className="text-lg font-bold truncate">RM{book.totalCashIn.toLocaleString()}</span>
            </div>
            <div className="bg-white/10 rounded-3xl p-4 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="text-[10px] uppercase font-bold opacity-70">Keluar</span>
              </div>
              <span className="text-lg font-bold truncate">RM{book.totalCashOut.toLocaleString()}</span>
            </div>
          </div>
        </Card>

        {/* Transactions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              Transaksi Terkini
            </h2>
            <span className="text-xs text-muted-foreground font-medium">{filteredTransactions.length} item</span>
          </div>

          <div className="space-y-3">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <Smartphone className="w-10 h-10 mx-auto mb-2" />
                <p className="text-sm">Tiada transaksi dijumpai</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => (
                <Card 
                  key={tx.id} 
                  className="border-none shadow-sm rounded-2xl overflow-hidden p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform"
                  onClick={() => handleEditTx(tx)}
                >
                  <div className={`p-3 rounded-2xl ${tx.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {tx.type === 'in' ? <ArrowUpCircle className="w-6 h-6" /> : <ArrowDownCircle className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-bold text-sm truncate">{tx.category}</h3>
                      <span className={`font-black text-sm ${tx.type === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'in' ? '+' : '-'}RM{tx.amount.toLocaleString()}
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
                        Bal: RM{tx.runningBalance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
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
