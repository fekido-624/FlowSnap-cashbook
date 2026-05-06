
"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addTransaction, updateTransaction, deleteTransaction, addCategoryToBook, subscribeToBook, Book, Transaction } from "@/lib/services/db";
import { useAuth } from "@/lib/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { Plus, X, Trash2, Sparkles, Loader2 } from "lucide-react";
import { suggestCategories } from "@/ai/flows/smart-category-suggestion";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'in' | 'out';
  bookId: string;
  editingTransaction?: Transaction | null;
}

export function TransactionModal({ isOpen, onClose, type: initialType, bookId, editingTransaction }: TransactionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<'Cash' | 'Online'>("Cash");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<'in' | 'out'>(initialType);
  const [loading, setLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    setType(initialType);
  }, [initialType]);

  useEffect(() => {
    if (bookId && isOpen) {
      const unsub = subscribeToBook(bookId, (data) => setBook(data));
      return () => unsub();
    }
  }, [bookId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (editingTransaction) {
        setAmount(editingTransaction.amount.toString());
        setMethod(editingTransaction.method);
        setCategory(editingTransaction.category);
        setDescription(editingTransaction.description || "");
        setType(editingTransaction.type);
      } else {
        setAmount("");
        setCategory("");
        setDescription("");
        setMethod("Cash");
        setType(initialType);
      }
      setIsAddingNewCategory(false);
      setNewCategoryName("");
    }
  }, [isOpen, editingTransaction, initialType]);

  const handleSuggest = async () => {
    if (!description.trim()) return;
    setIsSuggesting(true);
    try {
      const result = await suggestCategories({
        description,
        existingCategories: book?.customCategories || []
      });
      if (result.suggestedCategories.length > 0) {
        const suggested = result.suggestedCategories[0];
        setCategory(suggested);
        toast({
          title: "Cadangan Pintar",
          description: `Kategori dilaraskan kepada "${suggested}" berdasarkan catatan anda.`,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleAddNewCategory = async () => {
    if (!newCategoryName.trim()) return;
    await addCategoryToBook(bookId, newCategoryName.trim());
    setCategory(newCategoryName.trim());
    setNewCategoryName("");
    setIsAddingNewCategory(false);
    toast({ title: "Kategori Ditambah", description: `"${newCategoryName}" telah ditambah ke dalam buku ini.` });
  };

  const handleDelete = async () => {
    if (!editingTransaction) return;
    if (!confirm("Adakah anda pasti mahu memadam transaksi ini?")) return;

    setLoading(true);
    try {
      await deleteTransaction(bookId, editingTransaction.id);
      toast({ title: "Dipadam", description: "Transaksi telah berjaya dipadam." });
      onClose();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Ralat", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !category) return;

    setLoading(true);
    try {
      const txData = {
        type,
        amount: parseFloat(amount),
        method,
        category,
        description: description.trim() || undefined
      };

      if (editingTransaction) {
        await updateTransaction(user.uid, bookId, editingTransaction.id, txData);
        toast({ title: "Berjaya Dikemas Kini", description: "Transaksi telah dikemas kini." });
      } else {
        await addTransaction(user.uid, bookId, txData);
        toast({ title: "Transaksi Berjaya", description: `Berjaya merekodkan ${type === 'in' ? 'pendapatan' : 'perbelanjaan'}.` });
      }
      onClose();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Ralat", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-[100vw] sm:max-w-md fixed bottom-0 top-auto translate-y-0 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%] p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center mb-4">
            {editingTransaction ? 'Edit Rekod' : `Rekod ${type === 'in' ? 'Wang Masuk' : 'Wang Keluar'}`}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Jumlah</Label>
            <div className="relative">
              <span className="absolute left-4 top-[50%] translate-y-[-50%] font-bold text-2xl text-primary">RM</span>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="pl-14 h-16 rounded-2xl text-2xl font-black focus:ring-primary border-muted"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Kaedah</Label>
              <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Pilih Kaedah" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Cash">Tunai</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Kategori</Label>
              {!isAddingNewCategory ? (
                <div className="flex gap-2">
                  <Select value={category} onValueChange={(v) => setCategory(v)}>
                    <SelectTrigger className="h-12 rounded-xl flex-1">
                      <SelectValue placeholder="Pilih" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {book?.customCategories?.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl"
                    onClick={() => setIsAddingNewCategory(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input 
                    placeholder="Baru..." 
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    className="h-12 rounded-xl flex-1"
                    autoFocus
                  />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl"
                    onClick={() => setIsAddingNewCategory(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button 
                    type="button" 
                    className="h-12 w-12 rounded-xl"
                    onClick={handleAddNewCategory}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Catatan</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="Untuk apa?" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => !editingTransaction && handleSuggest()}
                className="h-12 rounded-xl flex-1"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className={`h-12 w-12 rounded-xl ${isSuggesting ? 'animate-pulse text-primary' : 'text-muted-foreground'}`}
                onClick={handleSuggest}
                disabled={isSuggesting || !description}
              >
                {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <DialogFooter className="pt-4 flex flex-col gap-3">
            <Button 
              type="submit" 
              className={`w-full h-14 rounded-2xl text-lg font-bold shadow-lg ${type === 'in' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
              disabled={loading || !category}
            >
              {loading ? "Memproses..." : editingTransaction ? "Kemas Kini" : "Simpan Transaksi"}
            </Button>
            
            {editingTransaction && (
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full h-12 rounded-xl text-rose-500 font-bold flex gap-2 hover:bg-rose-50"
                onClick={handleDelete}
                disabled={loading}
              >
                <Trash2 className="w-4 h-4" /> Padam Transaksi
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
