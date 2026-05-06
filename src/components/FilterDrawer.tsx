"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { subscribeToBook, Book } from "@/lib/services/db";

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilter: any;
  onApply: (filter: any) => void;
  bookId: string;
}

export function FilterDrawer({ isOpen, onClose, currentFilter, onApply, bookId }: FilterDrawerProps) {
  const [filter, setFilter] = useState(currentFilter);
  const [book, setBook] = useState<Book | null>(null);

  useEffect(() => {
    if (bookId && isOpen) {
      const unsub = subscribeToBook(bookId, (data) => setBook(data));
      return () => unsub();
    }
  }, [bookId, isOpen]);

  // Sync internal state with external filter when drawer opens
  useEffect(() => {
    if (isOpen) {
      setFilter(currentFilter);
    }
  }, [isOpen, currentFilter]);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-[2.5rem] p-8 border-none">
        <SheetHeader>
          <SheetTitle className="text-2xl font-black text-center mb-6">Tapis Transaksi</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Kaedah Pembayaran</Label>
            <Select value={filter.method} onValueChange={(v) => setFilter({ ...filter, method: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Semua Kaedah" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">Semua Kaedah</SelectItem>
                <SelectItem value="Cash">Tunai</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Kategori</Label>
            <Select value={filter.category} onValueChange={(v) => setFilter({ ...filter, category: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">Semua Kategori</SelectItem>
                {book?.customCategories?.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <SheetFooter className="mt-8 flex flex-row gap-4">
          <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => {
            const reset = { method: 'All', category: 'All', dateRange: null };
            setFilter(reset);
            onApply(reset);
            onClose();
          }}>Set Semula</Button>
          <Button className="flex-1 h-12 rounded-xl font-bold" onClick={() => {
            onApply(filter);
            onClose();
          }}>Guna Tapisan</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}