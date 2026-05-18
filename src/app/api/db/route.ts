import prisma from "@/lib/prisma";

const DEFAULT_CATEGORIES = ["Food", "Transport", "Entertainment", "Shopping", "Others", "Salary", "Investment"];

const formatBook = (book: any) => ({
  ...book,
  createdAt: book.createdAt,
  updatedAt: book.updatedAt,
  customCategories: Array.isArray(book.customCategories)
    ? book.customCategories
    : JSON.parse(book.customCategories || "[]")
});

const formatTransaction = (tx: any) => ({
  ...tx,
  timestamp: tx.timestamp
});

const formatChecklist = (checklist: any) => ({
  ...checklist,
  createdAt: checklist.createdAt,
  updatedAt: checklist.updatedAt,
  items: Array.isArray(checklist.items) ? checklist.items : JSON.parse(checklist.items || "[]")
});

const createId = () => Math.random().toString(36).substring(2, 11);

const ensureChecklistItems = (items: any) => {
  if (Array.isArray(items)) return items;
  try {
    return JSON.parse(items || "[]");
  } catch {
    return [];
  }
};

export async function POST(req: Request) {
  const body = await req.json();
  const action = body.action as string;
  const data = body.data || {};

  try {
    switch (action) {
      case "getBooksByUser": {
        const books = await prisma.book.findMany({
          where: { userId: data.userId },
          orderBy: { createdAt: "desc" }
        });
        return new Response(JSON.stringify(books.map(formatBook)), { status: 200 });
      }

      case "getBookById": {
        const book = await prisma.book.findUnique({ where: { id: data.id } });
        return new Response(JSON.stringify(book ? formatBook(book) : null), { status: 200 });
      }

      case "createBook": {
        const book = await prisma.book.create({
          data: {
            userId: data.userId,
            name: data.name,
            customCategories: JSON.stringify(DEFAULT_CATEGORIES),
            netBalance: 0,
            totalCashIn: 0,
            totalCashOut: 0
          }
        });
        return new Response(JSON.stringify(formatBook(book)), { status: 201 });
      }

      case "deleteBook": {
        const bookId = data.bookId;
        await prisma.checklist.updateMany({
          where: { bookId },
          data: { bookId: null }
        });
        await prisma.book.delete({ where: { id: bookId } });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      case "addCategoryToBook": {
        const book = await prisma.book.findUnique({ where: { id: data.bookId } });
        if (!book) return new Response(JSON.stringify({ error: "Buku tidak ditemui" }), { status: 404 });
        const categories = Array.isArray(book.customCategories) ? [...book.customCategories] : DEFAULT_CATEGORIES;
        if (!categories.includes(data.category)) {
          categories.push(data.category);
          await prisma.book.update({
            where: { id: data.bookId },
            data: { customCategories: JSON.stringify(categories) }
          });
        }
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      case "deleteCategoryFromBook": {
        const book = await prisma.book.findUnique({ where: { id: data.bookId } });
        if (!book) return new Response(JSON.stringify({ error: "Buku tidak ditemui" }), { status: 404 });
        const categories = Array.isArray(book.customCategories) ? [...book.customCategories] : DEFAULT_CATEGORIES;
        const updatedCategories = categories.filter(cat => cat !== data.category);
        await prisma.book.update({
          where: { id: data.bookId },
          data: { customCategories: JSON.stringify(updatedCategories) }
        });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      case "getTransactionsByBook": {
        const txs = await prisma.transaction.findMany({
          where: { bookId: data.bookId },
          orderBy: { timestamp: "desc" }
        });
        return new Response(JSON.stringify(txs.map(formatTransaction)), { status: 200 });
      }

      case "addTransaction": {
        const book = await prisma.book.findUnique({ where: { id: data.bookId } });
        if (!book) return new Response(JSON.stringify({ error: "Buku tidak dijumpai" }), { status: 404 });

        const amount = Number(data.amount) || 0;
        const netBalance = book.netBalance + (data.type === "in" ? amount : -amount);

        const txTimestamp = new Date();
        const tx = await prisma.transaction.create({
          data: {
            bookId: data.bookId,
            userId: data.userId,
            type: data.type,
            method: data.method,
            category: data.category,
            description: data.description,
            amount,
            timestamp: txTimestamp,
            runningBalance: netBalance
          }
        });

        await prisma.book.update({
          where: { id: data.bookId },
          data: {
            netBalance,
            totalCashIn: book.totalCashIn + (data.type === "in" ? amount : 0),
            totalCashOut: book.totalCashOut + (data.type === "out" ? amount : 0)
          }
        });

        return new Response(JSON.stringify(formatTransaction(tx)), { status: 201 });
      }

      case "updateTransaction": {
        const tx = await prisma.transaction.findUnique({ where: { id: data.txId } });
        if (!tx) return new Response(JSON.stringify({ error: "Transaksi tidak dijumpai" }), { status: 404 });
        const book = await prisma.book.findUnique({ where: { id: tx.bookId } });
        if (!book) return new Response(JSON.stringify({ error: "Buku tidak dijumpai" }), { status: 404 });

        const oldAmount = tx.amount;
        const oldType = tx.type;
        const amount = Number(data.amount) || oldAmount;
        const newType = data.type || oldType;

        let netBalance = book.netBalance;
        if (oldType === "in") netBalance -= oldAmount;
        else netBalance += oldAmount;
        if (newType === "in") netBalance += amount;
        else netBalance -= amount;

        const updatedTx = await prisma.transaction.update({
          where: { id: data.txId },
          data: {
            type: newType,
            method: data.method,
            category: data.category,
            description: data.description,
            amount,
            runningBalance: netBalance,
            timestamp: data.timestamp ? new Date(data.timestamp) : tx.timestamp
          }
        });

        await prisma.book.update({
          where: { id: book.id },
          data: {
            netBalance,
            totalCashIn: book.totalCashIn - (oldType === "in" ? oldAmount : 0) + (newType === "in" ? amount : 0),
            totalCashOut: book.totalCashOut - (oldType === "out" ? oldAmount : 0) + (newType === "out" ? amount : 0)
          }
        });

        return new Response(JSON.stringify(formatTransaction(updatedTx)), { status: 200 });
      }

      case "deleteTransaction": {
        const tx = await prisma.transaction.findUnique({ where: { id: data.txId } });
        if (!tx) return new Response(JSON.stringify({ error: "Transaksi tidak dijumpai" }), { status: 404 });
        const book = await prisma.book.findUnique({ where: { id: tx.bookId } });
        if (!book) return new Response(JSON.stringify({ error: "Buku tidak dijumpai" }), { status: 404 });

        const netBalance = book.netBalance - (tx.type === "in" ? tx.amount : -tx.amount);
        await prisma.transaction.delete({ where: { id: data.txId } });
        await prisma.book.update({
          where: { id: book.id },
          data: {
            netBalance,
            totalCashIn: book.totalCashIn - (tx.type === "in" ? tx.amount : 0),
            totalCashOut: book.totalCashOut - (tx.type === "out" ? tx.amount : 0)
          }
        });

        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      case "getChecklistsByUser": {
        const items = await prisma.checklist.findMany({
          where: { userId: data.userId },
          orderBy: { createdAt: "desc" }
        });
        return new Response(JSON.stringify(items.map(formatChecklist)), { status: 200 });
      }

      case "getChecklistById": {
        const checklist = await prisma.checklist.findUnique({ where: { id: data.id } });
        return new Response(JSON.stringify(checklist ? formatChecklist(checklist) : null), { status: 200 });
      }

      case "createChecklist": {
        const checklist = await prisma.checklist.create({
          data: {
            userId: data.userId,
            name: data.name,
            bookId: data.bookId === "none" ? null : data.bookId,
            items: JSON.stringify([])
          }
        });
        return new Response(JSON.stringify(formatChecklist(checklist)), { status: 201 });
      }

      case "updateChecklist": {
        const checklist = await prisma.checklist.update({
          where: { id: data.id },
          data: {
            name: data.name,
            bookId: data.bookId === "none" ? null : data.bookId
          }
        });
        return new Response(JSON.stringify(formatChecklist(checklist)), { status: 200 });
      }

      case "addChecklistItem": {
        const checklist = await prisma.checklist.findUnique({ where: { id: data.checklistId } });
        if (!checklist) return new Response(JSON.stringify({ error: "Checklist tidak dijumpai" }), { status: 404 });
        const items = ensureChecklistItems(checklist.items);
        const newItem = {
          id: createId(),
          name: data.name,
          amount: Number(data.amount) || 0,
          payments: {},
          validUntil: data.validUntil,
          excludedMonths: []
        };
        items.push(newItem);
        const updated = await prisma.checklist.update({
          where: { id: data.checklistId },
          data: { items: JSON.stringify(items) }
        });
        return new Response(JSON.stringify(formatChecklist(updated)), { status: 200 });
      }

      case "updateChecklistItem": {
        const checklist = await prisma.checklist.findUnique({ where: { id: data.checklistId } });
        if (!checklist) return new Response(JSON.stringify({ error: "Checklist tidak dijumpai" }), { status: 404 });
        const items = ensureChecklistItems(checklist.items);
        const idx = items.findIndex((item: any) => item.id === data.itemId);
        if (idx === -1) return new Response(JSON.stringify({ error: "Item tidak dijumpai" }), { status: 404 });

        const item = { ...items[idx] };
        const newAmount = Number(data.amount) || item.amount;
        const editMonthOnly = data.editMonthOnly === true;

        // If editing for a specific month only, set an override on that month's payment
        if (editMonthOnly && data.monthKey) {
          if (!item.amountFrom) item.amountFrom = {};
          item.amountFrom[data.monthKey] = newAmount;

          // Update linked transaction if already paid for this month
          if (item.payments?.[data.monthKey]?.isPaid && item.payments[data.monthKey].transactionId && checklist.bookId) {
            const txId = item.payments[data.monthKey].transactionId;
            const tx = await prisma.transaction.findUnique({ where: { id: txId } });
            if (tx) {
              const book = await prisma.book.findUnique({ where: { id: checklist.bookId } });
              if (book) {
                const diff = newAmount - tx.amount;
                await prisma.transaction.update({
                  where: { id: txId },
                  data: {
                    amount: newAmount,
                    description: `Bayaran: ${data.name || item.name} (${data.monthKey})`
                  }
                });
                await prisma.book.update({
                  where: { id: book.id },
                  data: {
                    netBalance: book.netBalance - diff,
                    totalCashOut: book.totalCashOut + diff,
                  }
                });
              }
            }
          }
        } else {
          // Global edit — update base amount and sync paid transactions
          if (data.monthKey && item.payments?.[data.monthKey]?.isPaid && item.payments[data.monthKey].transactionId && checklist.bookId) {
            await prisma.transaction.update({
              where: { id: item.payments[data.monthKey].transactionId },
              data: {
                amount: newAmount,
                description: `Bayaran: ${data.name} (${data.monthKey})`
              }
            });
          }
          item.amount = newAmount;
        }
        // Update validUntil if provided
        if (data.validUntil !== undefined) {
          item.validUntil = data.validUntil || undefined;
        }

        // Name always updates globally
        item.name = data.name || item.name;
        items[idx] = item;

        const updated = await prisma.checklist.update({
          where: { id: data.checklistId },
          data: { items: JSON.stringify(items) }
        });
        return new Response(JSON.stringify(formatChecklist(updated)), { status: 200 });
      }


      case "toggleChecklistItem": {
        const checklist = await prisma.checklist.findUnique({ where: { id: data.checklistId } });
        if (!checklist) return new Response(JSON.stringify({ error: "Checklist tidak dijumpai" }), { status: 404 });
        const items = ensureChecklistItems(checklist.items);
        const idx = items.findIndex((item: any) => item.id === data.itemId);
        if (idx === -1) return new Response(JSON.stringify({ error: "Item tidak dijumpai" }), { status: 404 });

        const item = { ...items[idx] };
        if (!item.payments) item.payments = {};
        const currentStatus = item.payments[data.monthKey]?.isPaid || false;
        const newPaidStatus = !currentStatus;
        // Use per-month override amount if available, otherwise base amount
        const effectiveAmount = item.payments[data.monthKey]?.amountOverride ?? item.amount;

        if (newPaidStatus && checklist.bookId) {
          const book = await prisma.book.findUnique({ where: { id: checklist.bookId } });
          if (book) {
            const categories = Array.isArray(book.customCategories) ? [...book.customCategories] : DEFAULT_CATEGORIES;
            if (!categories.includes(checklist.name)) {
              categories.push(checklist.name);
              await prisma.book.update({
                where: { id: book.id },
                data: { customCategories: JSON.stringify(categories) }
              });
            }
          }

          const tx = await prisma.transaction.create({
            data: {
              bookId: checklist.bookId,
              userId: data.userId,
              type: "out",
              method: "Online",
              category: checklist.name,
              description: `Bayaran: ${item.name} (${data.monthKey})`,
              amount: effectiveAmount,
              runningBalance: book ? book.netBalance - effectiveAmount : -effectiveAmount,
              timestamp: new Date()
            }
          });

          if (book) {
            await prisma.book.update({
              where: { id: book.id },
              data: {
                netBalance: book.netBalance - effectiveAmount,
                totalCashOut: book.totalCashOut + effectiveAmount
              }
            });
          }

          item.payments[data.monthKey] = {
            ...item.payments[data.monthKey],
            isPaid: true,
            transactionId: tx.id,
          };
        } else {
          if (item.payments[data.monthKey]?.transactionId && checklist.bookId) {
            const txId = item.payments[data.monthKey].transactionId;
            const tx = await prisma.transaction.findUnique({ where: { id: txId } });
            if (tx) {
              const book = await prisma.book.findUnique({ where: { id: checklist.bookId } });
              if (book) {
                await prisma.book.update({
                  where: { id: book.id },
                  data: {
                    netBalance: book.netBalance + tx.amount,
                    totalCashOut: book.totalCashOut - (tx.type === "out" ? tx.amount : 0),
                    totalCashIn: book.totalCashIn - (tx.type === "in" ? tx.amount : 0)
                  }
                });
              }
            }
            await prisma.transaction.delete({ where: { id: txId } });
          }
          item.payments[data.monthKey] = {
            ...item.payments[data.monthKey],
            isPaid: newPaidStatus,
            transactionId: undefined,
          };
        }

        items[idx] = item;
        const updatedChecklist = await prisma.checklist.update({
          where: { id: data.checklistId },
          data: { items: JSON.stringify(items) }
        });
        return new Response(JSON.stringify(formatChecklist(updatedChecklist)), { status: 200 });
      }

      case "excludeChecklistItem": {
        const checklist = await prisma.checklist.findUnique({ where: { id: data.checklistId } });
        if (!checklist) return new Response(JSON.stringify({ error: "Checklist tidak dijumpai" }), { status: 404 });
        const items = ensureChecklistItems(checklist.items);
        const idx = items.findIndex((item: any) => item.id === data.itemId);
        if (idx === -1) return new Response(JSON.stringify({ error: "Item tidak dijumpai" }), { status: 404 });
        const item = { ...items[idx] };
        if (item.payments?.[data.monthKey]?.isPaid && item.payments[data.monthKey].transactionId && checklist.bookId) {
          const txId = item.payments[data.monthKey].transactionId;
          const tx = await prisma.transaction.findUnique({ where: { id: txId } });
          if (tx) {
            const book = await prisma.book.findUnique({ where: { id: checklist.bookId } });
            if (book) {
              await prisma.book.update({
                where: { id: book.id },
                data: {
                  netBalance: book.netBalance + tx.amount,
                  totalCashOut: book.totalCashOut - (tx.type === "out" ? tx.amount : 0),
                  totalCashIn: book.totalCashIn - (tx.type === "in" ? tx.amount : 0)
                }
              });
            }
          }
          await prisma.transaction.delete({ where: { id: txId } });
          item.payments[data.monthKey] = { isPaid: false };
        }
        if (!item.excludedMonths) item.excludedMonths = [];
        if (!item.excludedMonths.includes(data.monthKey)) item.excludedMonths.push(data.monthKey);
        items[idx] = item;
        const updatedChecklist = await prisma.checklist.update({ where: { id: data.checklistId }, data: { items: JSON.stringify(items) } });
        return new Response(JSON.stringify(formatChecklist(updatedChecklist)), { status: 200 });
      }

      case "restoreChecklistItem": {
        const checklist = await prisma.checklist.findUnique({ where: { id: data.checklistId } });
        if (!checklist) return new Response(JSON.stringify({ error: "Checklist tidak dijumpai" }), { status: 404 });
        const items = ensureChecklistItems(checklist.items);
        const idx = items.findIndex((item: any) => item.id === data.itemId);
        if (idx === -1) return new Response(JSON.stringify({ error: "Item tidak dijumpai" }), { status: 404 });
        const item = { ...items[idx] };
        if (item.excludedMonths) {
          item.excludedMonths = item.excludedMonths.filter((month: string) => month !== data.monthKey);
        }
        items[idx] = item;
        const updatedChecklist = await prisma.checklist.update({ where: { id: data.checklistId }, data: { items: JSON.stringify(items) } });
        return new Response(JSON.stringify(formatChecklist(updatedChecklist)), { status: 200 });
      }

      case "deleteChecklistItem": {
        const checklist = await prisma.checklist.findUnique({ where: { id: data.checklistId } });
        if (!checklist) return new Response(JSON.stringify({ error: "Checklist tidak dijumpai" }), { status: 404 });
        const items = ensureChecklistItems(checklist.items).filter((item: any) => item.id !== data.itemId);
        const updatedChecklist = await prisma.checklist.update({ where: { id: data.checklistId }, data: { items: JSON.stringify(items) } });
        return new Response(JSON.stringify(formatChecklist(updatedChecklist)), { status: 200 });
      }

      case "deleteChecklist": {
        await prisma.checklist.delete({ where: { id: data.id } });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      case "deleteUserData": {
        const userId = data.userId;
        if (!userId) return new Response(JSON.stringify({ error: "userId diperlukan" }), { status: 400 });
        await prisma.transaction.deleteMany({ where: { userId } });
        await prisma.checklist.deleteMany({ where: { userId } });
        await prisma.book.deleteMany({ where: { userId } });
        return new Response(JSON.stringify({ success: true }), { status: 200 });
      }

      case "exportUserData": {
        const userId = data.userId;
        if (!userId) return new Response(JSON.stringify({ error: "userId diperlukan" }), { status: 400 });
        const [books, transactions, checklists] = await Promise.all([
          prisma.book.findMany({ where: { userId } }),
          prisma.transaction.findMany({ where: { userId } }),
          prisma.checklist.findMany({ where: { userId } })
        ]);
        return new Response(JSON.stringify({
          schemaVersion: 1,
          exportedAt: new Date().toISOString(),
          books: books.map(formatBook),
          transactions: transactions.map(formatTransaction),
          checklists: checklists.map(formatChecklist)
        }), { status: 200 });
      }

      case "importUserData": {
        const userId = data.userId;
        const payload = data.payload;
        const mode = data.mode === "replace" ? "replace" : "merge";

        if (!userId) return new Response(JSON.stringify({ error: "userId diperlukan" }), { status: 400 });
        if (!payload || typeof payload !== "object") return new Response(JSON.stringify({ error: "Format fail tidak sah" }), { status: 400 });
        if (payload.schemaVersion !== 1) return new Response(JSON.stringify({ error: "Versi fail backup tidak disokong" }), { status: 400 });
        if (!Array.isArray(payload.books) || !Array.isArray(payload.transactions) || !Array.isArray(payload.checklists)) {
          return new Response(JSON.stringify({ error: "Struktur fail backup tidak lengkap" }), { status: 400 });
        }

        if (mode === "replace") {
          await prisma.transaction.deleteMany({ where: { userId } });
          await prisma.checklist.deleteMany({ where: { userId } });
          await prisma.book.deleteMany({ where: { userId } });
        }

        const bookIdMap = new Map<string, string>();
        for (const book of payload.books) {
          const created = await prisma.book.create({
            data: {
              userId,
              name: String(book.name || "Buku Tanpa Nama"),
              netBalance: Number(book.netBalance) || 0,
              totalCashIn: Number(book.totalCashIn) || 0,
              totalCashOut: Number(book.totalCashOut) || 0,
              customCategories: JSON.stringify(
                Array.isArray(book.customCategories)
                  ? book.customCategories
                  : (typeof book.customCategories === "string" ? JSON.parse(book.customCategories || "[]") : [])
              )
            }
          });
          if (book.id) bookIdMap.set(String(book.id), created.id);
        }

        const txIdMap = new Map<string, string>();
        for (const tx of payload.transactions) {
          const newBookId = tx.bookId ? bookIdMap.get(String(tx.bookId)) : undefined;
          if (!newBookId) continue;
          const created = await prisma.transaction.create({
            data: {
              bookId: newBookId,
              userId,
              type: String(tx.type || "out"),
              method: String(tx.method || "Cash"),
              category: String(tx.category || "Others"),
              description: tx.description ? String(tx.description) : null,
              amount: Number(tx.amount) || 0,
              timestamp: tx.timestamp ? new Date(tx.timestamp) : new Date(),
              runningBalance: Number(tx.runningBalance) || 0
            }
          });
          if (tx.id) txIdMap.set(String(tx.id), created.id);
        }

        for (const cl of payload.checklists) {
          const newBookId = cl.bookId ? (bookIdMap.get(String(cl.bookId)) || null) : null;
          const rawItems = Array.isArray(cl.items)
            ? cl.items
            : (typeof cl.items === "string" ? JSON.parse(cl.items || "[]") : []);

          const items = rawItems.map((item: any) => {
            const newPayments: Record<string, any> = {};
            if (item.payments && typeof item.payments === "object") {
              for (const monthKey of Object.keys(item.payments)) {
                const p = item.payments[monthKey] || {};
                const remappedTxId = p.transactionId ? txIdMap.get(String(p.transactionId)) : undefined;
                newPayments[monthKey] = {
                  isPaid: Boolean(p.isPaid),
                  ...(remappedTxId ? { transactionId: remappedTxId } : {})
                };
              }
            }
            return {
              id: item.id || Math.random().toString(36).substring(2, 11),
              name: String(item.name || ""),
              amount: Number(item.amount) || 0,
              isFixed: Boolean(item.isFixed),
              payments: newPayments,
              validUntil: item.validUntil,
              excludedMonths: Array.isArray(item.excludedMonths) ? item.excludedMonths : []
            };
          });

          await prisma.checklist.create({
            data: {
              userId,
              name: String(cl.name || "Checklist"),
              bookId: newBookId,
              items: JSON.stringify(items)
            }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          booksImported: payload.books.length,
          transactionsImported: txIdMap.size,
          checklistsImported: payload.checklists.length
        }), { status: 200 });
      }

      default:
        return new Response(JSON.stringify({ error: "Action tidak dikenali" }), { status: 400 });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || "Ralat dalaman" }), { status: 500 });
  }
}
