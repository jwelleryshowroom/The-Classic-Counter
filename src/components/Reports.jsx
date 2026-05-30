import React, { useMemo, useState } from 'react';
import { useTransactions } from '../context/useTransactions';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval, format, isSameDay } from 'date-fns';
import { useTheme } from '../context/useTheme';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, BarChart2, Calendar as CalendarIcon, Inbox, PieChart as PieChartIcon, ShoppingBag } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import ExportModal from './ExportModal';
import { triggerHaptic } from '../utils/haptics';

// Override some calendar styles
const calendarStyles = `
  .react-calendar {
    width: 100%;
    background: var(--color-bg-surface);
    border: none;
    border-radius: var(--radius-md);
    font-family: 'Outfit', sans-serif;
    line-height: 1.125em;
    padding: 16px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 24px;
  }
  .react-calendar__navigation {
    display: flex;
    margin-bottom: 1em;
  }
  .react-calendar__navigation button {
    min-width: 44px;
    background: transparent !important;
    font-size: 1.1rem;
    font-weight: 700;
    margin-top: 8px;
    color: var(--color-primary);
    border-radius: var(--radius-sm);
    transition: all 0.2s;
  }
  .react-calendar__navigation button:disabled {
    background-color: transparent !important;
    opacity: 0.3;
  }
  .react-calendar__navigation button:enabled:hover,
  .react-calendar__navigation button:enabled:focus {
    background-color: var(--color-bg-body) !important;
  }
  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-weight: bold;
    font-size: 0.75em;
    color: var(--color-text-muted);
    margin-bottom: 8px;
    text-decoration: none;
  }
  .react-calendar__month-view__weekdays__weekday {
    padding: 0.5em;
  }
  .react-calendar__month-view__weekdays__weekday abbr {
    text-decoration: none;
    border-bottom: 2px solid transparent;
    padding-bottom: 2px;
  }
  .react-calendar__month-view__weekdays__weekday:hover abbr {
    border-bottom-color: var(--color-primary);
  }
  .react-calendar__month-view__weekNumbers .react-calendar__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
    font-weight: bold;
  }
  .react-calendar__tile {
    max-width: 100%;
    padding: 12px 6px;
    background: none;
    text-align: center;
    line-height: 16px;
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--color-text-main);
    border-radius: 12px; /* Rounded corners */
    transition: all 0.2s;
    position: relative;
  }
  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: var(--color-bg-body);
    color: var(--color-primary);
  }
  .react-calendar__tile--now {
    background: transparent;
    color: var(--color-primary);
    font-weight: bold;
    border: 1px solid var(--color-primary);
  }
  .react-calendar__tile--now:enabled:hover,
  .react-calendar__tile--now:enabled:focus {
    background: var(--color-primary-light);
    color: white;
  }
  .react-calendar__tile--hasActive {
    background: var(--color-primary-light);
  }
  .react-calendar__tile--active {
    background: var(--color-primary) !important;
    color: white !important;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.4);
  }
  .react-calendar__tile--active:enabled:hover,
  .react-calendar__tile--active:enabled:focus {
    background: var(--color-primary-dark);
  }
  .react-calendar__tile:disabled {
    background-color: transparent !important;
    color: var(--color-text-muted) !important;
    opacity: 0.4;
  }
  .react-calendar__month-view__days__day--neighboringMonth {
    color: var(--color-text-muted) !important;
    opacity: 0.5;
  }
  /* Indicator for data */
  .tile-dot {
      height: 4px;
      width: 4px;
      background-color: var(--color-danger);
      border-radius: 50%;
      position: absolute;
      bottom: 6px;
      left: 50%;
      transform: translateX(-50%);
  }
`;

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                boxShadow: 'var(--shadow-md)',
                fontSize: '0.85rem'
            }}>
                <p style={{ margin: '0 0 4px', fontWeight: 'bold', color: 'var(--color-text-main)' }}>{label}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ color: 'var(--color-success)' }}>Sales & Orders: ₹{payload[0].value}</span>
                    <span style={{ color: 'var(--color-danger)' }}>Expense: ₹{payload[1].value}</span>
                </div>
            </div>
        );
    }
    return null;
};

const EmptyState = ({ isDark }) => (
    <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        color: isDark ? '#a1a1aa' : 'var(--color-text-muted)',
        height: '100%',
        textAlign: 'center'
    }}>
        <div style={{
            width: '80px',
            height: '80px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'var(--color-bg-body)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
        }}>
            <Inbox size={40} color={isDark ? '#a1a1aa' : "var(--color-primary)"} strokeWidth={1.5} />
        </div>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: isDark ? 'white' : 'var(--color-text-main)' }}>No Transactions Found</h3>
        <p style={{ fontSize: '0.9rem', maxWidth: '250px', color: isDark ? '#71717a' : 'inherit' }}>
            It looks like there's no activity for this period. Try selecting a different date.
        </p>
    </div>
);

const Reports = ({ setCurrentView, isModal, onClose }) => {
    const { transactions, loading, setViewDateRange, currentRange } = useTransactions();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [view, setView] = useState('weekly'); // [FIX] Default to weekly
    const [viewType, setViewType] = useState('transactions'); // 'transactions' | 'items'
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);

    const reportData = useMemo(() => {
        const now = new Date();
        let start, end;

        if (view === 'daily') {
            return transactions.filter(t => isSameDay(new Date(t.date), selectedDate));
        }

        if (view === 'weekly') {
            start = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
            end = endOfWeek(now, { weekStartsOn: 1 });
        } else {
            start = startOfMonth(now);
            end = endOfMonth(now);
        }

        return transactions.filter(t =>
            isWithinInterval(new Date(t.date), { start, end })
        ).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [transactions, view, selectedDate]);

    // Aggregate Item Sales Data
    const itemSalesData = useMemo(() => {
        const items = {};
        reportData.forEach(tx => {
            if (tx.type === 'sale' || tx.type === 'order' || tx.type === 'dine_in') {
                if (tx.items && Array.isArray(tx.items)) {
                    tx.items.forEach(item => {
                        const id = item.id || item.name; // Fallback
                        if (!items[id]) {
                            items[id] = {
                                id,
                                name: item.name,
                                category: item.category || 'General',
                                qty: 0,
                                total: 0
                            };
                        }
                        items[id].qty += Number(item.qty || 0);
                        // Calculate total based on item price * qty (safest) or proportional split
                        items[id].total += (Number(item.price || 0) * Number(item.qty || 0));
                    });
                }
            }
        });
        return Object.values(items).sort((a, b) => b.total - a.total);
    }, [reportData]);


    // Helper to check for transaction on a specific date for calendar tile
    const hasTransaction = (date) => {
        return transactions.some(t => isSameDay(new Date(t.date), date));
    };

    const handleDateChange = (date) => {
        triggerHaptic('light');
        setSelectedDate(date);
        setView('daily');
        setShowCalendar(false); // Close calendar after selection
    };


    // Effect to Sync Context with View
    React.useEffect(() => {
        const now = selectedDate; // Use selected date as anchor
        let start, end;

        if (view === 'daily') {
            // For daily view, we might want to load the whole month to make calendar navigation smooth, 
            // or just the day. Let's load the MONTH of the selected date so the calendar dots work.
            start = startOfMonth(now);
            end = endOfMonth(now);
        } else if (view === 'weekly') {
            start = startOfWeek(now, { weekStartsOn: 1 });
            end = endOfWeek(now, { weekStartsOn: 1 });
        } else {
            // Monthly
            start = startOfMonth(now);
            end = endOfMonth(now);
        }

        // Only update if range is different (Simple check using ISO string)
        if (start.toISOString() !== currentRange.start.toISOString() || end.toISOString() !== currentRange.end.toISOString()) {
            setViewDateRange(start, end);
        }
    }, [view, selectedDate, setViewDateRange, currentRange.start, currentRange.end]);

    const toggleView = (newView) => {
        triggerHaptic('light');
        if (newView === 'daily') {
            setShowCalendar(!showCalendar);
            if (view !== 'daily') setView('daily');
        } else {
            setView(newView);
            setShowCalendar(false);
        }
    };

    const getTitle = () => {
        const now = new Date();
        if (view === 'weekly') {
            const start = startOfWeek(now, { weekStartsOn: 1 });
            const end = endOfWeek(now, { weekStartsOn: 1 });
            return `This Week (${format(start, 'dd MMM')} - ${format(end, 'dd MMM')})`;
        }
        if (view === 'monthly') {
            return `This Month (${format(now, 'MMM yyyy')})`;
        }
        return `Daily Report (${format(selectedDate, 'dd MMM yyyy')})`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: '16px' }}>
            <style>{`
                ${calendarStyles}
                
                /* [FIX] seamless calendar override */
                .react-calendar {
                    background: transparent !important;
                    box-shadow: none !important;
                    border: none !important;
                    color: ${isDark ? '#fed7aa' : 'inherit'} !important; /* [FIX] Warmer text for chocolate theme */
                }
                .react-calendar__navigation button {
                    color: ${isDark ? '#fed7aa' : '#18181b'} !important;
                }
                .react-calendar__month-view__days__day {
                    color: ${isDark ? '#fdba74' : '#18181b'};
                }
                .react-calendar__month-view__days__day--neighboringMonth {
                    color: ${isDark ? '#5d4e46' : '#a1a1aa'} !important;
                }
                
                /* Responsive Reports Styles */
                .report-nav-btn {
                    padding: 16px;
                    font-size: 1rem;
                }
                .report-title {
                    font-size: 1.4rem;
                }
                .report-col-date { width: 18%; }
                .report-col-desc { width: 57%; }
                .report-col-amt { width: 25%; }
                
                @media (max-width: 640px) {
                    .report-nav-btn {
                        padding: 8px 10px !important;
                        font-size: 0.8rem !important;
                        border-radius: 12px !important;
                    }
                    /* INLINE HEADER (COMPACT) */
                    .report-header {
                        flex-direction: row !important;
                        align-items: center !important;
                        gap: 8px !important;
                        margin-bottom: 8px !important;
                    }
                    .report-title {
                        font-size: 0.85rem !important; /* Small font to fit */
                        white-space: nowrap !important; /* Try to keep one line */
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        flex: 1;
                        max-width: none !important;
                    }
                    /* Shrink Action Buttons */
                    .report-action-btn {
                        padding: 6px 10px !important;
                        font-size: 0.75rem !important;
                        height: 32px !important; /* Fixed compact height */
                        gap: 4px !important;
                    }
                    
                    /* Compact Table Text */
                    th, td {
                        font-size: 0.8rem !important; 
                        padding: 10px 0 !important;
                    }
                    .report-date-text { font-size: 0.65rem !important; }
                    
                    /* Adjust table cols */
                    .report-col-date { width: 18% !important; }
                    .report-col-desc { width: 52% !important; }
                    .report-col-amt { width: 30% !important; }
                }
            `}</style>

            {/* 1. TOP NAVIGATION ROW (Floating Buttons) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                {/* Date Toggles */}
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    {[
                        { id: 'daily', label: 'Today', icon: '🍕' },
                        { id: 'weekly', label: 'Week', icon: '🍩' },
                        { id: 'monthly', label: 'Month', icon: '🥐' }
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                triggerHaptic('light');
                                if (item.id === 'daily') {
                                    setSelectedDate(new Date());
                                    setShowCalendar(false);
                                }
                                setView(item.id);
                            }}
                            className="btn-scale report-nav-btn"
                            style={{
                                flex: 1,
                                // padding: '16px', // [MOVED TO CSS]
                                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'white',
                                borderRadius: '20px',
                                border: view === item.id ? (isDark ? '2px solid #4ade80' : '2px solid #18181b') : (isDark ? '2px solid rgba(255,255,255,0.05)' : '2px solid transparent'),
                                boxShadow: view === item.id ? '0 4px 12px rgba(0,0,0,0.08)' : '0 4px 6px rgba(0,0,0,0.02)',
                                color: view === item.id ? (isDark ? 'white' : '#18181b') : (isDark ? '#a1a1aa' : '#71717a'),
                                fontWeight: 700,
                                // fontSize: '1rem', // [MOVED TO CSS]
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                transform: view === item.id ? 'translateY(-2px)' : 'none',
                                backdropFilter: isDark ? 'blur(10px)' : 'none'
                            }}
                        >
                            {item.label} <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                        </button>
                    ))}
                </div>

                {/* Calendar & Close */}
                <div style={{ display: 'flex', gap: '12px', marginLeft: '12px' }}>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setShowCalendar(!showCalendar);
                        }}
                        className="btn-scale"
                        style={{
                            width: '56px', height: '56px',
                            backgroundColor: '#4ade80', // Green
                            borderRadius: '16px',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(74, 222, 128, 0.4)'
                        }}
                    >
                        <CalendarIcon size={24} strokeWidth={2.5} />
                    </button>

                    {isModal && onClose && (
                        <button
                            onClick={onClose}
                            className="btn-scale"
                            style={{
                                padding: '0 20px', height: '56px',
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                border: 'none',
                                color: '#18181b',
                                fontWeight: 700,
                                cursor: 'pointer',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
                            }}
                        >
                            Close
                        </button>
                    )}
                </div>
            </div>

            {/* Calendar Widget (Conditional - Floating Card) */}
            {
                showCalendar && (
                    <div style={{
                        animation: 'fadeIn 0.2s ease-out',
                        flexShrink: 0,
                        backgroundColor: isDark ? '#1E1B18' : 'white', // [FIX] Chocolate Dark
                        padding: '16px',
                        borderRadius: '24px',
                        boxShadow: isDark ? '0 10px 40px -10px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                        border: isDark ? '1px solid #332b29' : 'none'
                    }}>
                        <Calendar
                            onChange={handleDateChange}
                            value={selectedDate}
                            maxDate={new Date()}
                            tileContent={({ date, view }) => view === 'month' && hasTransaction(date) ? <div className="tile-dot"></div> : null}
                        />
                    </div>
                )
            }

            {/* 2. MAIN CONTENT CARD */}
            <div style={{
                backgroundColor: isDark ? '#1E1B18' : 'white', // [FIX] Chocolate Dark
                borderRadius: '24px',
                padding: '16px',
                flex: 1,
                display: 'flex', flexDirection: 'column',
                minHeight: '520px',
                boxShadow: isDark ? '0 10px 40px -10px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                border: isDark ? '1px solid #332b29' : 'none',
                overflow: 'hidden'
            }}>
                {/* Title & Actions */}
                <div className="report-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 className="report-title" style={{ margin: 0, fontWeight: 800, color: isDark ? '#fff7ed' : '#18181b' }}>{getTitle()}</h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {!isModal && (
                            <button
                                onClick={() => { triggerHaptic('light'); setCurrentView('analytics'); }}
                                className="report-action-btn"
                                style={{
                                    padding: '8px 16px', borderRadius: '12px', border: '1px solid #e4e4e7',
                                    backgroundColor: 'white', fontWeight: 600, color: '#16aec8',
                                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                                }}
                            >
                                <PieChartIcon size={18} /> Analytics
                            </button>
                        )}
                        <button
                            onClick={() => { triggerHaptic('light'); setShowExportModal(true); }}
                            className="report-action-btn"
                            style={{
                                padding: '8px 16px', borderRadius: '12px', border: '1px solid #e4e4e7',
                                backgroundColor: 'white', fontWeight: 600, color: '#18181b',
                                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer'
                            }}
                        >
                            <Download size={18} /> Export
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', marginBottom: '4px', borderBottom: isDark ? '2px solid rgba(255,255,255,0.05)' : '2px solid #f4f4f5' }}>
                    <div
                        onClick={() => { triggerHaptic('light'); setViewType('transactions'); }}
                        style={{
                            padding: '12px 24px', cursor: 'pointer', fontWeight: 700,
                            color: viewType === 'transactions' ? '#166534' : (isDark ? '#a1a1aa' : '#a1a1aa'), // Keep active green, faint inactive
                            borderBottom: viewType === 'transactions' ? '2px solid #166534' : '2px solid transparent', marginBottom: '-2px'
                        }}
                    >
                        Transactions
                    </div>
                    <div
                        onClick={() => { triggerHaptic('light'); setViewType('items'); }}
                        style={{
                            padding: '12px 24px', cursor: 'pointer', fontWeight: 700,
                            color: viewType === 'items' ? '#166534' : (isDark ? '#a1a1aa' : '#a1a1aa'),
                            borderBottom: viewType === 'items' ? '2px solid #166534' : '2px solid transparent', marginBottom: '-2px'
                        }}
                    >
                        Item Sales
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 0', borderBottom: isDark ? '1px solid #27272a' : '1px solid #f4f4f5', marginBottom: '0' // [COMPACT] Reduced padding
                }}>
                    {[
                        { label: 'Total Sales 🧁', value: reportData.reduce((acc, curr) => acc + ((curr.type === 'sale' || curr.type === 'order' || curr.type === 'settlement' || curr.type === 'dine_in') ? curr.amount : 0), 0), color: '#166534' },
                        { label: 'Total Expense 💸', value: reportData.reduce((acc, curr) => acc + (curr.type === 'expense' ? curr.amount : 0), 0), color: '#ef4444' },
                        {
                            label: 'Net Profit 💼', value: reportData.reduce((acc, curr) => {
                                if (curr.type === 'sale' || curr.type === 'order' || curr.type === 'settlement' || curr.type === 'dine_in') return acc + curr.amount;
                                if (curr.type === 'expense') return acc - curr.amount;
                                return acc;
                            }, 0), color: isDark ? 'white' : '#18181b'
                        }
                    ].map((stat, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>{stat.label}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: stat.color }}>₹{stat.value.toFixed(2)}</div>
                        </div>
                    ))}
                </div>

                {/* Table Section */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {loading && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                            <div className="spinner"></div>
                        </div>
                    )}

                    {!loading && reportData.length === 0 && (
                        <EmptyState isDark={isDark} />
                    )}

                    {!loading && reportData.length > 0 && viewType === 'transactions' && (
                        <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: isDark ? '#1E1B18' : 'white', zIndex: 10 }}> {/* [FIX] Sticky Header Chocolate */}
                                    <tr style={{ borderBottom: isDark ? '1px solid #332b29' : '1px solid #f4f4f5' }}>
                                        <th className="report-col-date" style={{ textAlign: 'left', padding: '12px 0', color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 700 }}>DATE</th>
                                        <th className="report-col-desc" style={{ textAlign: 'left', padding: '12px 0', color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 700 }}>DESCRIPTION</th>
                                        <th className="report-col-amt" style={{ textAlign: 'right', padding: '12px 0', color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 700 }}>AMOUNT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map(t => (
                                        <tr key={t.id} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f4f4f5' }}>
                                            <td style={{ padding: '16px 0' }}>
                                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isDark ? '#fff7ed' : '#18181b' }}>{format(new Date(t.date), 'dd/MM')}</div> {/* [FIX] Smaller Date */}
                                                <div className="report-date-text" style={{ fontSize: '0.75rem', color: isDark ? '#a1a1aa' : '#a1a1aa' }}>{format(new Date(t.date), 'hh:mm a')}</div>
                                            </td>
                                            <td style={{ textAlign: 'left', padding: '16px 0', color: isDark ? '#e4e4e7' : '#18181b', whiteSpace: 'normal', wordBreak: 'break-word', paddingRight: '8px' }}>
                                                {t.description}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '16px 0', fontWeight: 700, color: (t.type === 'expense') ? '#ef4444' : '#166534' }}>
                                                {(t.type === 'expense') ? '-' : '+'}₹{t.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && reportData.length > 0 && viewType === 'items' && (
                        <div style={{ flex: 1, overflowY: 'auto' }} className="hide-scrollbar">
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: isDark ? '#1E1B18' : 'white', zIndex: 10 }}> {/* [FIX] Sticky Chocolate */}
                                    <tr style={{ borderBottom: isDark ? '1px solid #332b29' : '1px solid #f4f4f5' }}>
                                        <th style={{ width: '55%', textAlign: 'left', padding: '12px 0', color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 700 }}>ITEM</th>
                                        <th style={{ width: '20%', textAlign: 'center', padding: '12px 0', color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 700 }}>QTY</th>
                                        <th style={{ width: '25%', textAlign: 'right', padding: '12px 0', color: '#a1a1aa', fontSize: '0.75rem', fontWeight: 700 }}>TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {itemSalesData.map((item, i) => (
                                        <tr key={i} style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f4f4f5' }}>
                                            <td className="report-cell-desc" style={{ padding: '16px 0', textAlign: 'left', color: isDark ? 'white' : '#18181b', paddingRight: '8px' }}>
                                                <div style={{ fontWeight: 700 }}>{item.name}</div>
                                                <div style={{ fontSize: '0.75rem', color: isDark ? '#a1a1aa' : '#a1a1aa' }}>{item.category}</div>
                                            </td>
                                            <td style={{ textAlign: 'center', padding: '16px 0', color: isDark ? 'white' : '#18181b', fontWeight: 600 }}>
                                                {item.qty}
                                            </td>
                                            <td style={{ textAlign: 'right', padding: '16px 0', fontWeight: 700, color: '#166534' }}>
                                                ₹{item.total}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
            />
        </div >
    );
};

export default Reports;
