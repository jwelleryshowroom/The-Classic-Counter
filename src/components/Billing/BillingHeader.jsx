import React from 'react';
import { Search, ShoppingBag, Clipboard, Sun, Moon } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';
import ProfileMenu from '../ProfileMenu';

// Local Icons specific to this header
const ShoppingBagIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>;
const ClipboardIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>;

const BillingHeader = ({
    isMobile,
    showMobileSearch,
    setShowMobileSearch,
    searchTerm,
    setSearchTerm,
    mode,
    setMode
}) => {
    return (
        <header style={{
            padding: '12px 16px', // Align with other pages (was 20px)
            background: 'transparent',
            borderBottom: 'none',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0,
            height: '60px',
            position: 'relative',
            gap: isMobile ? '12px' : '24px'
        }}>
            {/* A. MOBILE SEARCH OVERLAY (If activated via button, though button isn't here anymore? default logic) */}
            {showMobileSearch ? (
                <div style={{ position: 'absolute', inset: 0, background: 'var(--color-bg-surface)', display: 'flex', alignItems: 'center', padding: '0 12px', zIndex: 50 }}>
                    <Search size={18} style={{ marginRight: '12px', color: '#666' }} />
                    <input
                        autoFocus
                        placeholder="Search Item..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '1rem', outline: 'none', height: '100%', color: 'var(--color-text-primary)' }}
                    />
                    <button onClick={() => {
                        triggerHaptic('light');
                        setShowMobileSearch(false);
                    }} style={{ padding: '8px', background: 'transparent', border: 'none', color: '#666' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            ) : (
                <>
                    {/* LEFT: Branding */}
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ fontWeight: 800, fontSize: '1.4rem', letterSpacing: '0.5px', color: 'var(--color-text-main)' }}>
                            Billing
                        </div>
                    </div>

                    {/* 2. CENTER: SEARCH BAR (Responsive) */}
                    {!isMobile && (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', maxWidth: '400px', margin: '0 24px' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                background: 'var(--color-bg-input)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px', padding: '8px 16px',
                                width: '100%',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                                transition: 'all 0.2s ease',
                            }}>
                                <Search size={18} color="var(--color-text-muted)" style={{ marginRight: '10px' }} />
                                <input
                                    placeholder="Search Items..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{
                                        border: 'none', background: 'transparent',
                                        fontSize: '0.95rem', width: '100%', outline: 'none',
                                        color: 'var(--color-text-primary)',
                                        padding: 0
                                    }}
                                />
                                {searchTerm && (
                                    <button onClick={() => { triggerHaptic('light'); setSearchTerm(''); }} style={{ border: 'none', background: 'transparent', padding: 0, marginLeft: '4px', cursor: 'pointer', display: 'flex' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {isMobile && (
                        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                            <div style={{
                                display: 'flex', alignItems: 'center',
                                background: 'var(--color-bg-input)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '12px', padding: '8px 12px',
                                width: '100%', maxWidth: '100%'
                            }}>
                                <Search size={16} color="var(--color-text-muted)" style={{ marginRight: '8px' }} />
                                <input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{
                                        border: 'none', background: 'transparent',
                                        fontSize: '0.9rem', width: '100%', outline: 'none',
                                        color: 'var(--color-text-primary)',
                                        padding: 0
                                    }}
                                />
                                {searchTerm && (
                                    <button onClick={() => { triggerHaptic('light'); setSearchTerm(''); }} style={{ border: 'none', background: 'transparent', padding: 0, marginLeft: '4px', display: 'flex' }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* RIGHT: Mode Switcher (DESKTOP) + Profile */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Mode Switcher - HIDDEN ON MOBILE */}
                        {!isMobile && (
                            <div style={{ display: 'flex', background: 'var(--color-bg-surface)', padding: '4px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                                <button
                                    onClick={() => { triggerHaptic('light'); setMode('quick'); }}
                                    style={{
                                        padding: '6px 16px', borderRadius: '6px',
                                        background: mode === 'quick' ? '#4CAF50' : 'transparent',
                                        color: mode === 'quick' ? 'white' : 'var(--color-text-muted)',
                                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                        border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>⚡</span> <span>QUICK</span>
                                </button>
                                <div style={{ width: '1px', background: 'var(--color-border)', margin: '4px 0' }}></div>
                                <button
                                    onClick={() => { triggerHaptic('light'); setMode('order'); }}
                                    style={{
                                        padding: '6px 16px', borderRadius: '6px',
                                        background: mode === 'order' ? '#FF9800' : 'transparent',
                                        color: mode === 'order' ? 'black' : 'var(--color-text-muted)',
                                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                        border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>🧾</span> <span>ORDER</span>
                                </button>
                                <div style={{ width: '1px', background: 'var(--color-border)', margin: '4px 0' }}></div>
                                <button
                                    onClick={() => { triggerHaptic('light'); setMode('dine-in'); }}
                                    style={{
                                        padding: '6px 16px', borderRadius: '6px',
                                        background: mode === 'dine-in' ? '#E91E63' : 'transparent',
                                        color: mode === 'dine-in' ? 'white' : 'var(--color-text-muted)',
                                        fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px',
                                        border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>🍽️</span> <span>DINE IN</span>
                                </button>
                            </div>
                        )}

                        <ProfileMenu />
                    </div>
                </>
            )}
        </header>
    );
};

export default BillingHeader;
