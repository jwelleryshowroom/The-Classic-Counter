import React from 'react';
import { Plus, Minus, Send, CheckCircle, Clock, PlayCircle, Receipt, X } from 'lucide-react';

export default function WaiterCart({ cart, onUpdateQty, onSend, selectedTable, activeSession, onRequestBill, onClose }) {
    const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const kots = activeSession?.kots || [];
    
    // Calculate total from KOTs
    const kotTotal = kots.reduce((sum, kot) => {
        return sum + kot.items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    }, 0);

    const grandTotal = cartTotal + kotTotal;

    const getStatusIcon = (status) => {
        switch(status) {
            case 'ordered': return <Clock size={14} color="var(--color-warning)" />;
            case 'preparing': return <PlayCircle size={14} color="var(--color-primary)" />;
            case 'ready': return <CheckCircle size={14} color="var(--color-success)" />;
            case 'served': return <CheckCircle size={14} color="var(--color-text-muted)" />;
            default: return null;
        }
    };

    if (!selectedTable) {
        return (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px', opacity: 0.8, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>🍽️</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Select a table</div>
                <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>to start ordering</div>
            </div>
        );
    }

    const isBillRequested = activeSession?.status === 'Billing Requested';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '1.2rem' }}>Table {selectedTable.replace('T', '')}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {isBillRequested && (
                        <span style={{ fontSize: '0.8rem', background: 'var(--color-danger)', color: 'white', padding: '4px 8px', borderRadius: '4px' }}>Bill Requested</span>
                    )}
                    {onClose && (
                        <button 
                            onClick={onClose} 
                            style={{ 
                                background: 'transparent', 
                                border: 'none', 
                                cursor: 'pointer', 
                                color: 'var(--color-text-primary)', 
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* ALREADY ORDERED SECTION (KOTs) */}
                {kots.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Already Ordered ({kots.length} batches)
                        </div>
                        {kots.map((kot, idx) => (
                            <div key={kot.id} style={{ background: 'var(--color-bg-base)', borderRadius: '8px', padding: '12px', border: '1px solid var(--color-border)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>KOT #{idx + 1}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                                        {getStatusIcon(kot.status)} <span style={{ textTransform: 'capitalize' }}>{kot.status}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {kot.items.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span><span style={{ color: 'var(--color-text-muted)', marginRight: '6px' }}>{item.qty}x</span> {item.name}</span>
                                            <span style={{ color: 'var(--color-text-muted)' }}>₹{item.price * item.qty}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* ACTIVE CART SECTION */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(cart.length > 0 || kots.length === 0) && (
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            New Order
                        </div>
                    )}
                    
                    {cart.length === 0 && kots.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginTop: '20px', padding: '32px 20px', border: '1px dashed var(--color-border)', borderRadius: '12px', background: 'var(--color-bg-base)' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '12px', opacity: 0.8 }}>🛒</div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '4px' }}>Cart is empty</div>
                            <div style={{ fontSize: '0.85rem' }}>Add items from the menu.</div>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-surface)', padding: '8px 0' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>₹{item.price}</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <button onClick={() => onUpdateQty(item.id, -1)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'transparent', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                                        <Minus size={14} />
                                    </button>
                                    <span style={{ fontWeight: 600, minWidth: '20px', textAlign: 'center' }}>{item.qty}</span>
                                    <button onClick={() => onUpdateQty(item.id, 1)} style={{ padding: '4px', borderRadius: '4px', border: '1px solid var(--color-border)', background: 'var(--color-bg-secondary)', cursor: 'pointer', color: 'var(--color-text-primary)' }}>
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div style={{ padding: '16px', borderTop: '1px solid var(--color-border)', background: 'var(--color-bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>
                    <span>Total</span>
                    <span style={{ color: 'var(--color-primary)' }}>₹{grandTotal}</span>
                </div>
                
                {cart.length > 0 ? (
                    <button
                        onClick={onSend}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '12px',
                            background: 'var(--color-primary)', color: 'white',
                            border: 'none', fontWeight: 700, fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            cursor: 'pointer'
                        }}
                    >
                        <Send size={18} /> Send to Kitchen (₹{cartTotal})
                    </button>
                ) : kots.length > 0 ? (
                    <button
                        onClick={onRequestBill}
                        disabled={isBillRequested}
                        style={{
                            width: '100%', padding: '16px', borderRadius: '12px',
                            background: isBillRequested ? 'var(--color-bg-secondary)' : '#1a1a1a', 
                            color: isBillRequested ? 'var(--color-text-muted)' : '#ffffff',
                            border: 'none', fontWeight: 700, fontSize: '1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            cursor: isBillRequested ? 'not-allowed' : 'pointer'
                        }}
                    >
                        <Receipt size={18} /> {isBillRequested ? 'Bill Requested' : 'Request Bill'}
                    </button>
                ) : null}
            </div>
        </div>
    );
}
