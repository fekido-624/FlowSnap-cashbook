// Implementasi Mock DB menggunakan localStorage
export interface Book {
  id: string;
  name: string;
  userId: string;
  createdAt: { toDate: () => Date };
  netBalance: number;
  totalCashIn: number;
  totalCashOut: number;
  customCategories: string[];
}

export interface Transaction {
  id: string;
  bookId: string;
  userId: string;
  type: 'in' | 'out';
  amount: number;
  method: 'Cash' | 'Online';
  category: string;
  description?: string;
  timestamp: { toDate: () => Date };
  runningBalance: number;
}

export interface ChecklistItem {
  id: string;
  name: string;
  amount: number;
  isPaid: boolean;
  transactionId?: string;
}

export interface Checklist {
  id: string;
  userId: string;
  name: string;
  bookId?: string;
  items: ChecklistItem[];
  createdAt: { toDate: () => Date };
}

const DEFAULT_CATEGORIES = ["Food", "Transport", "Entertainment", "Shopping", "Others", "Salary", "Investment"];

const getLocalBooks = (): Book[] => {
  if (typeof window === 'undefined') return [];
  const books = JSON.parse(localStorage.getItem('flowsnap_books') || '[]');
  return books.map((b: any) => ({
    ...b,
    customCategories: b.customCategories || [...DEFAULT_CATEGORIES]
  }));
};

const setLocalBooks = (books: Book[]) => {
  localStorage.setItem('flowsnap_books', JSON.stringify(books));
};

const getLocalTransactions = (bookId: string): Transaction[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(`flowsnap_txs_${bookId}`) || '[]');
};

const setLocalTransactions = (bookId: string, txs: Transaction[]) => {
  localStorage.setItem(`flowsnap_txs_${bookId}`, JSON.stringify(txs));
};

const getLocalChecklists = (): Checklist[] => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem('flowsnap_checklists') || '[]');
};

const setLocalChecklists = (checklists: Checklist[]) => {
  localStorage.setItem('flowsnap_checklists', JSON.stringify(checklists));
};

// --- Book Services ---
export const createBook = async (userId: string, name: string) => {
  const books = getLocalBooks();
  const newBook: Book = {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    name,
    createdAt: { toDate: () => new Date() },
    netBalance: 0,
    totalCashIn: 0,
    totalCashOut: 0,
    customCategories: [...DEFAULT_CATEGORIES]
  };
  books.unshift(newBook);
  setLocalBooks(books);
  return newBook;
};

export const deleteBook = async (bookId: string) => {
  const books = getLocalBooks();
  const updatedBooks = books.filter(b => b.id !== bookId);
  setLocalBooks(updatedBooks);
  localStorage.removeItem(`flowsnap_txs_${bookId}`);
};

export const addCategoryToBook = async (bookId: string, category: string) => {
  const books = getLocalBooks();
  const index = books.findIndex(b => b.id === bookId);
  if (index !== -1) {
    if (!books[index].customCategories) {
      books[index].customCategories = [...DEFAULT_CATEGORIES];
    }
    if (!books[index].customCategories.includes(category)) {
      books[index].customCategories.push(category);
      setLocalBooks(books);
    }
  }
};

export const subscribeToBooks = (userId: string, callback: (books: Book[]) => void) => {
  const update = () => {
    const books = getLocalBooks().filter(b => b.userId === userId);
    callback(books);
  };
  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

export const subscribeToBook = (bookId: string, callback: (book: Book | null) => void) => {
  const update = () => {
    const books = getLocalBooks();
    const book = books.find(b => b.id === bookId) || null;
    callback(book);
  };
  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

// --- Transaction Services ---
export const addTransaction = async (userId: string, bookId: string, data: any) => {
  const books = getLocalBooks();
  const bookIndex = books.findIndex(b => b.id === bookId);
  if (bookIndex === -1) throw new Error("Buku tidak dijumpai");

  const currentBalance = books[bookIndex].netBalance;
  const newBalance = data.type === 'in' ? currentBalance + data.amount : currentBalance - data.amount;

  const txs = getLocalTransactions(bookId);
  const newTx: Transaction = {
    ...data,
    id: data.id || Math.random().toString(36).substr(2, 9),
    userId,
    bookId,
    timestamp: new Date() as any,
    runningBalance: newBalance
  };

  txs.unshift(newTx);
  setLocalTransactions(bookId, txs);

  books[bookIndex].netBalance = newBalance;
  if (data.type === 'in') {
    books[bookIndex].totalCashIn += data.amount;
  } else {
    books[bookIndex].totalCashOut += data.amount;
  }
  setLocalBooks(books);

  return newTx;
};

export const updateTransaction = async (userId: string, bookId: string, txId: string, data: any) => {
  const books = getLocalBooks();
  const bookIndex = books.findIndex(b => b.id === bookId);
  if (bookIndex === -1) throw new Error("Buku tidak dijumpai");

  const txs = getLocalTransactions(bookId);
  const txIndex = txs.findIndex(t => t.id === txId);
  if (txIndex === -1) throw new Error("Transaksi tidak dijumpai");

  const oldTx = txs[txIndex];
  
  if (oldTx.type === 'in') {
    books[bookIndex].netBalance -= oldTx.amount;
    books[bookIndex].totalCashIn -= oldTx.amount;
  } else {
    books[bookIndex].netBalance += oldTx.amount;
    books[bookIndex].totalCashOut -= oldTx.amount;
  }

  if (data.type === 'in') {
    books[bookIndex].netBalance += data.amount;
    books[bookIndex].totalCashIn += data.amount;
  } else {
    books[bookIndex].netBalance -= data.amount;
    books[bookIndex].totalCashOut += data.amount;
  }

  const updatedTx: Transaction = {
    ...oldTx,
    ...data,
    runningBalance: books[bookIndex].netBalance
  };

  txs[txIndex] = updatedTx;
  setLocalTransactions(bookId, txs);
  setLocalBooks(books);

  return updatedTx;
};

export const deleteTransaction = async (bookId: string, txId: string) => {
  const books = getLocalBooks();
  const bookIndex = books.findIndex(b => b.id === bookId);
  if (bookIndex === -1) return;

  const txs = getLocalTransactions(bookId);
  const txIndex = txs.findIndex(t => t.id === txId);
  if (txIndex === -1) return;

  const txToDelete = txs[txIndex];

  if (txToDelete.type === 'in') {
    books[bookIndex].netBalance -= txToDelete.amount;
    books[bookIndex].totalCashIn -= txToDelete.amount;
  } else {
    books[bookIndex].netBalance += txToDelete.amount;
    books[bookIndex].totalCashOut -= txToDelete.amount;
  }

  txs.splice(txIndex, 1);
  setLocalTransactions(bookId, txs);
  setLocalBooks(books);
};

export const subscribeToTransactions = (bookId: string, filters: any, callback: (txs: Transaction[]) => void) => {
  const update = () => {
    const txs = getLocalTransactions(bookId).map(tx => ({
      ...tx,
      timestamp: { toDate: () => new Date(tx.timestamp as any) }
    }));
    txs.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
    callback(txs as any);
  };
  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

// --- Checklist Services ---
export const createChecklist = async (userId: string, name: string, bookId?: string) => {
  const checklists = getLocalChecklists();
  const newChecklist: Checklist = {
    id: Math.random().toString(36).substr(2, 9),
    userId,
    name,
    bookId,
    items: [],
    createdAt: { toDate: () => new Date() }
  };
  checklists.unshift(newChecklist);
  setLocalChecklists(checklists);
  return newChecklist;
};

export const updateChecklist = async (id: string, name: string, bookId?: string) => {
  const checklists = getLocalChecklists();
  const idx = checklists.findIndex(c => c.id === id);
  if (idx !== -1) {
    checklists[idx].name = name;
    checklists[idx].bookId = bookId === "none" ? undefined : bookId;
    setLocalChecklists(checklists);
  }
};

export const subscribeToChecklists = (userId: string, callback: (data: Checklist[]) => void) => {
  const update = () => {
    const data = getLocalChecklists().filter(c => c.userId === userId);
    callback(data);
  };
  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

export const subscribeToChecklist = (id: string, callback: (data: Checklist | null) => void) => {
  const update = () => {
    const data = getLocalChecklists().find(c => c.id === id) || null;
    callback(data);
  };
  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

export const addChecklistItem = async (checklistId: string, name: string, amount: number) => {
  const checklists = getLocalChecklists();
  const idx = checklists.findIndex(c => c.id === checklistId);
  if (idx === -1) return;

  const newItem: ChecklistItem = {
    id: Math.random().toString(36).substr(2, 9),
    name,
    amount,
    isPaid: false
  };

  checklists[idx].items.push(newItem);
  setLocalChecklists(checklists);
};

export const updateChecklistItem = async (userId: string, checklistId: string, itemId: string, name: string, amount: number) => {
  const checklists = getLocalChecklists();
  const cIdx = checklists.findIndex(c => c.id === checklistId);
  if (cIdx === -1) return;

  const checklist = checklists[cIdx];
  const iIdx = checklist.items.findIndex(i => i.id === itemId);
  if (iIdx === -1) return;

  const item = checklist.items[iIdx];
  
  // Jika item sudah dibayar dan ada pautan buku akaun, kemas kini transaksi juga
  if (item.isPaid && item.transactionId && checklist.bookId) {
    await updateTransaction(userId, checklist.bookId, item.transactionId, {
      amount: amount,
      description: `Bayaran: ${name} (${checklist.name})`
    });
  }

  item.name = name;
  item.amount = amount;
  setLocalChecklists(checklists);
};

export const toggleChecklistItem = async (userId: string, checklistId: string, itemId: string) => {
  const checklists = getLocalChecklists();
  const cIdx = checklists.findIndex(c => c.id === checklistId);
  if (cIdx === -1) return;

  const checklist = checklists[cIdx];
  const iIdx = checklist.items.findIndex(i => i.id === itemId);
  if (iIdx === -1) return;

  const item = checklist.items[iIdx];
  const newPaidStatus = !item.isPaid;

  if (newPaidStatus && checklist.bookId) {
    // Automatik tambah transaksi ke Buku Akaun
    const tx = await addTransaction(userId, checklist.bookId, {
      type: 'out',
      amount: item.amount,
      method: 'Online',
      category: 'Checklist',
      description: `Bayaran: ${item.name} (${checklist.name})`
    });
    item.transactionId = tx.id;
  } else if (!newPaidStatus && item.transactionId && checklist.bookId) {
    // Padam transaksi jika un-tick
    await deleteTransaction(checklist.bookId, item.transactionId);
    item.transactionId = undefined;
  }

  item.isPaid = newPaidStatus;
  setLocalChecklists(checklists);
};

export const deleteChecklistItem = async (checklistId: string, itemId: string) => {
  const checklists = getLocalChecklists();
  const cIdx = checklists.findIndex(c => c.id === checklistId);
  if (cIdx === -1) return;

  const checklist = checklists[cIdx];
  const item = checklist.items.find(i => i.id === itemId);
  
  if (item?.transactionId && checklist.bookId) {
    await deleteTransaction(checklist.bookId, item.transactionId);
  }

  checklist.items = checklist.items.filter(i => i.id !== itemId);
  setLocalChecklists(checklists);
};

export const deleteChecklist = async (id: string) => {
  const checklists = getLocalChecklists();
  const checklist = checklists.find(c => c.id === id);
  
  if (checklist) {
    // Padam semua transaksi berkaitan item dalam checklist ini
    for (const item of checklist.items) {
      if (item.transactionId && checklist.bookId) {
        await deleteTransaction(checklist.bookId, item.transactionId);
      }
    }
  }

  const filtered = checklists.filter(c => c.id !== id);
  setLocalChecklists(filtered);
};
