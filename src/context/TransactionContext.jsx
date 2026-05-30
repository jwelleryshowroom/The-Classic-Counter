import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot, query, orderBy, writeBatch, getDocs, where } from 'firebase/firestore';
import { useToast } from './useToast';
import { useAuth } from './useAuth';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { TransactionContext } from './TransactionContextDef';

export const TransactionProvider = ({ children }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    // Default range: Current Month
    const [currentRange, setCurrentRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    });
    const { showToast } = useToast();
    const { user, businessId } = useAuth();

    useEffect(() => {
        if (!user || !businessId) {
            setTransactions([]);
            setLoading(false);
            return;
        }

        // Optimized Listener: Only listen to the requested range for the current business
        const q = query(
            collection(db, 'businesses', businessId, 'transactions'),
            where('date', '>=', currentRange.start.toISOString()),
            where('date', '<=', currentRange.end.toISOString()),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransactions(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching transactions:", error);
            // Ignore specialized index errors initially, as they might pop up before index is built
            if (error.code !== 'failed-precondition' && error.code !== 'permission-denied') {
                showToast("Failed to sync data.", "error");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentRange, showToast, user, businessId]);

    // Function to update the view (Components call this to switch context)
    const setViewDateRange = React.useCallback((startDate, endDate) => {
        setLoading(true);
        // Ensure we cover the full day boundaries
        setCurrentRange({
            start: startOfDay(startDate),
            end: endOfDay(endDate)
        });
    }, []);

    const addTransaction = async (transaction) => {
        try {
            if (!businessId) throw new Error("No business ID found. Cannot save transaction.");
            // Remove undefined fields to prevent Firestore crashes
            const cleanTransaction = JSON.parse(JSON.stringify(transaction));

            const docRef = await addDoc(collection(db, 'businesses', businessId, 'transactions'), {
                ...cleanTransaction,
                businessId,
                date: cleanTransaction.date || new Date().toISOString(), // Use provided date or new
                createdAt: new Date().toISOString()
            });
            // Silent success (User requested removal of notification)
            return docRef;
        } catch (error) {
            console.error("Error adding transaction:", error);
            showToast(`Failed: ${error.message}`, "error");
            throw error;
        }
    };

    const updateTransaction = async (id, updates) => {
        try {
            // Remove any undefined fields to prevent Firestore errors
            const cleanUpdates = JSON.parse(JSON.stringify(updates));

            await updateDoc(doc(db, 'businesses', businessId, 'transactions', id), cleanUpdates);
            showToast("Order updated.", "success");
        } catch (error) {
            console.error("Error updating transaction:", error);
            showToast("Failed to update order.", "error");
        }
    };

    const deleteTransaction = async (id) => {
        // Find transaction data before deleting for Undo capability
        const transactionToDelete = transactions.find(t => t.id === id);

        try {
            await deleteDoc(doc(db, 'businesses', businessId, 'transactions', id));

            if (transactionToDelete) {
                const { id: _, ...dataToRestore } = transactionToDelete;
                showToast("Transaction deleted.", "info", {
                    label: "UNDO",
                    onClick: () => addTransaction(dataToRestore) // Re-add clean data
                });
            } else {
                showToast("Transaction deleted.", "info");
            }
        } catch (error) {
            console.error("Error deleting transaction:", error);
            showToast("Failed to delete transaction.", "error");
        }
    };

    // [Refactored] Helper for Safe Batch Deletion (Chunks of 450)
    const safeBatchDelete = async (querySnapshot) => {
        const MAX_BATCH_SIZE = 450;
        const docs = querySnapshot.docs;
        const chunks = [];

        // Split docs into chunks
        for (let i = 0; i < docs.length; i += MAX_BATCH_SIZE) {
            chunks.push(docs.slice(i, i + MAX_BATCH_SIZE));
        }

        // Process chunks sequentially
        let deletedCount = 0;
        for (const chunk of chunks) {
            const batch = writeBatch(db);
            chunk.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            deletedCount += chunk.length;
            console.log(`Deleted batch of ${chunk.length} items...`);
        }
        return deletedCount;
    };

    const deleteTransactionsByDateRange = async (startDate, endDate) => {
        try {
            if (!businessId) return;
            const q = query(
                collection(db, 'businesses', businessId, 'transactions'),
                where('date', '>=', startDate),
                where('date', '<=', endDate)
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                showToast("No records found in range.", "info");
                return;
            }

            const count = await safeBatchDelete(snapshot);
            showToast(`Cleared ${count} records safely.`, "success");
        } catch (error) {
            console.error("Error deleting data range:", error);
            showToast("Failed to clear data.", "error");
        }
    };

    const clearAllTransactions = async () => {
        try {
            if (!businessId) return;
            const q = collection(db, 'businesses', businessId, 'transactions');
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                showToast("Database is already empty.", "info");
                return;
            }

            const count = await safeBatchDelete(snapshot);
            showToast(`Database wiped (${count} records).`, "success");
        } catch (error) {
            console.error("Error clearing database:", error);
            showToast("Failed to wipe database.", "error");
        }
    };

    const value = {
        transactions,
        loading,
        currentRange,
        setViewDateRange,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactionsByDateRange,
        clearAllTransactions
    };

    return (
        <TransactionContext.Provider value={value}>
            {children}
        </TransactionContext.Provider>
    );
};
