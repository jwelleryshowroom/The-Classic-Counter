import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTableSessions } from '../../context/useTableSessions';
import { useInventory } from '../../context/InventoryContext';
import { triggerHaptic } from '../../utils/haptics';
import { useSettings } from '../../context/SettingsContext';
import TableBar from './components/TableBar';
import WaiterMenu from './components/WaiterMenu';
import WaiterCart from './components/WaiterCart';
import TableSelectionScreen from './components/TableSelectionScreen';
import ProfileMenu from '../../components/ProfileMenu';

export default function WaiterLayout() {
    const { sessions, createSession, updateSessionStatus, addKOT } = useTableSessions();
    const { items: allItems } = useInventory();
    const { waiterTableCount, isMobile, navVisible } = useSettings();
    const [selectedTable, setSelectedTable] = useState(null);
    const [cart, setCart] = useState([]);
    const [highestAdded, setHighestAdded] = useState(waiterTableCount);
    const [isCartModalOpen, setIsCartModalOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        setHighestAdded(waiterTableCount);
    }, [waiterTableCount]);

    useEffect(() => {
        if (location.state?.selectedTable) {
            setSelectedTable(location.state.selectedTable);
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const activeTables = useMemo(() => sessions.map(s => s.tableId), [sessions]);

    const visibleTables = useMemo(() => {
        let maxSessionTable = 0;
        activeTables.forEach(t => {
            if (t.startsWith('T')) {
                const num = parseInt(t.replace('T', ''), 10);
                if (!isNaN(num) && num > maxSessionTable) maxSessionTable = num;
            }
        });

        const requiredCount = Math.max(waiterTableCount, highestAdded, maxSessionTable);
        const tables = [];
        for (let i = 1; i <= requiredCount; i++) {
            tables.push(`T${i}`);
        }
        if (selectedTable && !tables.includes(selectedTable)) {
            tables.push(selectedTable);
        }
        return tables;
    }, [activeTables, highestAdded, selectedTable, waiterTableCount]);

    // Active session for selected table
    const activeSession = useMemo(() => {
        if (!selectedTable) return null;
        return sessions.find(s => s.tableId === selectedTable);
    }, [selectedTable, sessions]);

    const handleTableSelect = async (tableId) => {
        triggerHaptic('light');
        setSelectedTable(tableId);
        // Clear active cart when switching tables
        setCart([]);
    };

    const handleAddTable = () => {
        triggerHaptic('light');
        const nextTableNum = Math.max(highestAdded, ...activeTables.filter(t => t.startsWith('T')).map(t => parseInt(t.replace('T', ''), 10) || 0)) + 1;
        setHighestAdded(nextTableNum);
        handleTableSelect(`T${nextTableNum}`);
    };

    const handleAddToCart = (item) => {
        triggerHaptic('light');
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
            }
            return [...prev, { ...item, qty: 1 }];
        });
    };

    const handleUpdateQty = (itemId, delta) => {
        triggerHaptic('light');
        setCart(prev => prev.map(i => {
            if (i.id === itemId) {
                return { ...i, qty: Math.max(0, i.qty + delta) };
            }
            return i;
        }).filter(i => i.qty > 0));
    };

    const handleSendToKitchen = async () => {
        if (cart.length === 0 || !selectedTable) return;
        triggerHaptic('success');
        
        let sessionId = activeSession?.id;
        
        if (!sessionId) {
            sessionId = await createSession(selectedTable);
        }

        await addKOT(sessionId, cart);
        setCart([]);
    };

    const handleRequestBill = async () => {
        if (activeSession) {
            await updateSessionStatus(activeSession.id, 'Billing Requested');
            triggerHaptic('medium');
        }
    };

    // Calculate totals for mobile view
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const kots = activeSession?.kots || [];
    const kotTotal = kots.reduce((sum, kot) => {
        return sum + kot.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    }, 0);
    const grandTotal = cartTotal + kotTotal;
    const cartQty = cart.reduce((sum, item) => sum + item.qty, 0);
    const totalQty = cartQty + kots.reduce((sum, kot) => sum + kot.items.reduce((acc, item) => acc + item.qty, 0), 0);

    return (
        <div style={{ display: 'flex', height: '100%', background: 'var(--color-bg-base)', overflow: 'hidden', position: 'relative' }}>
            {/* Left Side: Table Bar + Menu */}
            <div style={{ flex: 1, minWidth: 0, borderRight: isMobile ? 'none' : '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <TableBar 
                            sessions={sessions} 
                            selectedTable={selectedTable} 
                            onSelectTable={handleTableSelect} 
                            tables={visibleTables}
                            onAddTable={handleAddTable}
                        />
                    </div>
                    {isMobile && (
                        <div style={{ padding: '0 12px 0 0', flexShrink: 0 }}>
                            <ProfileMenu />
                        </div>
                    )}
                </div>
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    {!selectedTable ? (
                        <TableSelectionScreen 
                            tables={visibleTables} 
                            sessions={sessions} 
                            onSelectTable={handleTableSelect} 
                            onAddTable={handleAddTable} 
                        />
                    ) : (
                        <WaiterMenu 
                            items={allItems} 
                            cart={cart}
                            onAddToCart={handleAddToCart}
                            onUpdateQty={handleUpdateQty}
                            disabled={false}
                        />
                    )}
                </div>
            </div>

            {/* Desktop-only Right Side: Cart */}
            {!isMobile && (
                <div style={{ width: '380px', display: 'flex', flexDirection: 'column', background: 'var(--color-bg-base)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                        <ProfileMenu />
                    </div>
                    <div style={{ flex: 1, background: 'var(--color-bg-surface)', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <WaiterCart 
                            cart={cart}
                            onUpdateQty={handleUpdateQty}
                            onSend={handleSendToKitchen}
                            selectedTable={selectedTable}
                            activeSession={activeSession}
                            onRequestBill={handleRequestBill}
                        />
                    </div>
                </div>
            )}

            {/* Mobile-only Sticky Bottom Bar */}
            {isMobile && selectedTable && totalQty > 0 && (
                <div 
                    onClick={() => { triggerHaptic('medium'); setIsCartModalOpen(true); }}
                    style={{
                        position: 'fixed',
                        bottom: navVisible ? '80px' : '16px',
                        left: '16px',
                        right: '16px',
                        height: '56px',
                        background: 'var(--color-primary)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 16px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        color: 'white',
                        cursor: 'pointer',
                        zIndex: 1000,
                        transition: 'all 0.2s ease'
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                            {totalQty} {totalQty === 1 ? 'Item' : 'Items'} | ₹{grandTotal}
                        </div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.9 }}>
                            {cartQty > 0 ? `${cartQty} new to send` : 'View ordered items'}
                        </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        View Order ➔
                    </div>
                </div>
            )}

            {/* Mobile-only Full-screen Cart Modal */}
            {isMobile && isCartModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 20000,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                }} onClick={() => setIsCartModalOpen(false)}>
                    <style>{`
                        @keyframes slideUp {
                            from { transform: translateY(100%); }
                            to { transform: translateY(0); }
                        }
                    `}</style>
                    <div style={{
                        background: 'var(--color-bg-base)',
                        width: '100%',
                        height: '85%',
                        borderTopLeftRadius: '24px',
                        borderTopRightRadius: '24px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <WaiterCart 
                                cart={cart}
                                onUpdateQty={handleUpdateQty}
                                onSend={async () => {
                                    await handleSendToKitchen();
                                    setIsCartModalOpen(false);
                                }}
                                selectedTable={selectedTable}
                                activeSession={activeSession}
                                onRequestBill={handleRequestBill}
                                onClose={() => setIsCartModalOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
