import React, { useState } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { CheckCircle, Clock, Printer, Utensils } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';
import StatusBadge from './StatusBadge';

const MobileOrderCard = ({ order, onPrint, onShare, onDeliver, onMarkReady, isHighlighted }) => { // [NEW] isHighlighted
    const [expanded, setExpanded] = useState(isHighlighted || false);

    // Auto-expand if highlighted changes
    React.useEffect(() => {
        if (isHighlighted) setExpanded(true);
    }, [isHighlighted]);
    const { id, customer, items, payment, status, date, delivery } = order;

    // Delivery Timer Logic
    const getTimerDisplay = () => {
        if (!delivery?.date || status === 'completed') return null;

        try {
            // Combine date and time
            const dStr = delivery.date;
            const tStr = delivery.time || "00:00";
            const target = new Date(`${dStr}T${tStr}`);

            if (isNaN(target.getTime())) return null;

            const now = new Date();
            const diff = differenceInMinutes(target, now);

            if (diff < 0) {
                const mins = Math.abs(diff);
                const hrs = Math.floor(mins / 60);
                const display = hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;
                return { text: `Delayed by ${display}`, color: 'var(--color-danger)' };
            } else {
                const hrs = Math.floor(diff / 60);
                const mins = diff % 60;
                const display = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                return { text: `Due in ${display}`, color: diff < 30 ? 'var(--color-warning)' : 'var(--color-primary)' };
            }
        } catch (e) {
            return null;
        }
    };

    const timer = getTimerDisplay();
    const isUrgent = status === 'pending';

    return (
        <div onClick={() => {
            triggerHaptic('light');
            setExpanded(!expanded);
        }} style={{
            background: 'var(--color-surface)',
            borderRadius: '16px',
            marginBottom: '12px',
            padding: '16px',
            border: `1px solid ${expanded || isHighlighted ? 'var(--color-primary)' : 'var(--color-border)'}`,
            boxShadow: isHighlighted ? '0 0 0 2px rgba(22, 163, 74, 0.2), 0 4px 12px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)', // [NEW] Highlight glow
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            transform: isHighlighted ? 'scale(1.02)' : 'scale(1)' // [NEW] Slight pop
        }}>
            {/* Header: ID + Status + Time */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text-primary)' }}>
                            ₹{order.totalValue || 0}
                        </span>
                        {isUrgent && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-danger)', boxShadow: '0 0 8px var(--color-danger)' }}></span>}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', fontWeight: 600 }}>
                        #{id.slice(-6).toUpperCase()} • {format(new Date(date), 'hh:mm a')}
                    </div>
                </div>
                <StatusBadge
                    status={status}
                    onClick={status === 'pending' ? (e) => { e.stopPropagation(); onMarkReady(id); } : undefined}
                />
            </div>

            {/* Body: Customer + Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--color-text-primary)' }}>
                        {customer?.name || 'Walk-in Customer'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: '180px' }}>
                        {items.length} Items • {items.map(i => i.name).join(', ')}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    {/* Delivery Time / Status Replacement */}
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                        {timer ? (
                            <span style={{ color: timer.color }}>{timer.text}</span>
                        ) : (status === 'completed' && order.type === 'order') ? (
                            <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <CheckCircle size={14} /> Booking Paid
                            </span>
                        ) : delivery?.date ? (
                            <>
                                <Clock size={14} color="var(--color-primary)" />
                                <span>{delivery.time ? format(new Date(`2000-01-01T${delivery.time}`), 'hh:mm a') : format(new Date(delivery.date), 'dd MMM')}</span>
                            </>
                        ) : order.type === 'dine_in' ? (
                            <span style={{ color: '#E91E63', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Utensils size={14} /> Dine-In
                            </span>
                        ) : (
                            <span style={{ color: 'var(--color-success)', fontSize: '0.9rem' }}>Instant</span>
                        )}
                    </div>

                    {/* Balance / Paid Status */}
                    <div style={{ fontSize: '0.75rem', marginTop: '4px', color: payment?.balance > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: 600 }}>
                        {payment?.balance > 0 ? `Due: ₹${payment.balance}` : 'Paid'}
                    </div>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--color-border)', animation: 'fadeIn 0.3s' }}>
                    {/* Delivery Info */}
                    {delivery?.date && (
                        <div style={{ background: 'var(--color-bg-secondary)', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={14} />
                            <span>Delivery: <b>{format(new Date(delivery.date), 'dd MMM')}</b> at <b>{delivery.time ? format(new Date(`2000-01-01T${delivery.time}`), 'hh:mm a') : 'Anytime'}</b></span>
                        </div>
                    )}

                    {/* Special Instructions */}
                    {(customer?.note || order.note) && (
                        <div style={{ background: 'rgba(255, 152, 0, 0.1)', color: 'var(--color-text-main)', padding: '8px 12px', borderRadius: '8px', marginBottom: '12px', fontSize: '0.85rem', border: '1px dashed orange' }}>
                            <strong>Note:</strong> {customer?.note || order.note}
                        </div>
                    )}

                    {/* Item List */}
                    <div style={{ marginBottom: '16px' }}>
                        {items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
                                <span>{item.qty} x {item.name}</span>
                                <span>₹{item.price * item.qty}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                onPrint(order);
                            }}
                            style={{ flex: 1, minWidth: '80px', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'transparent', color: 'var(--color-text-primary)', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                        >
                            <Printer size={16} /> Print
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                triggerHaptic('light');
                                onShare(order);
                            }}
                            style={{ flex: 1, minWidth: '80px', padding: '10px', borderRadius: '8px', border: 'none', background: '#DCF8C6', color: '#128C7E', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#128C7E">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                        </button>
                        {(status === 'pending' || status === 'ready') && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    triggerHaptic('light');
                                    onDeliver(order);
                                }}
                                style={{ flex: 1, minWidth: '80px', padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--color-primary)', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', fontWeight: 600 }}
                            >
                                <CheckCircle size={16} /> Done
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MobileOrderCard;
