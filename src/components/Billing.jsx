import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTransactions } from '../context/useTransactions';
import { useTableSessions } from '../context/useTableSessions';
import { db } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { useCustomers } from '../context/CustomerContext';
import { ChevronRight, ChevronLeft, Trash2, AlertTriangle, Zap, Calendar, Utensils } from 'lucide-react';
import { format } from 'date-fns';
import { useTheme } from '../context/useTheme';

import { toTitleCase, getSmartEmoji } from '../utils/smartHelpers';
import { formatTableName } from './shared/TableStatusCard';
import { triggerHaptic } from '../utils/haptics';

// --- Extracted Cart Component to fix Focus Issues ---
import ProductGrid from './Billing/ProductGrid';
import CartContent from './Billing/CartContent';
import BillingHeader from './Billing/BillingHeader';
import TransactionPreviewModal from './Billing/TransactionPreviewModal';
import AccessDeniedModal from './AccessDeniedModal';
import MiniCartSheet from './Billing/MiniCartSheet';


const Billing = () => {
    const { transactions, addTransaction } = useTransactions();
    const { theme, toggleTheme } = useTheme();
    const { items: allItems, addItem: addInventoryItem, updateItem } = useInventory();
    const { user, role, businessId } = useAuth();
    const { showToast, removeToast } = useToast();
    const { addOrUpdateCustomer, getCustomerByPhone } = useCustomers(); // [NEW] Context
    const { sessions } = useTableSessions();
    const location = useLocation();

    // Mode State: 'quick' | 'order'
    const [mode, setMode] = useState(() => {
        return localStorage.getItem('mode_backup') || 'quick';
    });
    const [handoverMode, setHandoverMode] = useState(() => {
        return localStorage.getItem('handoverMode_backup') || 'later';
    });





    // Items now come from Context!

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSession, setSelectedSession] = useState(null);

    const handleSelectSession = (session) => {
        if (selectedSession?.id === session.id) {
             setSelectedSession(null);
             setCart([]);
             setCustomerDetails({ name: '', phone: '', note: '' });
             return;
        }
        triggerHaptic('light');
        setSelectedSession(session);
        // Flatten KOT items into a single cart
        const sessionItems = (session.kots || []).flatMap(kot => kot.items);
        const groupedMap = new Map();
        sessionItems.forEach(item => {
             if (groupedMap.has(item.id)) {
                 groupedMap.get(item.id).qty += item.qty;
             } else {
                 groupedMap.set(item.id, { ...item });
             }
        });
        setCart(Array.from(groupedMap.values()));
        setCustomerDetails(prev => ({ ...prev, name: formatTableName(session.tableId) }));
    };

    // Quick Add Form State
    const [quickAddName, setQuickAddName] = useState('');
    const [quickAddPrice, setQuickAddPrice] = useState('');
    const [quickAddCategory, setQuickAddCategory] = useState('General');
    const [quickAddStock, setQuickAddStock] = useState('20');
    const [quickAddTrackStock, setQuickAddTrackStock] = useState(true);
    const [quickAddImage, setQuickAddImage] = useState('');
    const [suggestedEmoji, setSuggestedEmoji] = useState('');

    // Sync Quick Add Name with Search & Suggest Emoji
    useEffect(() => {
        if (searchTerm) {
            setQuickAddName(toTitleCase(searchTerm));
        }
    }, [searchTerm]);

    // Update Suggestion when Name/Category changes
    useEffect(() => {
        const emoji = getSmartEmoji(quickAddName, quickAddCategory);
        setSuggestedEmoji(emoji);
    }, [quickAddName, quickAddCategory]);

    const handleQuickAddSubmit = () => {
        triggerHaptic('success');

        // [NEW] SECURITY CHECK: Block Guests
        if (role !== 'admin' && role !== 'staff') {
            setIsAccessDeniedOpen(true);
            return;
        }

        if (!quickAddName || !quickAddPrice) {
            showToast('Name and Price are required', 'error');
            return;
        }
        const newItem = {
            id: Date.now().toString(),
            name: quickAddName,
            price: parseFloat(quickAddPrice),
            category: quickAddCategory,
            stock: quickAddTrackStock ? (parseInt(quickAddStock) || 0) : 0,
            trackStock: quickAddTrackStock,
            image: quickAddImage, // Use selected image
            imageEmoji: suggestedEmoji || '🧁' // Persist emoji or default
        };
        addInventoryItem(newItem);
        addToCart(newItem);
        setSearchTerm('');
        showToast(`Added ${quickAddName}`, 'success');
        // Reset Form
        setQuickAddPrice('');
        setQuickAddStock('20');
        setQuickAddTrackStock(true);
        setQuickAddCategory('General');
        setQuickAddImage('');
        setSuggestedEmoji('');
    };
    const [filterCategory, setFilterCategory] = useState('All');

    // Cart State
    const [cart, setCart] = useState(() => {
        // [NEW] Persist Cart via LocalStorage
        const saved = localStorage.getItem('cart_backup');
        return saved ? JSON.parse(saved) : [];
    });

    // Hydrate Cart from Navigation State (e.g. from Home Quick Sale) or table selection
    useEffect(() => {
        let cleared = false;
        if (location.state?.cart) {
            setCart(location.state.cart);
            cleared = true;
        }
        if (location.state?.mode) {
            setMode(location.state.mode);
            cleared = true;
        }
        if (location.state?.sessionTableId && sessions.length > 0) {
            const sess = sessions.find(s => s.tableId === location.state.sessionTableId);
            if (sess) {
                handleSelectSession(sess);
            }
            cleared = true;
        }
        if (cleared) {
            window.history.replaceState({}, document.title);
        }
    }, [location, sessions]);

    // [NEW] Auto-Save Cart
    useEffect(() => {
        localStorage.setItem('cart_backup', JSON.stringify(cart));
    }, [cart]);

    // Order Mode Specific State
    const [customerDetails, setCustomerDetails] = useState(() => {
        const saved = localStorage.getItem('customerDetails_backup');
        return saved ? JSON.parse(saved) : { name: '', phone: '', note: '' };
    });
    // Default Delivery = Now + 2 Hours
    const [deliveryDetails, setDeliveryDetails] = useState(() => {
        const now = new Date();
        const future = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 Hours
        return {
            date: format(future, 'yyyy-MM-dd'),
            time: format(future, 'HH:mm')
        };
    });
    const [payment, setPayment] = useState(() => {
        const saved = localStorage.getItem('payment_backup');
        return saved ? JSON.parse(saved) : { advance: '', type: 'cash' };
    }); // cash, upi

    // [NEW] Persist Mode & Draft Data (Moved here to avoid ReferenceError)
    useEffect(() => {
        localStorage.setItem('mode_backup', mode);
        localStorage.setItem('handoverMode_backup', handoverMode);
        // Persist Draft Form Data (PII Consideration: Local only, cleared on checkout)
        localStorage.setItem('customerDetails_backup', JSON.stringify(customerDetails));
        localStorage.setItem('payment_backup', JSON.stringify(payment));
    }, [mode, handoverMode, customerDetails, payment]);

    // Receipt Preview State
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null);
    const [showMobileCart, setShowMobileCart] = useState(false);
    const [clearConfirmation, setClearConfirmation] = useState({ show: false }); // [NEW] clear cart modal state
    const [showMobileSearch, setShowMobileSearch] = useState(false); // Mobile Search Toggle
    const [isPrinting, setIsPrinting] = useState(false);
    const [isAccessDeniedOpen, setIsAccessDeniedOpen] = useState(false); // [NEW] Guest Restriction State

    // Safety Lock for Double Clicks (State is async, Ref is sync)
    const processingRef = useRef(false);

    // [NEW] Customer Auto-Complete Logic
    const existingCustomer = useMemo(() => {
        if (!customerDetails.phone || customerDetails.phone.length !== 10) return null;
        return getCustomerByPhone(customerDetails.phone);
    }, [customerDetails.phone, getCustomerByPhone]);

    // Auto-fill Side Effect
    useEffect(() => {
        if (existingCustomer) {
            // Only auto-fill if name is empty to avoid overwriting user input?
            // Or better: Just show the suggestion?
            // Let's being aggressive but safe: Only fill if empty.
            if (!customerDetails.name) {
                setCustomerDetails(prev => ({ ...prev, name: existingCustomer.name }));
                triggerHaptic('success');
            }
        }
    }, [existingCustomer]);

    // Smart Search State
    const [newItemDetails, setNewItemDetails] = useState({ price: '', category: '', stock: '' });

    // --- Popularity Logic ---
    const itemPopularity = useMemo(() => {
        const stats = {};
        transactions.forEach(tx => {
            if ((tx.type === 'sale' || tx.type === 'order') && tx.items) {
                tx.items.forEach(item => {
                    const id = item.id;
                    if (id) stats[id] = (stats[id] || 0) + (Number(item.qty) || 0);
                });
            }
        });
        return stats;
    }, [transactions]);

    // --- Filter Logic ---
    const categories = ['All', 'General', ...new Set(allItems.map(i => i.category).filter(c => c && c.toLowerCase() !== 'all' && c.toLowerCase() !== 'general'))];
    const filteredItems = useMemo(() => {
        return allItems
            .filter(item => {
                const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
                // Grouped Layout: We no longer filter out categories, we show them all!
                return matchesSearch;
            })
            .sort((a, b) => {
                // 1. Popularity (Most Sold First - Irrespective of stock)
                const popularityA = itemPopularity[a.id] || 0;
                const popularityB = itemPopularity[b.id] || 0;

                if (popularityB !== popularityA) {
                    return popularityB - popularityA;
                }

                // 2. Alphabetical (Secondary sort)
                return a.name.localeCompare(b.name);
            });
    }, [allItems, searchTerm, filterCategory]);

    // --- Cart Actions ---
    const addToCart = (item) => {
        triggerHaptic('medium');
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            const emoji = item.imageEmoji || item.emoji || getSmartEmoji(item.name);
            return [...prev, { ...item, emoji, qty: 1 }];
        });
    };

    const updateQty = (itemId, delta) => {
        triggerHaptic('light');
        setCart(prev => prev.map(i => {
            if (i.id === itemId) {
                const newQty = Math.max(0, i.qty + delta);
                return { ...i, qty: newQty };
            }
            return i;
        }).filter(i => i.qty > 0));
    };

    const updateItemNote = (itemId, note) => {
        setCart(prev => prev.map(i => i.id === itemId ? { ...i, note } : i));
    };

    const clearCart = () => setCart([]);

    // --- Calculations ---
    const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    // For 'Take Now', we consider the Advance as the Total Amount (Fully Paid)
    const advanceAmount = (mode === 'order' && handoverMode === 'now')
        ? totalAmount
        : (Number(payment.advance) || 0);
    const balanceDue = totalAmount - advanceAmount;

    // --- Helpers ---
    const createTransactionData = () => {
        if (cart.length === 0) {
            showToast("Cart is empty!", "error");
            return null;
        }

        const isOrder = mode === 'order';
        const isDineIn = mode === 'dine-in';

        // [NEW] Smart Description Logic
        const itemNames = cart.map(i => i.name).join(', ');
        const itemCount = cart.length;
        let description = '';

        if (isDineIn) {
            description = `Dine-In Settlement for ${formatTableName(selectedSession?.tableId || 'Unknown')} (${itemNames})`;
        } else if (!isOrder) {
            // Quick Mode
            description = `Quick Sale of ${itemCount} items (${itemNames})`;
        } else {
            // Order Mode
            const customerName = customerDetails.name || '';
            const isBooking = handoverMode === 'later';

            if (isBooking) {
                // Booking Order (Book Later)
                description = `Booking Order for ${customerName || 'Customer'} (${itemNames})`;
            } else {
                // Take Away (Take Now)
                if (customerName) {
                    description = `Take Away Order for ${customerName} (${itemNames})`;
                } else {
                    description = `Take Away Order ${itemCount} items (${itemNames})`;
                }
            }
        }

        return {
            type: isDineIn ? 'dine_in' : (isOrder ? 'order' : 'sale'),
            amount: isOrder ? advanceAmount : totalAmount, // Cash Basis: Only record what is paid NOW
            totalValue: totalAmount,
            // STRICT CLEANUP: Map items to plain objects to avoid "Invalid nested entity" errors
            items: cart.map(item => ({
                id: item.id,
                name: item.name,
                price: Number(item.price), // Ensure primitive number
                qty: Number(item.qty),
                category: item.category || 'General',
                stock: Number(item.stock || 0)
                // Do NOT spread ...item here to avoid carrying over Firestore metadata/prototypes
            })),
            date: new Date().toISOString(),
            description: description, // [FIXED] Use computed variable
            customer: isOrder ? {
                name: customerDetails.name || 'Walk-in',
                phone: customerDetails.phone || '',
                note: customerDetails.note
            } : null,
            delivery: (isOrder && handoverMode === 'later') ? deliveryDetails : null,
            payment: {
                method: payment.type,
                advance: isOrder ? advanceAmount : 0,
                balance: isOrder ? balanceDue : 0,
                status: isOrder ? (balanceDue <= 0 ? 'paid' : 'partial') : 'paid'
            },
            status: (isOrder && handoverMode === 'later') ? 'pending' : 'completed'
        };
    };

    const resetUI = () => {
        setCart([]);
        localStorage.removeItem('cart_backup'); // Clear backup
        localStorage.removeItem('customerDetails_backup');
        localStorage.removeItem('payment_backup');

        // Clear navigation state to prevent "Cart Reappearance" bug on refresh/re-nav
        window.history.replaceState({}, document.title);

        setCustomerDetails({ name: '', phone: '', note: '' });
        setPayment({ advance: '', type: 'cash' });
        // setMode('quick'); // [CHANGED] Keep previous mode as requested by user
        setHandoverMode('later');
    };

    // --- Actions ---
    // --- Actions ---
    const handleCheckout = async (shouldPrint) => {
        triggerHaptic('success');

        // [NEW] SECURITY CHECK: Block Guests
        if (role !== 'admin' && role !== 'staff') {
            setIsAccessDeniedOpen(true);
            return;
        }

        // Strict Double Check Prevention
        if (processingRef.current) return;

        const data = createTransactionData();
        if (!data) return;

        // Validation: Phone Number (If provided, must be 10 digits)
        if (mode === 'order' && customerDetails.phone && customerDetails.phone.length !== 10) {
            showToast("Please enter a valid 10-digit phone number", "error");
            return;
        }

        // --- OPTIMISTIC UI START ---
        // 1. Lock Immediately
        processingRef.current = true;

        // 2. UI Updates
        setShowMobileCart(false);
        setIsPrinting(true);

        let savingToastId = null;

        // 2. Show Processing Toast Immediately
        if (!shouldPrint) {
            savingToastId = showToast("Saving...", "info");
        }

        try {
            // 3. Save to DB (Background)
            const docRef = await addTransaction(data);

            if (mode === 'dine-in' && selectedSession) {
                if (!businessId) throw new Error("No business ID found. Cannot delete table session.");
                await deleteDoc(doc(db, 'businesses', businessId, 'tableSessions', selectedSession.id));
                setSelectedSession(null);
            }

            // [NEW] Auto-Save Customer
            if (data.customer && mode === 'order') {
                addOrUpdateCustomer(data);
            }

            // --- STOCK MANAGEMENT ---
            data.items.forEach(cartItem => {
                const realItem = allItems.find(i => i.id === cartItem.id);
                // Only subtract stock if tracking is enabled
                if (realItem && realItem.trackStock !== false) {
                    const newStock = Math.max(0, realItem.stock - cartItem.qty);
                    updateItem(cartItem.id, { stock: newStock });
                }
            });

            // [CRITICAL FIX] Reset UI IMMEDIATELY to prevent double-clicks/duplicates
            // We do this BEFORE showing the print modal so the background cart is empty.
            // This disables the "Print & Save" button instantly.
            resetUI();

            // 4. Success Handling
            // [NEW] Remove "Saving..." toast immediately
            if (savingToastId) removeToast(savingToastId);

            if (shouldPrint) {
                // Enhance preview data with real ID if we got one and want to show it
                const finalData = docRef ? { ...data, id: docRef.id } : data;

                setPreviewData(finalData);
                setShowPreview(true);

                // Auto-trigger print after delay
                setTimeout(() => {
                    window.print();
                    setIsPrinting(false);
                    processingRef.current = false; // Release Lock
                }, 800);

                showToast(mode === 'order' ? "Order Saved & Printing..." : "Sale Saved & Printing...", "success");
            } else {
                showToast(mode === 'order' ? "Order Saved!" : "Sale Completed!", "success");
                setIsPrinting(false);
                processingRef.current = false; // Release Lock
            }

        } catch (error) {
            console.error("Checkout Error:", error);
            if (savingToastId) removeToast(savingToastId); // Dismiss saving toast on error too
            setIsPrinting(false);
            processingRef.current = false; // Release Lock
        }
    };





    // --- RENDER ---
    // --- DETECT MOBILE ---
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);


    // --- RENDER ---
    // [REMOVED] Security Lock - allowing guests to explore POS
    // if (user && role !== 'admin' && role !== 'staff') { ... }

    return (
        <div style={{ height: '100dvh', background: 'transparent', color: 'var(--color-text-primary)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* 1. THE HEADER */}
            {/* 1. THE HEADER */}
            <BillingHeader
                isMobile={isMobile}
                showMobileSearch={showMobileSearch}
                setShowMobileSearch={setShowMobileSearch}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                mode={mode}
                setMode={setMode}
            />



            {/* MAIN CONTENT SPLIT */}
            <div className="layout-container" style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
                    {/* [NEW] MOBILE MODE SWITCHER */}
                    {isMobile && (
                        <div style={{ padding: '8px 16px', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', padding: '3px', borderRadius: '8px', width: '100%', maxWidth: '320px', border: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={() => { triggerHaptic('light'); setMode('quick'); }}
                                    style={{
                                        flex: 1, border: 'none', borderRadius: '6px', padding: '6px 8px',
                                        background: mode === 'quick' ? '#4CAF50' : 'transparent',
                                        color: mode === 'quick' ? 'white' : 'var(--color-text-muted)',
                                        fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                    }}
                                >
                                    ⚡ Quick
                                </button>
                                <button
                                    onClick={() => { triggerHaptic('light'); setMode('order'); }}
                                    style={{
                                        flex: 1, border: 'none', borderRadius: '6px', padding: '6px 8px',
                                        background: mode === 'order' ? '#FF9800' : 'transparent',
                                        color: mode === 'order' ? 'black' : 'var(--color-text-muted)',
                                        fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                    }}
                                >
                                    🧾 Order
                                </button>
                                <button
                                    onClick={() => { triggerHaptic('light'); setMode('dine-in'); }}
                                    style={{
                                        flex: 1, border: 'none', borderRadius: '6px', padding: '6px 8px',
                                        background: mode === 'dine-in' ? '#E91E63' : 'transparent',
                                        color: mode === 'dine-in' ? 'white' : 'var(--color-text-muted)',
                                        fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                                    }}
                                >
                                    🍽️ Dine In
                                </button>
                            </div>
                        </div>
                    )}

                    {/* [NEW] DINE-IN TABLE BAR (Moved inside left column) */}
                    {mode === 'dine-in' && (
                        <div style={{ padding: '12px 16px', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '12px', overflowX: 'auto', alignItems: 'center' }} className="no-scrollbar">
                            <div style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginRight: '8px' }}>Active Tables</div>
                            {sessions.filter(s => s.status !== 'Available').length === 0 ? (
                                <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>No active tables</div>
                            ) : (
                                sessions.filter(s => s.status !== 'Available').map(session => (
                                    <button
                                        key={session.id}
                                        onClick={() => handleSelectSession(session)}
                                        style={{
                                            padding: '8px 20px', borderRadius: '12px',
                                            border: `1px solid ${selectedSession?.id === session.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                            background: selectedSession?.id === session.id ? 'var(--color-bg-glass-input)' : 'var(--color-bg-surface)',
                                            color: selectedSession?.id === session.id ? 'var(--color-primary)' : 'var(--color-text-primary)',
                                            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                                            minWidth: 'fit-content',
                                            boxShadow: selectedSession?.id === session.id ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                            transform: selectedSession?.id === session.id ? 'scale(1.02)' : 'scale(1)',
                                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                    >
                                        <div style={{ 
                                            width: '8px', height: '8px', borderRadius: '50%', 
                                            background: session.status === 'Billing Requested' ? 'var(--color-danger)' : 'var(--color-warning)',
                                            boxShadow: session.status === 'Billing Requested' ? '0 0 8px var(--color-danger)' : 'none'
                                        }} />
                                        <span style={{ fontWeight: selectedSession?.id === session.id ? 800 : 600, fontSize: '0.95rem' }}>{formatTableName(session.tableId)}</span>
                                        {session.status === 'Billing Requested' && <span style={{ fontSize: '0.7rem', background: 'var(--color-danger)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Bill Req</span>}
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    {/* 2. LEFT SIDE: PRODUCT GRID */}
                    <ProductGrid
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        categories={categories}
                        filterCategory={filterCategory}
                        setFilterCategory={setFilterCategory}
                        filteredItems={filteredItems}
                        cart={cart}
                        addToCart={addToCart}
                        updateQty={updateQty}
                        isMobile={isMobile}
                        setShowMobileSearch={setShowMobileSearch}
                        // Quick Add Props
                        quickAddName={quickAddName}
                        setQuickAddName={setQuickAddName}
                        quickAddPrice={quickAddPrice}
                        setQuickAddPrice={setQuickAddPrice}
                        quickAddCategory={quickAddCategory}
                        setQuickAddCategory={setQuickAddCategory}
                        quickAddStock={quickAddStock}
                        setQuickAddStock={setQuickAddStock}
                        quickAddTrackStock={quickAddTrackStock}
                        setQuickAddTrackStock={setQuickAddTrackStock}
                        quickAddImage={quickAddImage}
                        setQuickAddImage={setQuickAddImage}
                        suggestedEmoji={suggestedEmoji}
                        handleQuickAddSubmit={handleQuickAddSubmit}
                    />
                </div>

                {/* 3. RIGHT SIDE: CART (Desktop Only) */}
                {!isMobile && (
                    <div className="cart-pane" style={{
                        flex: '0 0 34%', // Restored wider size
                        minWidth: '400px',
                        background: 'var(--color-bg-surface)',
                        borderRadius: '24px',
                        marginLeft: '0',
                        display: 'flex', flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        height: 'calc(100vh - 100px)',
                        // [REQUEST] MAKE THE CART PANE MARGING FROM TOP 12px
                        margin: '12px 16px 16px 0',
                        // [REQUEST] Pop effect (shadow)
                        boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
                        border: '1px solid var(--color-border)'
                    }}>
                        <CartContent
                            isMobile={false}
                            mode={mode}
                            setMode={setMode}
                            cart={cart}
                            totalAmount={totalAmount}
                            payment={payment}
                            setPayment={setPayment}
                            customerDetails={customerDetails}
                            setCustomerDetails={setCustomerDetails}
                            handoverMode={handoverMode}
                            setHandoverMode={setHandoverMode}
                            deliveryDetails={deliveryDetails}
                            setDeliveryDetails={setDeliveryDetails}
                            updateQty={updateQty}
                            handleCheckout={handleCheckout}
                            balanceDue={balanceDue}
                            isPrinting={isPrinting}
                            clearCart={clearCart}
                            existingCustomer={existingCustomer}
                        />
                    </div>
                )}

                {/* NEW MINI CART SHEET (Mobile Only) */}
                {isMobile && (
                    <MiniCartSheet
                        cart={cart}
                        onViewCart={() => setShowMobileCart(true)}
                        savings={0} // Logic for savings can be added later
                        updateQty={updateQty}
                    />
                )}
            </div>

            {/* MOBILE CART MODAL - FULL SCREEN */}
            {
                showMobileCart && (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 20000,
                        background: 'var(--color-bg-surface)',
                        display: 'flex', flexDirection: 'column',
                        animation: 'slideUp 0.3s ease-out'
                    }}>
                        {/* CUSTOM MOBILE HEADER with Back Button */}
                        <div style={{
                            padding: '12px 16px',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            borderBottom: '1px solid var(--color-border)',
                            background: 'var(--color-bg-surface)'
                        }}>
                            <button
                                onClick={() => setShowMobileCart(false)}
                                style={{
                                    background: 'transparent', border: 'none',
                                    color: 'var(--color-text-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    padding: '4px'
                                }}
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>Your Cart ({cart.length})</div>

                            {cart.length > 0 && (
                                <button
                                    onClick={() => {
                                        triggerHaptic('medium');
                                        setClearConfirmation({ show: true });
                                    }}
                                    style={{
                                        background: 'rgba(255, 0, 0, 0.1)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '6px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer',
                                        marginLeft: '4px'
                                    }}
                                >
                                    <Trash2 size={18} color="var(--color-danger)" />
                                </button>
                            )}

                            {/* [NEW] Mobile Mode Toggle */}
                            <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', borderRadius: '8px', padding: '3px', marginLeft: '12px', border: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={() => { triggerHaptic('light'); setMode('quick'); }}
                                    style={{
                                        border: 'none', borderRadius: '6px', padding: '8px 10px',
                                        background: mode === 'quick' ? 'var(--color-bg-surface)' : 'transparent',
                                        color: mode === 'quick' ? '#4CAF50' : 'var(--color-text-muted)',
                                        boxShadow: mode === 'quick' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                                    }}
                                >
                                    <Zap size={18} />
                                </button>
                                <button
                                    onClick={() => { triggerHaptic('light'); setMode('order'); }}
                                    style={{
                                        border: 'none', borderRadius: '6px', padding: '8px 10px',
                                        background: mode === 'order' ? 'var(--color-bg-surface)' : 'transparent',
                                        color: mode === 'order' ? '#FF9800' : 'var(--color-text-muted)',
                                        boxShadow: mode === 'order' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                                    }}
                                >
                                    <Calendar size={18} />
                                </button>
                                <button
                                    onClick={() => { triggerHaptic('light'); setMode('dine-in'); }}
                                    style={{
                                        border: 'none', borderRadius: '6px', padding: '8px 10px',
                                        background: mode === 'dine-in' ? 'var(--color-bg-surface)' : 'transparent',
                                        color: mode === 'dine-in' ? '#E91E63' : 'var(--color-text-muted)',
                                        boxShadow: mode === 'dine-in' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer'
                                    }}
                                >
                                    <Utensils size={18} />
                                </button>
                            </div>

                            <div style={{ marginLeft: 'auto', fontWeight: 700, color: 'var(--color-primary)' }}>₹{totalAmount}</div>
                        </div>

                        {/* Cart Content Container */}
                        <div style={{ flex: 1, overflowY: 'auto', background: 'var(--color-bg-surface)' }}>
                            <CartContent
                                isMobile={true}
                                mode={mode}
                                cart={cart}
                                totalAmount={totalAmount}
                                payment={payment}
                                setPayment={setPayment}
                                customerDetails={customerDetails}
                                setCustomerDetails={setCustomerDetails}
                                handoverMode={handoverMode}
                                setHandoverMode={setHandoverMode}
                                deliveryDetails={deliveryDetails}
                                setDeliveryDetails={setDeliveryDetails}
                                updateQty={updateQty}
                                handleCheckout={handleCheckout}
                                balanceDue={balanceDue}
                                isPrinting={isPrinting}
                            />
                        </div>
                    </div>
                )
            }

            {/* Receipt Preview Modal */}
            <TransactionPreviewModal
                isOpen={showPreview && previewData}
                onClose={() => setShowPreview(false)}
                data={previewData}
            />

            {/* [NEW] Access Denied Modal */}
            <AccessDeniedModal
                isOpen={isAccessDeniedOpen}
                onClose={() => setIsAccessDeniedOpen(false)}
            />



            <style>{`
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #333; borderRadius: 3px; }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                
                input[type="date"], input[type="time"] {
                    color-scheme: light dark;
                }

                input[type="date"], input[type="time"] {
                    color-scheme: light dark;
                }

                /* GLOBAL UTILITIES for Billing.jsx */
                .swiggy-btn { border-radius: 6px !important; }

                /* Hide Spinners */
                .no-spinner::-webkit-inner-spin-button, 
                .no-spinner::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                }
                .no-spinner { 
                    -moz-appearance: textfield; 
                }

                /* DESKTOP DEFAULT LAYOUT */
                .layout-container { display: flex; }
                .menu-pane { flex: 65%; }
                .cart-pane { flex: 35%; display: flex; flex-direction: column; }
                .mobile-cart-bar { display: none; }
                .mobile-only { display: none; }
                
                /* ANIMATION */
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
                .slide-up-enter { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }

                /* MOBILE RESPONSIVE OVERRIDES */
                @media (max-width: 768px) {
                    .layout-container { flex-direction: column; }
                    .menu-pane { flex: 1; border-right: none; }
                    .cart-pane { display: none; } /* Hide Sidebar Cart */
                    
                    /* Adjust Main Padding for Mobile */
                    .menu-pane > div:last-child { padding: 6px 4px !important; padding-bottom: 100px !important; }

                    /* Compact Grid for Mobile - 2 Items Row */
                    .product-grid { 
                        grid-template-columns: repeat(2, 1fr) !important; 
                        gap: 8px !important; 
                    }
                    /* Compact Card Styling for Mobile */
                    .item-card {
                        padding: 0 !important;
                        min-height: 155px !important;
                        height: auto !important;
                        min-width: 0 !important;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.03) !important;
                        overflow: hidden !important;
                    }


                    .header h2 { font-size: 1rem; }
                    
                    /* Hide Text Labels on Mobile Header if needed */
                    .hide-mobile { display: none; }

                    /* Floating Swiggy Bar - ABOVE DOCK */
                    .mobile-cart-bar {
                        display: flex;
                        position: fixed;
                        bottom: 90px;
                        left: 12px; 
                        right: 12px;
                        background: #60b246;
                        color: white;
                        padding: 10px 16px;
                        border-radius: 12px;
                        justify-content: space-between;
                        align-items: center;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        z-index: 10000;
                        cursor: pointer;
                        animation: slideUp 0.3s ease-out;
                    }
                    .mobile-cart-bar:active { transform: scale(0.98); }

                    /* NEW MOBILE HEADER ELEMENTS */
                    .mobile-only { display: flex !important; }
                    .search-container-desktop { display: none !important; } /* Hide old search on mobile */
                    
                    /* Sticky Filters on Mobile */
                    .filter-bar {
                        padding: 8px 12px !important;
                        position: sticky !important;
                        top: 0;
                    }
                        top: 0;
                    }
                }
            `}</style>
            {/* Clear Cart Confirmation Modal */}
            <AnimatePresence>
                {
                    clearConfirmation.show && (
                        <div style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 20000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <motion.div
                                className="glass"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                style={{
                                    width: '85%', maxWidth: '320px', padding: '24px',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                                    textAlign: 'center',
                                    background: 'var(--color-bg-surface)' // Use theme surface
                                }}
                            >
                                <div style={{ color: 'var(--color-danger)', marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                                    <AlertTriangle size={48} />
                                </div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700, color: 'var(--color-text-main)' }}>Clear Cart?</h3>
                                <p style={{ color: 'var(--color-text-main)', marginBottom: '24px', lineHeight: 1.5, fontSize: '0.95rem', fontWeight: 500, opacity: 0.9 }}>
                                    Are you sure you want to remove all items from the cart?
                                </p>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => setClearConfirmation({ show: false })}
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            backgroundColor: 'rgba(0,0,0,0.05)',
                                            color: 'var(--color-text-main)',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            triggerHaptic('success');
                                            clearCart();
                                            setClearConfirmation({ show: false });
                                        }}
                                        className="btn"
                                        style={{
                                            flex: 1,
                                            backgroundColor: 'var(--color-danger)',
                                            color: 'white',
                                            borderRadius: '12px',
                                            padding: '12px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                        }}
                                    >
                                        Clear Cart
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence>

        </div >
    );
};

export default Billing;
