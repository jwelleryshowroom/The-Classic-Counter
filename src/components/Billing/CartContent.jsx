import React from 'react';
import {
    Plus, Minus, ShoppingCart, User, Calendar, Clock, Phone, Trash2, Award,
    NotebookPen, Save, Printer, ShoppingBag, Clipboard
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import { toTitleCase } from '../../utils/smartHelpers';

// --- Extracted Cart Component to fix Focus Issues ---
const CartContent = ({
    isMobile = false,
    mode,
    setMode,
    cart,
    totalAmount,
    payment,
    setPayment,
    customerDetails,
    setCustomerDetails,
    handoverMode,
    setHandoverMode,
    deliveryDetails,
    setDeliveryDetails,
    updateQty,
    handleCheckout,
    balanceDue,
    isPrinting,
    clearCart,
    existingCustomer
}) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Header Spacer for Mobile Modal */}
            {isMobile && <div style={{ height: '8px' }}></div>}

            {/* SCENARIO B: ORDER DETAILS (Only if Order Mode) */}
            {mode === 'order' && (
                <div style={{ padding: '12px', background: 'transparent', borderBottom: '1px solid var(--color-border)' }}>
                    {/* Header Row: Label + Toggle Inline */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Order Details</div>

                        {/* Compact Handover Type Toggle */}
                        <div style={{ display: 'flex', background: 'var(--color-bg-glass-tab)', padding: '2px', borderRadius: '6px', border: '1px solid var(--color-border)' }}>
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    setHandoverMode('now');
                                }}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: handoverMode === 'now' ? 'var(--color-bg-surface)' : 'transparent',
                                    color: handoverMode === 'now' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    boxShadow: handoverMode === 'now' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                    border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: handoverMode === 'now' ? 700 : 500
                                }}
                            >
                                Take Now
                            </button>
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    setHandoverMode('later');
                                }}
                                style={{
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    background: handoverMode === 'later' ? 'var(--color-bg-surface)' : 'transparent',
                                    color: handoverMode === 'later' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    boxShadow: handoverMode === 'later' ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                                    border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: handoverMode === 'later' ? 700 : 500
                                }}
                            >
                                Book Later
                            </button>
                        </div>
                    </div>

                    {/* Customer Input */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ flex: 1.5, position: 'relative' }}>
                            <User size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#666' }} />
                            <input
                                placeholder="Name"
                                value={customerDetails.name}
                                onChange={e => setCustomerDetails(prev => ({ ...prev, name: toTitleCase(e.target.value) }))}
                                style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)' }}
                            />
                        </div>

                        <div style={{ flex: 1, position: 'relative' }}>
                            <Phone size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#666' }} />
                            <input
                                type="tel"
                                placeholder="Phone"
                                value={customerDetails.phone}
                                onChange={e => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setCustomerDetails(prev => ({ ...prev, phone: val }));
                                }}
                                style={{ width: '100%', padding: '10px 10px 10px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)' }}
                            />
                        </div>
                    </div >

                    {/* Returning Customer Badge */}
                    {
                        existingCustomer && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                background: 'rgba(255, 152, 0, 0.1)', color: 'var(--color-primary)',
                                padding: '6px 10px', borderRadius: '6px', fontSize: '0.8rem',
                                marginBottom: '10px', width: 'fit-content'
                            }}>
                                <Award size={14} />
                                <span style={{ fontWeight: 600 }}>Returning Customer</span>
                                <span style={{ opacity: 0.8 }}>• {existingCustomer.visitCount} Visits</span>
                            </div>
                        )
                    }


                    {/* Date Picker (Only if Handover IS Later) */}
                    {
                        handoverMode === 'later' && (
                            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Date Input */}
                                <div style={{ flex: 1.5, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-glass-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <Calendar size={16} color="#FF9800" />
                                    <input
                                        type="date"
                                        value={deliveryDetails.date}
                                        onChange={e => setDeliveryDetails(prev => ({ ...prev, date: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', colorScheme: 'var(--color-scheme)', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                </div>

                                {/* Time Input */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg-glass-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                    <Clock size={16} color="#4CAF50" />
                                    <input
                                        type="time"
                                        value={deliveryDetails.time}
                                        onChange={e => setDeliveryDetails(prev => ({ ...prev, time: e.target.value }))}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-primary)', colorScheme: 'var(--color-scheme)', width: '100%', fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none' }}
                                    />
                                </div>
                            </div>
                        )
                    }
                </div >
            )
            }

            {/* CART ITEMS LIST */}
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '12px' }}>
                {!isMobile && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, color: '#aaa', fontSize: '0.9rem' }}>CURRENT CART</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#666' }}>{cart.length} Items</span>
                            {cart.length > 0 && (
                                <button
                                    onClick={() => {
                                        triggerHaptic('medium');
                                        clearCart();
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#FF5252', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255, 82, 82, 0.1)' }}
                                >
                                    <Trash2 size={12} /> Clear
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {cart.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', opacity: 0.6 }}>
                        <ShoppingCart size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                        <div style={{ fontSize: '0.85rem' }}>Cart is empty</div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {cart.map((item) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px dashed rgba(150,150,150,0.1)' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '0.95rem' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        ₹{item.price} each {item.isVariant && <span style={{ background: 'var(--color-bg-secondary)', padding: '1px 4px', borderRadius: '4px', marginLeft: '4px', fontSize: '0.7rem' }}>{item.variantId}</span>}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-bg-secondary)', borderRadius: '6px', border: '1px solid var(--color-border)', padding: '2px' }}>
                                        <button
                                            onClick={() => updateQty(item.id, -1)}
                                            style={{ padding: '2px 6px', color: 'var(--color-text-primary)' }}
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span style={{ fontSize: '0.85rem', fontWeight: 600, minWidth: '18px', textAlign: 'center', color: 'var(--color-text-primary)' }}>{item.qty}</span>
                                        <button
                                            onClick={() => updateQty(item.id, 1)}
                                            style={{ padding: '2px 6px', color: 'var(--color-text-primary)' }}
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <div style={{ fontWeight: 700, minWidth: '36px', textAlign: 'right', color: 'var(--color-text-primary)', fontSize: '0.9rem' }}>
                                        ₹{item.price * item.qty}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* FOOTER - COMPACT ON MOBILE */}
            <div style={{
                padding: isMobile ? '12px' : '20px',
                background: 'var(--color-bg-surface)',
                // Removed top border to reduce 'lines' visibility
                // borderTop: '1px solid var(--color-border)',
                // [POLISH] Floating Bubble Effect for Footer
                margin: isMobile ? '0' : '16px',
                borderRadius: isMobile ? '0' : '20px',
                boxShadow: '0 -4px 24px rgba(0,0,0,0.06)', // Always shadow for "pop"
                border: isMobile ? 'none' : '1px solid var(--color-border)'
            }}>
                {mode === 'order' && (
                    <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
                        <div style={{ position: 'relative' }}>
                            <NotebookPen size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#666' }} />
                            <input
                                placeholder="Special Instructions..."
                                value={customerDetails.note || ''}
                                onChange={e => setCustomerDetails(prev => ({ ...prev, note: e.target.value }))}
                                style={{ width: '100%', padding: '8px 8px 8px 34px', background: 'var(--color-bg-glass-input)', border: '1px solid var(--color-border)', borderRadius: '6px', color: 'var(--color-text-primary)', fontSize: '0.85rem' }}
                            />
                        </div>
                    </div>
                )}

                {/* Totals Section */}
                <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                        <span style={{ color: '#aaa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}>🧾</span> Total
                        </span>
                        <span style={{ color: 'var(--color-text-main)' }}>₹{totalAmount}</span>
                    </div>

                    {/* Order Mode Extras */}
                    {mode === 'order' && handoverMode === 'later' && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Advance</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-bg-glass-input)', borderRadius: '4px', padding: '0 8px', border: '1px solid var(--color-border)' }}>
                                    <span style={{ color: 'var(--color-text-main)', fontSize: '0.9rem', fontWeight: 600 }}>₹</span>
                                    <input
                                        type="number"
                                        className="no-spinner"
                                        value={payment.advance}
                                        onChange={e => setPayment(prev => ({ ...prev, advance: e.target.value }))}
                                        style={{ width: '60px', background: 'transparent', border: 'none', color: 'var(--color-text-primary)', fontWeight: 600, textAlign: 'right', padding: '6px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', fontWeight: 600, paddingTop: '8px', borderTop: '1px dashed var(--color-border)' }}>
                                <span style={{ color: '#FF5252' }}>BALANCE</span>
                                <span style={{ color: '#FF5252' }}>₹{balanceDue}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Payment Method Toggle */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: isMobile ? '10px' : '16px' }}>
                    <button onClick={() => { triggerHaptic('light'); setPayment(prev => ({ ...prev, type: 'cash' })); }} style={{ flex: 1, padding: isMobile ? '8px' : '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: payment.type === 'cash' ? 'var(--color-bg-tertiary)' : 'transparent', color: payment.type === 'cash' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>💵 CASH</button>
                    <button onClick={() => { triggerHaptic('light'); setPayment(prev => ({ ...prev, type: 'upi' })); }} style={{ flex: 1, padding: isMobile ? '8px' : '8px', borderRadius: '6px', border: '1px solid var(--color-border)', background: payment.type === 'upi' ? 'var(--color-bg-tertiary)' : 'transparent', color: payment.type === 'upi' ? 'var(--color-text-primary)' : 'var(--color-text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}>📱 UPI</button>
                </div>

                {/* DUAL ACTION BUTTONS */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Hide standalone Save button on mobile to save space, or keep it small? User wanted PRINT button change primarily. keeping both but updating print text. */}
                    <button disabled={cart.length === 0} onClick={() => handleCheckout(false)} style={{ flex: 1, padding: isMobile ? '12px' : '14px', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'var(--color-bg-surface)', color: 'var(--color-text-primary)', fontWeight: 700, fontSize: '0.9rem', cursor: cart.length === 0 ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: cart.length === 0 ? 0.5 : 1 }}>
                        <Save size={18} /> <span>SAVE</span>
                    </button>

                    <button disabled={cart.length === 0 || isPrinting} onClick={() => handleCheckout(true)} style={{ flex: 1.5, padding: isMobile ? '12px' : '14px', borderRadius: '8px', border: 'none', background: (cart.length === 0 || isPrinting) ? '#ccc' : (mode === 'quick' ? '#4CAF50' : '#FF9800'), color: (cart.length === 0 || isPrinting) ? '#666' : (mode === 'quick' ? 'white' : 'black'), fontWeight: 800, fontSize: '0.9rem', cursor: (cart.length === 0 || isPrinting) ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', boxShadow: (cart.length === 0 || isPrinting) ? 'none' : '0 4px 12px rgba(0,0,0,0.2)' }}>
                        <Printer size={18} /> <span>{isPrinting ? 'PROCESSING...' : 'PRINT & SAVE'}</span>
                    </button>
                </div>
            </div>

            {/* Spacer logic removed to keep footer fixed at bottom */}
        </div >
    );
};

export default CartContent;
