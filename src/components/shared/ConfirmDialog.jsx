import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle, Trash2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerHaptic } from '../../utils/haptics';

const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning' // 'warning', 'danger', 'success'
}) => {
    // Prevent background scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const getThemeConfig = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <Trash2 size={28} />,
                    accentColor: 'var(--color-danger, #ef4444)',
                    iconBg: 'rgba(239, 68, 68, 0.1)',
                    shadowColor: 'rgba(239, 68, 68, 0.2)'
                };
            case 'success':
                return {
                    icon: <CheckCircle size={28} />,
                    accentColor: 'var(--color-success, #22c55e)',
                    iconBg: 'rgba(34, 197, 94, 0.1)',
                    shadowColor: 'rgba(34, 197, 94, 0.2)'
                };
            case 'warning':
            default:
                return {
                    icon: <AlertTriangle size={28} />,
                    accentColor: 'var(--color-primary, #f59e0b)',
                    iconBg: 'rgba(245, 158, 11, 0.1)',
                    shadowColor: 'rgba(245, 158, 11, 0.2)'
                };
        }
    };

    const config = getThemeConfig();

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div style={styles.overlay}>
                    {/* Backdrop blur overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        style={styles.backdrop}
                    />

                    {/* Dialog Container */}
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 15 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 15 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                            mass: 0.8
                        }}
                        style={styles.card}
                    >
                        {/* Status Icon */}
                        <div style={{
                            ...styles.iconContainer,
                            backgroundColor: config.iconBg,
                            color: config.accentColor
                        }}>
                            {config.icon}
                        </div>

                        {/* Title */}
                        <h3 style={styles.title}>{title}</h3>

                        {/* Message */}
                        <p style={styles.message}>{message}</p>

                        {/* Actions */}
                        <div style={styles.actions}>
                            <button
                                onClick={() => {
                                    triggerHaptic('light');
                                    onClose();
                                }}
                                style={styles.cancelBtn}
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    triggerHaptic('medium');
                                    onConfirm();
                                }}
                                style={{
                                    ...styles.confirmBtn,
                                    backgroundColor: config.accentColor,
                                    boxShadow: `0 4px 14px ${config.shadowColor}`
                                }}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

const styles = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 50000, // Make sure it sits above all other drawers / overlays
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    backdrop: {
        position: 'absolute',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
    },
    card: {
        position: 'relative',
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'var(--color-bg-surface-transparent, rgba(30, 30, 30, 0.75))',
        border: '1px solid var(--color-border, rgba(255, 255, 255, 0.08))',
        borderRadius: '24px',
        padding: '28px',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    iconContainer: {
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '18px'
    },
    title: {
        fontSize: '1.25rem',
        fontWeight: 800,
        margin: '0 0 10px',
        color: 'var(--color-text-main, #ffffff)'
    },
    message: {
        fontSize: '0.9rem',
        color: 'var(--color-text-muted, #a3a3a3)',
        lineHeight: 1.5,
        margin: '0 0 24px',
        padding: '0 8px'
    },
    actions: {
        width: '100%',
        display: 'flex',
        gap: '12px'
    },
    cancelBtn: {
        flex: 1,
        padding: '12px',
        borderRadius: '12px',
        border: '1px solid var(--color-border, rgba(255, 255, 255, 0.08))',
        backgroundColor: 'var(--color-bg-secondary, #242424)',
        color: 'var(--color-text-muted, #a3a3a3)',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    confirmBtn: {
        flex: 1.2,
        padding: '12px',
        borderRadius: '12px',
        border: 'none',
        color: '#ffffff',
        fontWeight: 700,
        fontSize: '0.9rem',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

export default ConfirmDialog;
