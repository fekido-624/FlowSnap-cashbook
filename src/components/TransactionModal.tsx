"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addTransaction, addCategoryToBook, subscribeToBook, Book } from "@/lib/services/db";
import { useAuth } from "@/lib/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { suggestCategories } from "@/ai/flows/smart-category-suggestion";
import { Sparkles, Loader2, Plus, X } from "lucide-react";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'in' | 'out';
  bookId: string;
}

export function TransactionModal({ isOpen, onClose, type, bookId }: TransactionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<'Cash' | 'Online'>("Cash");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [book, setBook] = useState<Book | null>(null);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  useEffect(() => {
    if (bookId) {
      const unsub = subscribeToBook(bookId, (data) => setBook(data));
      return () => unsub();
    }
  }, [bookId]);

  useEffect(() => {
    if (!isOpen) {
      setAmount("");
      setCategory("");
      setDescription("");
      setSuggestions([]);
      setIsAddingNewCategory(false);
      setNewCategoryName("");
    }
  }, [isOpen]);

  const fetchSuggestions = async (desc: string) => {
    if (desc.length < 3) return;
    setIsSuggesting(true);
    try {
      const result = await suggestCategories({ description: desc });
      setSuggestions(result.suggestedCategories);
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
    toast({ title: "Category Added", description: `"${newCategoryName}" has been added to this book.` });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !category) return;

    setLoading(true);
    try {
      await addTransaction(user.uid, bookId, {
        type,
        amount: parseFloat(amount),
        method,
        category,
        description: description.trim() || undefined
      });
      toast({ title: "Transaction Added", description: `Successfully recorded ${type === 'in' ? 'income' : 'expense'}.` });
      onClose();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-t-[2.5rem] sm:rounded-[2.5rem] max-w-[100vw] sm:max-w-md fixed bottom-0 top-auto translate-y-0 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%] p-8 border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-center mb-4">
            Record {type === 'in' ? 'Cash In' : 'Cash Out'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Amount</Label>
            <div className="relative">
              <span className="absolute left-4 top-[50%] translate-y-[-50%] font-bold text-2xl text-primary">$</span>
              <Input 
                type="number" 
                placeholder="0.00" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="pl-10 h-16 rounded-2xl text-2xl font-black focus:ring-primary border-muted"
                autoFocus
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Method</Label>
              <Select value={method} onValueChange={(v: any) => setMethod(v)}>
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Select Method" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Category</Label>
              {!isAddingNewCategory ? (
                <div className="flex gap-2">
                  <Select value={category} onValueChange={(v) => setCategory(v)}>
                    <SelectTrigger className="h-12 rounded-xl flex-1">
                      <SelectValue placeholder="Select" />
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
                    placeholder="New..." 
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
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Description</Label>
            <Input 
              placeholder="What is this for?" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => fetchSuggestions(description)}
              className="h-12 rounded-xl"
            />
          </div>

          {suggestions.length > 0 && (
            <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
              <div className="flex items-center gap-1.5 mb-2 text-primary">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-black tracking-widest">Smart Suggestions</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <Button 
                    key={s} 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="rounded-full text-[10px] h-7 px-3 bg-white border-primary/20 hover:bg-primary hover:text-white transition-colors"
                    onClick={async () => {
                      await addCategoryToBook(bookId, s);
                      setCategory(s);
                    }}
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {isSuggesting && (
             <div className="flex items-center justify-center gap-2 py-2 text-primary">
               <Loader2 className="w-4 h-4 animate-spin" />
               <span className="text-xs font-medium">Analyzing description...</span>
             </div>
          )}

          <DialogFooter className="pt-4">
            <Button 
              type="submit" 
              className={`w-full h-14 rounded-2xl text-lg font-bold shadow-lg ${type === 'in' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'}`}
              disabled={loading || !category}
            >
              {loading ? "Processing..." : "Save Transaction"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
