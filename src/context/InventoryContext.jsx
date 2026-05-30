import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../firebase';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    writeBatch,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { useToast } from './useToast';
import { useAuth } from './useAuth';

const InventoryContext = createContext();

export const useInventory = () => useContext(InventoryContext);

export const InventoryProvider = ({ children }) => {
    // Initial Seed Data (Same as before)
    const defaultItems = [
        { name: 'Veg Puff', price: 25, category: 'Snacks', stock: 45, image: '🥐' },
        { name: 'Black Forest (1kg)', price: 800, category: 'Cakes', stock: 2, image: '🎂' },
        { name: 'Chocolate Truffle', price: 550, category: 'Cakes', stock: 5, image: '🍫' },
        { name: 'Pineapple Cake', price: 450, category: 'Cakes', stock: 3, image: '🍰' },
        { name: 'Coke (300ml)', price: 40, category: 'Drinks', stock: 45, image: '🥤' },
        { name: 'Chicken Puff', price: 35, category: 'Snacks', stock: 8, image: '🍖' },
        { name: 'Cupcake', price: 60, category: 'Pastries', stock: 15, image: '🧁' },
        { name: 'Donut', price: 80, category: 'Pastries', stock: 10, image: '🍩' },
        { name: 'Cold Coffee', price: 65, category: 'Drinks', stock: 20, image: '☕' },
    ];

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();
    const { user, businessId } = useAuth();

    // 1. Realtime Sync with Firestore (Only when authenticated)
    useEffect(() => {
        if (!user || !businessId) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = collection(db, 'businesses', businessId, 'inventory_items');
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
            }));

            // Auto-Seed if empty and not loading for the first time
            if (docs.length === 0 && !snapshot.metadata.hasPendingWrites) {
                checkAndSeed(docs);
            } else {
                setItems(docs);
                setLoading(false);
            }
        }, (error) => {
            console.error("Inventory Sync Error:", error);
            // Only show toast if it's NOT a permission error (to avoid spamming guests)
            if (error.code !== 'permission-denied') {
                showToast("Failed to sync inventory", "error");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, businessId]);

    const checkAndSeed = async (currentDocs) => {
        // Double check to prevent loops
        if (currentDocs.length > 0 || !businessId) return;

        try {
            // Explicitly check server state once to be sure
            const q = collection(db, 'businesses', businessId, 'inventory_items');
            const snap = await getDocs(q);
            if (snap.size === 0) {
                console.log("Seeding Database...");
                const batch = writeBatch(db);
                defaultItems.forEach(item => {
                    const docRef = doc(collection(db, 'businesses', businessId, 'inventory_items'));
                    batch.set(docRef, { ...item, businessId });
                });
                await batch.commit();
                showToast("Database safely seeded with default menu", "success");
            }
        } catch (err) {
            console.error("Seeding failed:", err);
        } finally {
            setLoading(false);
        }
    };

    const isOnlyDefaultMenu = (currentItems) => {
        if (!currentItems || currentItems.length === 0) return false;
        const defaultNames = [
            'Veg Puff',
            'Black Forest (1kg)',
            'Chocolate Truffle',
            'Pineapple Cake',
            'Coke (300ml)',
            'Chicken Puff',
            'Cupcake',
            'Donut',
            'Cold Coffee'
        ];
        return currentItems.length <= defaultNames.length && currentItems.every(item => defaultNames.includes(item.name));
    };

    const addItem = async (newItem) => {
        try {
            if (!businessId) throw new Error("No business ID found. Cannot add item.");
            // Remove undefined fields to prevent Firestore crashes
            const cleanItem = JSON.parse(JSON.stringify(newItem));

            if (isOnlyDefaultMenu(items)) {
                console.log("Only default items in menu, clearing them to overwrite with custom item...");
                const batch = writeBatch(db);
                items.forEach(item => {
                    const docRef = doc(db, 'businesses', businessId, 'inventory_items', item.id);
                    batch.delete(docRef);
                });
                const newDocRef = doc(collection(db, 'businesses', businessId, 'inventory_items'));
                batch.set(newDocRef, { ...cleanItem, businessId });
                await batch.commit();
                showToast("Default menu overwritten with your custom item", "success");
            } else {
                await addDoc(collection(db, 'businesses', businessId, 'inventory_items'), { ...cleanItem, businessId });
                showToast("Item added to menu", "success");
            }
        } catch (error) {
            console.error("Error adding item:", error);
            const msg = error.code === 'permission-denied' ? 'Permission Denied: You are not authorized.' : error.message;
            showToast(`Failed: ${msg}`, "error");
        }
    };

    const updateItem = async (id, updates) => {
        try {
            const docRef = doc(db, 'businesses', businessId, 'inventory_items', id);
            await updateDoc(docRef, updates);
            // No toast needed for minor updates usually, or keep it subtle
        } catch (error) {
            console.error("Error updating item:", error);
            showToast("Failed to update item", "error");
        }
    };

    const deleteItem = async (id) => {
        try {
            await deleteDoc(doc(db, 'businesses', businessId, 'inventory_items', id));
            showToast("Item removed from menu", "success");
        } catch (error) {
            console.error("Error deleting item:", error);
            showToast("Failed to delete item", "error");
        }
    };

    const getItemsByCategory = (category) => {
        if (category === 'All') return items;
        return items.filter(i => i.category === category);
    };

    const clearAllItems = async (silent = false) => {
        try {
            if (items.length === 0) return;
            const batch = writeBatch(db);
            items.forEach(item => {
                const docRef = doc(db, 'businesses', businessId, 'inventory_items', item.id);
                batch.delete(docRef);
            });
            await batch.commit();
            if (!silent) {
                showToast("Entire menu deleted successfully.", "success");
            }
        } catch (error) {
            console.error("Error clearing items:", error);
            if (!silent) {
                showToast("Failed to clear menu.", "error");
            }
        }
    };

    return (
        <InventoryContext.Provider value={{ items, addItem, updateItem, deleteItem, getItemsByCategory, clearAllItems, isOnlyDefaultMenu, loading }}>
            {children}
        </InventoryContext.Provider>
    );
};
