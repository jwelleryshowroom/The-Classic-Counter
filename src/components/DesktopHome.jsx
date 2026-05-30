import React, { useMemo, useState, useEffect } from 'react';
import { useTransactions } from '../context/useTransactions';
import { useInventory } from '../context/InventoryContext';
import { useTheme } from '../context/useTheme';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { TrendingUp, TrendingDown, ShoppingBag, Wallet, ArrowRight, Plus, FileBarChart, PieChart, Utensils, IndianRupee, Clock, AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import TransactionForm from './TransactionForm';
import Modal from './Modal';
import Reports from './Reports';
import { triggerHaptic } from '../utils/haptics';
import { useTableSessions } from '../context/useTableSessions';
import { useSettings } from '../context/SettingsContext';
import TableStatusCard from './shared/TableStatusCard';
import ConfirmDialog from './shared/ConfirmDialog';

const DesktopHome = ({ setCurrentView }) => {
    const { transactions, deleteTransaction } = useTransactions();
    const { items: inventoryItems } = useInventory();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const { sessions } = useTableSessions();
    const { waiterTableCount } = useSettings();

    // Helper for Glass Styles
    const glassCardStyle = isDark ? {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)',
        color: 'white'
    } : {
        backgroundColor: 'white',
        border: '1px solid #f4f4f5',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        color: '#27272a'
    };

    const glassTextStyle = isDark ? 'white' : '#27272a';
    const glassSubTextStyle = isDark ? '#a1a1aa' : '#71717a';

    // Helper for Transaction Display (COMPACT for Dashboard)
    const getTransactionTitle = (t) => {
        if (t.type === 'order') {
            const name = t.customer?.name || 'Customer';
            const isBooking = t.status === 'pending' || (t.payment && t.payment.balance > 0);
            return isBooking ? `Booking: ${name}` : `Order: ${name}`;
        }
        if (t.type === 'sale') return 'Quick Sale';
        // Fallback: Use truncated description or Type
        return t.description ? (t.description.length > 25 ? t.description.slice(0, 25) + '...' : t.description) : t.type.toUpperCase();
    };

    // Helper for FULL Description (For Popup)
    const getFullDescription = (t) => {
        if (t.description) return t.description;
        return getTransactionTitle(t);
    };



    // Modals State
    const [showTransactionModal, setShowTransactionModal] = useState(false);
    const [transactionType, setTransactionType] = useState('sale');
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null); // null or { id, title, message }

    // --- AGGREGATE STATS & Recent Activity ---
    const {
        totalSales, todaySales,
        totalExpenses, todayExpenses,
        totalOrders, todayOrders,
        totalProfit, todayProfit,
        pendingOrders,
        recentActivity,
        totalCash, todayCash,
        totalUpi, todayUpi
    } = useMemo(() => {
        const now = new Date();

        let tSales = 0, tExpenses = 0, tOrders = 0, tPending = 0;
        let dSales = 0, dExpenses = 0, dOrders = 0;
        let tCash = 0, dCash = 0;
        let tUpi = 0, dUpi = 0;

        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        const recent = sorted.slice(0, 50);

        transactions.forEach(t => {
            const amount = Number(t.amount);
            const isToday = isSameDay(new Date(t.date), now);

            if (t.type === 'sale' || t.type === 'order' || t.type === 'settlement' || t.type === 'dine_in') {
                // TOTAL
                tSales += amount;
                if (t.type === 'order' || t.type === 'dine_in') {
                    tOrders++;
                    if (t.status === 'pending') tPending++;
                }

                const method = String(t.payment?.method || t.payment?.type || 'cash').toLowerCase();
                if (method === 'upi') {
                    tUpi += amount;
                } else {
                    tCash += amount;
                }

                // TODAY
                if (isToday) {
                    dSales += amount;
                    if (t.type === 'order' || t.type === 'dine_in') dOrders++;

                    if (method === 'upi') {
                        dUpi += amount;
                    } else {
                        dCash += amount;
                    }
                }
            } else if (t.type === 'expense') {
                // TOTAL
                tExpenses += amount;

                // TODAY
                if (isToday) {
                    dExpenses += amount;
                }
            }
        });

        const tProfit = tSales - tExpenses;
        const dProfit = dSales - dExpenses;

        return {
            totalSales: tSales, todaySales: dSales,
            totalExpenses: tExpenses, todayExpenses: dExpenses,
            totalOrders: tOrders, todayOrders: dOrders,
            totalProfit: tProfit, todayProfit: dProfit,
            pendingOrders: tPending,
            recentActivity: recent,
            totalCash: tCash, todayCash: dCash,
            totalUpi: tUpi, todayUpi: dUpi
        };
    }, [transactions]);

    const visibleTables = useMemo(() => {
        let maxSessionTable = 0;
        sessions.forEach(s => {
            if (s.tableId && s.tableId.startsWith('T')) {
                const num = parseInt(s.tableId.replace('T', ''), 10);
                if (!isNaN(num) && num > maxSessionTable) maxSessionTable = num;
            }
        });
        const requiredCount = Math.max(waiterTableCount || 6, maxSessionTable);
        const tables = [];
        for (let i = 1; i <= requiredCount; i++) {
            tables.push(`T${i}`);
        }
        return tables;
    }, [sessions, waiterTableCount]);

    const handleTableClick = (tableId) => {
        const session = sessions.find(s => s.tableId === tableId);
        if (session) {
            navigate('/billing', { state: { mode: 'dine-in', sessionTableId: tableId } });
        } else {
            navigate('/waiter', { state: { selectedTable: tableId } });
        }
    };


    const handleOpenTransactionModal = (type) => {
        setTransactionType(type);
        setShowTransactionModal(true);
    };

    const handleOrderClick = (orderId) => {
        navigate('/orders', { state: { highlightOrderId: orderId } });
    };

    const handleDeleteTransaction = (e, id) => {
        e.stopPropagation();
        setConfirmDialog({
            id,
            title: 'Delete Transaction',
            message: 'Are you sure you want to delete this transaction? This action will permanently remove the record and adjust your sales/expense metrics.'
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', padding: '24px', overflowY: 'auto' }}>

            {/* 1. TOP ROW - STATS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <StatsCard
                    title="Total Sales"
                    value={`₹${totalSales.toLocaleString()}`}
                    subValue={`+ ₹${todaySales.toLocaleString()} Today`}
                    icon={<TrendingUp size={20} color={isDark ? '#4ade80' : "#15803d"} />}
                    bg={isDark ? 'rgba(74, 222, 128, 0.1)' : "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)"}
                    borderColor={isDark ? 'rgba(74, 222, 128, 0.2)' : "#bbf7d0"}
                    textColor={isDark ? '#4ade80' : "#166534"}
                    isDark={isDark}
                />
                <StatsCard
                    title="Total Expense"
                    value={`₹${totalExpenses.toLocaleString()}`}
                    subValue={`+ ₹${todayExpenses.toLocaleString()} Today`}
                    icon={<TrendingDown size={20} color={isDark ? '#f87171' : "#b91c1c"} />}
                    bg={isDark ? 'rgba(248, 113, 113, 0.1)' : "linear-gradient(135deg, #fee2e2 0%, #fef2f2 100%)"}
                    borderColor={isDark ? 'rgba(248, 113, 113, 0.2)' : "#fecaca"}
                    textColor={isDark ? '#f87171' : "#991b1b"}
                    isDark={isDark}
                />
                <StatsCard
                    title="Total Orders"
                    value={`${totalOrders} Orders`}
                    subValue={`${pendingOrders} Pending`}
                    icon={<ShoppingBag size={20} color={isDark ? '#2dd4bf' : "#0f766e"} />}
                    bg={isDark ? 'rgba(45, 212, 191, 0.1)' : "linear-gradient(135deg, #ccfbf1 0%, #f0fdfa 100%)"}
                    borderColor={isDark ? 'rgba(45, 212, 191, 0.2)' : "#99f6e4"}
                    textColor={isDark ? '#2dd4bf' : "#115e59"}
                    isDark={isDark}
                />
                <StatsCard
                    title="Net Profit"
                    value={`₹${totalProfit.toLocaleString()}`}
                    subValue={`+ ₹${todayProfit.toLocaleString()} Today`}
                    icon={<Wallet size={20} color={isDark ? '#fbbf24' : "#854d0e"} />}
                    bg={isDark ? 'rgba(251, 191, 36, 0.1)' : "linear-gradient(135deg, #fefce8 0%, #fffbeb 100%)"}
                    borderColor={isDark ? 'rgba(251, 191, 36, 0.2)' : "#fde047"}
                    textColor={isDark ? '#fbbf24' : "#a16207"}
                    isDark={isDark}
                />
            </div>

            {/* 2. MAIN SECTION - 3 COLUMNS */}
            {/* [FIX] Changed columns to 2fr 1fr 1fr and gap to 16px to match Top Cards exactly */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', flex: 1, minHeight: 0, paddingBottom: '80px' }}>

                {/* COL 1: CASH & UPI BREAKDOWN & LIVE TABLES */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%', overflowY: 'auto', paddingRight: '4px' }} className="hide-scrollbar">

                    {/* A. Cash & UPI Revenue Breakdown */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: glassTextStyle }}>Revenue Breakdown</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <StatsCard
                                title="Cash Received"
                                value={`₹${totalCash.toLocaleString()}`}
                                subValue={`+ ₹${todayCash.toLocaleString()} Today`}
                                icon={<IndianRupee size={16} color={isDark ? '#4ade80' : "#15803d"} />}
                                bg={isDark ? 'rgba(74, 222, 128, 0.08)' : "linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%)"}
                                borderColor={isDark ? 'rgba(74, 222, 128, 0.15)' : "#bbf7d0"}
                                textColor={isDark ? '#4ade80' : "#166534"}
                                isDark={isDark}
                                small
                            />
                            <StatsCard
                                title="UPI Received"
                                value={`₹${totalUpi.toLocaleString()}`}
                                subValue={`+ ₹${todayUpi.toLocaleString()} Today`}
                                icon={<Wallet size={16} color={isDark ? '#60a5fa' : "#1d4ed8"} />}
                                bg={isDark ? 'rgba(96, 165, 250, 0.08)' : "linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)"}
                                borderColor={isDark ? 'rgba(96, 165, 250, 0.15)' : "#bfdbfe"}
                                textColor={isDark ? '#60a5fa' : "#1e40af"}
                                isDark={isDark}
                                small
                            />
                        </div>
                    </div>

                    {/* B. Dedicated Live View of Tables */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: glassTextStyle }}>Live Table View</h3>
                            <div style={{ fontSize: '0.85rem', color: glassSubTextStyle, fontWeight: 500 }}>
                                {sessions.filter(s => s.status && s.status !== 'Available').length} Occupied
                            </div>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                            gap: '16px',
                            flex: 1
                        }}>
                            {visibleTables.map(tableId => {
                                const session = sessions.find(s => s.tableId === tableId) || { tableId, status: 'Available', kots: [] };
                                return (
                                    <TableStatusCard
                                        key={tableId}
                                        session={session}
                                        onClick={() => handleTableClick(tableId)}
                                        isDark={isDark}
                                    />
                                );
                            })}
                        </div>
                    </div>

                </div>

                {/* COL 2: RECENT ACTIVITY (Scrollable, Compact) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '100%', overflow: 'hidden' }}>
                    <div
                        onClick={() => setShowActivityModal(true)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                    >
                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: glassTextStyle }}>Recent Activity</h3>
                        <ArrowRight size={16} color={glassSubTextStyle} />
                    </div>

                    <div style={{
                        ...glassCardStyle,
                        borderRadius: '16px',
                        flex: 1, overflowY: 'auto',
                        padding: '0 8px' // Internal padding for scroll
                    }} className="hide-scrollbar">
                        {recentActivity.map((t, i) => (
                            <div key={t.id || i} style={{
                                display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px',
                                padding: '12px 4px', borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f4f4f5', alignItems: 'center'
                            }}>
                                {/* Info */}
                                <div>
                                    <div style={{ fontSize: '0.9rem', color: glassTextStyle, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                                        {getTransactionTitle(t)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: glassSubTextStyle }}>
                                        {format(new Date(t.date), 'hh:mm a')}
                                    </div>
                                </div>

                                {/* Amount */}
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600, color: t.type === 'expense' ? '#b91c1c' : '#166534', fontSize: '0.9rem' }}>
                                        {t.type === 'expense' ? '-' : '+'}₹{t.amount}
                                    </div>
                                    {/* Show DUE amount if Booking */}
                                    {t.type === 'order' && Number(t.totalValue) > Number(t.amount) && (
                                        <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
                                            Due: ₹{Number(t.totalValue) - Number(t.amount)}
                                        </div>
                                    )}
                                </div>

                                {/* Delete Action */}
                                <div
                                    onClick={(e) => handleDeleteTransaction(e, t.id)}
                                    style={{ cursor: 'pointer', padding: '4px', opacity: 0.4, transition: 'opacity 0.2s' }}
                                    onMouseEnter={(e) => e.target.style.opacity = 1}
                                    onMouseLeave={(e) => e.target.style.opacity = 0.4}
                                >
                                    <Trash2 size={14} color="#ef4444" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* COL 3: QUICK ACTIONS (2x2 Grid, Glass Style, FIXED HEIGHT) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: glassTextStyle }}>Quick Actions</h3>

                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'repeat(2, 1fr)', gap: '16px',
                        flex: 1, maxHeight: '500px' // [UPDATED] Prevent stretching too much
                    }}>
                        {/* Daily Sale */}
                        {/* [FIX] Restored Gradient backgrounds */}
                        <ActionButton
                            onClick={() => { triggerHaptic('medium'); handleOpenTransactionModal('sale'); }}
                            label="New Sale"
                            subLabel=""
                            icon={<div style={{ fontSize: '3rem' }}>🧁</div>}
                            bg={isDark ? 'rgba(236, 252, 203, 0.1)' : "linear-gradient(135deg, #ecfccb 0%, #f7fee7 100%)"}
                            accentColor={isDark ? '#bef264' : "#365314"}
                            border={isDark ? '1px solid rgba(190, 242, 100, 0.2)' : "1px solid #d9f99d"}
                            isCentered
                            isDark={isDark}
                        />
                        {/* Add Expense */}
                        <ActionButton
                            onClick={() => { triggerHaptic('medium'); handleOpenTransactionModal('expense'); }}
                            label="Add Expense"
                            subLabel=""
                            icon={<div style={{ fontSize: '3rem' }}>💸</div>}
                            bg={isDark ? 'rgba(255, 228, 230, 0.1)' : "linear-gradient(135deg, #ffe4e6 0%, #fff1f2 100%)"}
                            accentColor={isDark ? '#fda4af' : "#881337"}
                            border={isDark ? '1px solid rgba(253, 164, 175, 0.2)' : "1px solid #fecaca"}
                            isCentered
                            isDark={isDark}
                        />

                        {/* Reports */}
                        <ActionButton
                            onClick={() => { triggerHaptic('light'); setShowReportsModal(true); }}
                            label="View Reports"
                            subLabel=""
                            icon={<div style={{ fontSize: '3rem' }}>📄</div>}
                            bg={isDark ? 'rgba(224, 242, 254, 0.1)' : "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)"}
                            accentColor={isDark ? '#7dd3fc' : "#0369a1"}
                            border={isDark ? '1px solid rgba(125, 211, 252, 0.2)' : "1px solid #bae6fd"}
                            isCentered
                            isDark={isDark}
                        />

                        {/* Analytics */}
                        <ActionButton
                            onClick={() => { triggerHaptic('light'); setCurrentView('analytics'); }}
                            label="View Analytics"
                            subLabel=""
                            icon={<div style={{ fontSize: '3rem' }}>📊</div>}
                            bg={isDark ? 'rgba(255, 237, 213, 0.1)' : "linear-gradient(135deg, #ffedd5 0%, #fff7ed 100%)"} // Light Orange
                            accentColor={isDark ? '#fdba74' : "#c2410c"}
                            border={isDark ? '1px solid rgba(253, 186, 116, 0.2)' : "1px solid #fed7aa"}
                            isCentered
                            isDark={isDark}
                        />
                    </div>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Quick Action Modal */}
            <Modal
                isOpen={showTransactionModal}
                onClose={() => setShowTransactionModal(false)}
                title={transactionType === 'sale' ? 'Add Daily Sale' : 'Add Expense'}
            >
                <TransactionForm
                    initialType={transactionType}
                    onSuccess={() => setShowTransactionModal(false)}
                />
            </Modal>

            {/* Reports Modal (Centered Popup) */}
            {showReportsModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 60,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        width: '100%', maxWidth: '650px', // [COMPACT] Narrower width
                        height: '750px', // [FIX] Increased height to show more rows
                        maxHeight: '90vh',
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                        overflow: 'visible', // Allow buttons to float outside if needed
                        display: 'flex', flexDirection: 'column', position: 'relative'
                    }}>
                        <Reports isModal={true} onClose={() => setShowReportsModal(false)} />
                    </div>
                </div>
            )}

            {/* Recent Activity Full Modal */}
            <Modal
                isOpen={showActivityModal}
                onClose={() => setShowActivityModal(false)}
                title="Recent Activity"
            >
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {recentActivity.map((t, i) => (
                        <div key={t.id || i} style={{ padding: '16px', borderBottom: '1px solid #f4f4f5', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    {/* FULL DESCRIPTION */}
                                    <div style={{ fontWeight: 600, fontSize: '1rem', color: glassTextStyle, lineHeight: '1.4' }}>
                                        {getFullDescription(t)}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: glassSubTextStyle, marginTop: '4px' }}>
                                        {format(new Date(t.date), 'dd MMM yyyy, hh:mm a')} • #{t.id ? t.id.slice(-6).toUpperCase() : '???'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 700, color: t.type === 'expense' ? '#b91c1c' : '#166534', fontSize: '1.1rem' }}>
                                        {t.type === 'expense' ? '-' : '+'}₹{t.amount}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: glassSubTextStyle }}>
                                        {t.type === 'expense' ? 'Paid' : 'Received'}
                                    </div>
                                </div>
                            </div>

                            {/* EXTRA DETAILS ROW */}
                            {t.type === 'order' && (
                                <div style={{
                                    display: 'flex', gap: '12px', marginTop: '4px', paddingTop: '8px',
                                    borderTop: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed #e4e4e7'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: glassSubTextStyle }}>
                                        Total Value: <span style={{ fontWeight: 600, color: glassTextStyle }}>₹{t.totalValue}</span>
                                    </div>
                                    {Number(t.totalValue) > Number(t.amount) && (
                                        <div style={{ fontSize: '0.85rem', color: '#b45309', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <AlertTriangle size={12} />
                                            Pending: ₹{Number(t.totalValue) - Number(t.amount)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Modal>

            <ConfirmDialog 
                isOpen={!!confirmDialog}
                onClose={() => setConfirmDialog(null)}
                onConfirm={() => {
                    if (confirmDialog?.id) {
                        deleteTransaction(confirmDialog.id);
                    }
                    setConfirmDialog(null);
                }}
                title={confirmDialog?.title || ''}
                message={confirmDialog?.message || ''}
                confirmText="Delete"
                cancelText="Cancel"
                type="danger"
            />

            <style>{`
                .order-card:hover { transform: translateY(-3px); box-shadow: 0 8px 12px -3px rgba(0, 0, 0, 0.05); border-color: #d4d4d8; }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

const StatsCard = ({ title, value, subValue, icon, bg, borderColor, textColor, isDark, small }) => (
    <div style={{
        padding: small ? '16px 20px' : '24px', borderRadius: '16px', background: bg,
        border: `1px solid ${borderColor}`,
        display: 'flex', flexDirection: 'column', gap: small ? '4px' : '8px',
        backdropFilter: isDark ? 'blur(12px)' : 'none',
        boxShadow: isDark ? '0 4px 6px -1px rgba(0, 0, 0, 0.2)' : 'none',
        flex: 1
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: textColor, opacity: 1 }}>
            {icon}
            <span style={{ fontSize: small ? '0.82rem' : '0.9rem', fontWeight: 600 }}>{title}</span>
        </div>
        <div style={{ fontSize: small ? '1.5rem' : '2rem', fontWeight: 800, color: isDark ? 'white' : '#3f3f46' }}>
            {value}
        </div>
        <div style={{ fontSize: '0.82rem', color: textColor, fontWeight: 500 }}>
            {subValue}
        </div>
    </div>
);

const ActionButton = ({ onClick, label, subLabel, icon, bg, accentColor, border = 'none', style = {}, isSmall = false, isCentered = false, isDark }) => (
    <button
        onClick={onClick}
        className="glass-button"
        style={{
            ...style,
            width: '100%', padding: '16px', borderRadius: '24px',
            background: bg, border: border,
            display: 'flex', flexDirection: isCentered ? 'column' : (isSmall ? 'column' : 'row'),
            alignItems: 'center',
            justifyContent: 'center',
            gap: isCentered ? '8px' : (isSmall ? '8px' : '16px'),
            cursor: 'pointer', textAlign: 'center',
            boxShadow: border === 'none' ? '0 4px 6px -1px rgba(0,0,0,0.05)' : 'none',
            transition: 'transform 0.1s, box-shadow 0.2s',
            backdropFilter: 'blur(12px)'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div style={{ flex: isCentered || isSmall ? 0 : 1 }}>
            <div style={{ fontSize: isCentered ? '1rem' : (isSmall ? '0.9rem' : '1.1rem'), fontWeight: 700, color: accentColor }}>{label}</div>
            {!isSmall && !isCentered && <div style={{ fontSize: '0.85rem', color: isDark ? '#a1a1aa' : '#71717a' }}>{subLabel}</div>}
        </div>
        {!isSmall && !isCentered && border === 'none' && (
            <div style={{ backgroundColor: 'rgba(255,255,255,0.6)', padding: '8px', borderRadius: '8px' }}>
                <Plus size={20} color={accentColor} />
            </div>
        )}
    </button>
);

export default DesktopHome;
