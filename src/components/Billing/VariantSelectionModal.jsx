import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart } from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

const VariantSelectionModal = ({ isOpen, onClose, item, onSelect, anchorRect }) => {
    if (!isOpen || !item) return null;

    // --- Dynamic Positioning Logic ---
    const isMobile = window.innerWidth < 768;

    // Default Style (Mobile Top Sheet)
    let style = {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        background: 'var(--color-bg-surface)',
        borderBottomLeftRadius: '24px',
        borderBottomRightRadius: '24px',
        padding: '24px',
        zIndex: 101,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        borderBottom: '1px solid var(--color-border)',
        transform: 'none',
        maxHeight: '80vh',
        overflowY: 'auto'
    };

    let initial = { y: '-100%' };
    let animate = { y: 0 };
    let exit = { y: '-100%' };

    // Desktop/Laptop Check (Use Popover if not mobile and anchor exists)
    if (!isMobile && anchorRect) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const modalWidth = 340;
        const modalHeight = 400; // Approx max height

        // Strategy: Right side prefered, then Left, then Bottom
        let top = anchorRect.top;
        let left = anchorRect.right + 12; // 12px gap

        // 1. Check Right Edge
        if (left + modalWidth > viewportWidth - 20) {
            // Not enough space on right, try left
            left = anchorRect.left - modalWidth - 12;

            // 2. Check Left Edge
            if (left < 20) {
                // Not enough space on left either? Center horizontally or stick to valid edge
                left = Math.max(20, (viewportWidth - modalWidth) / 2);
                // Force Below if horizontal fails
                top = anchorRect.bottom + 12;
            }
        }

        // 3. Check Bottom Edge
        // If the modal goes off the bottom, shift it up
        if (top + modalHeight > viewportHeight - 20) {
            const overflow = (top + modalHeight) - (viewportHeight - 20);
            top -= overflow;
        }

        // 4. Check Top Edge (if shifted up too much)
        if (top < 20) top = 20;

        style = {
            position: 'fixed',
            top: top,
            left: left,
            width: `${modalWidth}px`,
            background: 'var(--color-bg-surface)',
            borderRadius: '16px',
            padding: '20px',
            zIndex: 101,
            boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
            border: '1px solid var(--color-border)',
            maxHeight: '400px',
            overflowY: 'auto'
        };

        initial = { opacity: 0, scale: 0.95 };
        animate = { opacity: 1, scale: 1 };
        exit = { opacity: 0, scale: 0.95 };
    }

    // Fallback Center (Desktop but no anchor)
    if (!isMobile && !anchorRect) {
        style = {
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: '400px', background: 'var(--color-bg-surface)', borderRadius: '16px', padding: '24px',
            zIndex: 101, boxShadow: '0 10px 40px rgba(0,0,0,0.3)', border: '1px solid var(--color-border)'
        };
        initial = { opacity: 0, scale: 0.9 };
        animate = { opacity: 1, scale: 1 };
        exit = { opacity: 0, scale: 0.9 };
    }


    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            triggerHaptic('light');
                            onClose();
                        }}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.5)',
                            zIndex: 100,
                            backdropFilter: 'blur(2px)' // Subtle blur
                        }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={initial}
                        animate={animate}
                        exit={exit}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={style}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>Select Size</h3>
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    onClose();
                                }}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
                            >
                                <X size={20} color="var(--color-text-muted)" />
                            </button>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                            <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'var(--color-bg-secondary)', overflow: 'hidden', flexShrink: 0 }}>
                                {item.image && item.image.length > 5 ? (
                                    <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>{item.image || '🍽️'}</div>
                                )}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--color-text-main)' }}>{item.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{item.category}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {item.variants.map(variant => (
                                <button
                                    key={variant.id}
                                    onClick={() => {
                                        triggerHaptic('success');
                                        onSelect(variant);
                                    }}
                                    style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '12px 16px',
                                        background: 'var(--color-bg-secondary)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '12px',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        transition: 'background 0.2s',
                                        width: '100%'
                                    }}
                                    className="hover-bg-muted"
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>{variant.name}</div>
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: (item.trackStock !== false && variant.stock < 3) ? 'var(--color-danger)' : 'var(--color-text-muted)',
                                            fontWeight: (item.trackStock === false) ? 600 : 400
                                        }}>
                                            {item.trackStock === false ? 'Available' : `${variant.stock} available`}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{variant.price}</div>
                                        <ShoppingCart size={16} color="var(--color-text-muted)" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default VariantSelectionModal;
