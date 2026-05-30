import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, onSnapshot, query, orderBy, deleteDoc, writeBatch, getDocs, arrayUnion, where } from 'firebase/firestore';
import { useToast } from './useToast';
import { useTransactions } from './useTransactions';
import { useAuth } from './useAuth';
import { TableSessionContext } from './TableSessionContextDef';

export const TableSessionProvider = ({ children }) => {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { addTransaction } = useTransactions();
    const { user, businessId } = useAuth();

    useEffect(() => {
        if (!user || !businessId) {
            setSessions([]);
            setLoading(false);
            return;
        }

        // Listen to all active sessions for the current business
        const q = query(
            collection(db, 'businesses', businessId, 'tableSessions'),
            orderBy('createdAt', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSessions(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching table sessions:", error);
            if (error.code !== 'failed-precondition' && error.code !== 'permission-denied') {
                showToast("Failed to sync table sessions.", "error");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [showToast, user, businessId]);

    // Create a new session when a table is occupied
    const createSession = async (tableId) => {
        try {
            if (!businessId) throw new Error("No business ID found. Cannot create session.");
            const docRef = await addDoc(collection(db, 'businesses', businessId, 'tableSessions'), {
                tableId,
                status: 'Occupied', // Available (deleted), Occupied, Billing Requested
                kots: [],
                businessId,
                createdAt: new Date().toISOString()
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating session:", error);
            showToast("Failed to create table session.", "error");
            throw error;
        }
    };

    // Push a new KOT (Kitchen Order Ticket) to an active session
    const addKOT = async (sessionId, items) => {
        try {
            const newKOT = {
                id: Date.now().toString(),
                items: items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    qty: Number(item.qty),
                    category: item.category || 'General',
                })),
                status: 'ordered', // ordered -> preparing -> ready -> served
                createdAt: new Date().toISOString()
            };

            await updateDoc(doc(db, 'businesses', businessId, 'tableSessions', sessionId), {
                kots: arrayUnion(newKOT)
            });
            showToast("Order sent to kitchen!", "success");
            return newKOT.id;
        } catch (error) {
            console.error("Error adding KOT:", error);
            showToast("Failed to send order.", "error");
            throw error;
        }
    };

    // Update KOT status (Kitchen Board will use this)
    const updateKOTStatus = async (sessionId, kotId, newStatus) => {
        try {
            const session = sessions.find(s => s.id === sessionId);
            if (!session) throw new Error("Session not found");

            const updatedKOTs = session.kots.map(kot => 
                kot.id === kotId ? { ...kot, status: newStatus } : kot
            );

            await updateDoc(doc(db, 'businesses', businessId, 'tableSessions', sessionId), {
                kots: updatedKOTs
            });

            if (newStatus === 'ready') {
                showToast(`Table ${session.tableId.replace(/^T/i, '')} is ready to serve!`, "success");
            }

        } catch (error) {
            console.error("Error updating KOT status:", error);
            showToast("Failed to update status.", "error");
        }
    };

    // Settle a session and create a finalized transaction
    const settleSession = async (sessionId, paymentDetails, additionalItems = []) => {
        try {
            const session = sessions.find(s => s.id === sessionId);
            if (!session) throw new Error("Session not found");

            // Flatten all KOT items
            const sessionItems = (session.kots || []).flatMap(kot => kot.items);
            
            // Combine with additional items (like parcels)
            const allItems = [...sessionItems, ...additionalItems];

            const groupedItemsMap = new Map();
            allItems.forEach(item => {
                if (groupedItemsMap.has(item.id)) {
                    const existing = groupedItemsMap.get(item.id);
                    existing.qty += item.qty;
                } else {
                    groupedItemsMap.set(item.id, { ...item });
                }
            });
            
            const finalItems = Array.from(groupedItemsMap.values());
            const totalAmount = finalItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

            // Create Transaction
            const transactionData = {
                type: 'dine_in',
                amount: totalAmount,
                totalValue: totalAmount,
                items: finalItems,
                date: new Date().toISOString(),
                description: `Dine-In Settlement for Table ${session.tableId.replace(/^T/i, '')}`,
                customer: {
                    name: `Table ${session.tableId.replace(/^T/i, '')}`,
                    phone: '',
                    note: ''
                },
                payment: {
                    method: paymentDetails.method || 'cash',
                    advance: totalAmount,
                    balance: 0,
                    status: 'paid'
                },
                status: 'completed',
                tableId: session.tableId,
                sessionId: session.id
            };

            await addTransaction(transactionData);

            // Close session by deleting it
            await deleteDoc(doc(db, 'businesses', businessId, 'tableSessions', sessionId));
            
            showToast(`Table ${session.tableId.replace(/^T/i, '')} settled successfully!`, "success");

        } catch (error) {
            console.error("Error settling session:", error);
            showToast("Failed to settle session.", "error");
        }
    };

    const updateSessionStatus = async (sessionId, status) => {
         try {
            await updateDoc(doc(db, 'businesses', businessId, 'tableSessions', sessionId), {
                status
            });
         } catch (error) {
            console.error("Error updating session status:", error);
            showToast("Failed to update table status.", "error");
         }
    };

    const clearAllSessions = async () => {
        try {
            if (!businessId) return;
            const q = collection(db, 'businesses', businessId, 'tableSessions');
            const snapshot = await getDocs(q);
            const batch = writeBatch(db);
            snapshot.docs.forEach(d => batch.delete(d.ref));
            await batch.commit();
            showToast("All sessions closed.", "success");
        } catch (error) {
            console.error("Error clearing sessions:", error);
            showToast("Failed to close all sessions.", "error");
        }
    };


    const value = {
        sessions,
        loading,
        createSession,
        addKOT,
        updateKOTStatus,
        settleSession,
        updateSessionStatus,
        clearAllSessions
    };

    return (
        <TableSessionContext.Provider value={value}>
            {children}
        </TableSessionContext.Provider>
    );
};
