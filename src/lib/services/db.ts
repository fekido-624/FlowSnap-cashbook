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

const DEFAULT_CATEGORIES = ["Food", "Transport", "Entertainment", "Shopping", "Others", "Salary", "Investment"];

const getLocalBooks = (): Book[] => {
  if (typeof window === 'undefined') return [];
  const books = JSON.parse(localStorage.getItem('flowsnap_books') || '[]');
  // Pastikan data lama mempunyai customCategories
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

export const subscribeToTransactions = (bookId: string, filters: any, callback: (txs: Transaction[]) => void) => {
  const update = () => {
    const txs = getLocalTransactions(bookId).map(tx => ({
      ...tx,
      timestamp: { toDate: () => new Date(tx.timestamp as any) }
    }));
    // Susun mengikut tarikh menurun
    txs.sort((a, b) => b.timestamp.toDate().getTime() - a.timestamp.toDate().getTime());
    callback(txs as any);
  };
  update();
  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

export const addTransaction = async (userId: string, bookId: string, data: any) => {
  const books = getLocalBooks();
  const bookIndex = books.findIndex(b => b.id === bookId);
  if (bookIndex === -1) throw new Error("Buku tidak dijumpai");

  const currentBalance = books[bookIndex].netBalance;
  const newBalance = data.type === 'in' ? currentBalance + data.amount : currentBalance - data.amount;

  const txs = getLocalTransactions(bookId);
  const newTx: Transaction = {
    ...data,
    id: Math.random().toString(36).substr(2, 9),
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
