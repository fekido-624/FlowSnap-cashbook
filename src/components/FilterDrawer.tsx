"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect, useMemo } from "react";
import { subscribeToBook, Book } from "@/lib/services/db";
import { format, addMonths, subMonths, startOfMonth } from "date-fns";

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

  // Generate month options: 6 months back + current + 6 months forward
  const monthOptions = useMemo(() => {
    const now = startOfMonth(new Date());
    const months = [];
    for (let i = -6; i <= 6; i++) {
      const d = i < 0 ? subMonths(now, Math.abs(i)) : addMonths(now, i);
      months.push({
        label: format(d, "MMMM yyyy"),
        value: format(d, "yyyy-MM"),
      });
    }
    return months;
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-[2.5rem] p-8 border-none">
        <SheetHeader>
          <SheetTitle className="text-2xl font-black text-center mb-6">Tapis Transaksi</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-4">
          {/* Month Filter */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Bulan</Label>
            <Select value={filter.month || 'All'} onValueChange={(v) => setFilter({ ...filter, month: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Semua Bulan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="All">Semua Bulan</SelectItem>
                {monthOptions.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transaction Type Filter */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Jenis Transaksi</Label>
            <Select value={filter.type || 'All'} onValueChange={(v) => setFilter({ ...filter, type: v })}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Semua Jenis" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="All">Semua Jenis</SelectItem>
                <SelectItem value="in">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Masuk
                  </span>
                </SelectItem>
                <SelectItem value="out">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> Keluar
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method Filter */}
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

          {/* Category Filter */}
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
            const reset = { method: 'All', category: 'All', type: 'All', month: 'All', dateRange: null };
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