import React from 'react';
import { Utensils, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatTableName, deriveTableStatus } from '../../../components/shared/TableStatusCard';
import { useSettings } from '../../../context/SettingsContext';

export default function TableSelectionScreen({ tables, sessions, onSelectTable, onAddTable }) {
    const { isMobile } = useSettings();
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            background: 'var(--color-bg-base)',
            overflowY: 'auto',
            padding: isMobile ? '12px' : '24px 32px'
        }} className="no-scrollbar">
            <style>{`
                @keyframes pulseBorder {
                    0% { border-color: var(--color-border); }
                    50% { border-color: var(--color-primary); }
                    100% { border-color: var(--color-border); }
                }
                .pulse-card {
                    animation: pulseBorder 2.4s infinite ease-in-out;
                }
            `}</style>
            <div style={{ marginBottom: isMobile ? '12px' : '24px', textAlign: 'left' }}>
                <h1 style={{
                    fontSize: isMobile ? '1.25rem' : '1.8rem',
                    fontWeight: 900,
                    color: 'var(--color-text-primary)',
                    margin: '0',
                    letterSpacing: '-0.5px'
                }}>
                    Select a Table
                </h1>
                {!isMobile && (
                    <p style={{
                        fontSize: '0.95rem',
                        color: 'var(--color-text-muted)',
                        margin: 0,
                        fontWeight: 500
                    }}>
                        Select a table below to start taking orders or create a new session.
                    </p>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: isMobile ? '8px' : '16px',
                marginBottom: isMobile ? '20px' : '40px'
            }}>
                {tables.map((table, idx) => {
                    const session = sessions.find(s => s.tableId === table);
                    const { label, color, bg } = deriveTableStatus(session);
                    const tableName = formatTableName(table);
                    const kotCount = (session?.kots || []).length;

                    // Icon based on status
                    let StatusIcon = Utensils;
                    if (label === 'Billing Req.') StatusIcon = AlertTriangle;
                    if (label === 'Ready ✓' || label === 'Served') StatusIcon = CheckCircle;
                    if (label === 'Preparing' || label === 'Ordered') StatusIcon = Clock;

                    return (
                        <motion.button
                            key={table}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: Math.min(idx * 0.03, 0.4) }}
                            whileHover={{ y: -4, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onSelectTable(table)}
                            className={isMobile && !session ? "pulse-card" : ""}
                            style={{
                                background: 'var(--color-bg-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: isMobile ? '12px' : '20px',
                                padding: isMobile ? '10px 4px' : '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: isMobile ? '4px' : '12px',
                                cursor: 'pointer',
                                transition: 'border-color 0.2s, box-shadow 0.2s',
                                position: 'relative',
                                minHeight: isMobile ? '85px' : '160px',
                                outline: 'none',
                                textAlign: 'center',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                animationDelay: `${idx * 0.3}s`
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-primary)';
                                e.currentTarget.style.boxShadow = '0 12px 24px -10px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-border)';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
                            }}
                        >
                            {/* Top Status Accent Bar */}
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: isMobile ? '10%' : '20%',
                                right: isMobile ? '10%' : '20%',
                                height: isMobile ? '3px' : '4px',
                                borderRadius: '0 0 4px 4px',
                                background: color,
                                opacity: 0.8
                            }} />

                            {/* Table Icon Container */}
                            <div style={{
                                width: isMobile ? '28px' : '48px',
                                height: isMobile ? '28px' : '48px',
                                borderRadius: isMobile ? '8px' : '14px',
                                background: bg,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: color,
                                marginBottom: isMobile ? '0' : '4px'
                            }}>
                                <StatusIcon size={isMobile ? 14 : 24} />
                            </div>

                            {/* Table Identity */}
                            <div>
                                <div style={{
                                    fontSize: isMobile ? '0.9rem' : '1.25rem',
                                    fontWeight: 800,
                                    color: 'var(--color-text-primary)',
                                    letterSpacing: '-0.3px',
                                    lineHeight: '1.2'
                                }}>
                                    {tableName}
                                </div>
                                {session && (
                                    <div style={{
                                        fontSize: isMobile ? '0.68rem' : '0.78rem',
                                        color: 'var(--color-text-muted)',
                                        marginTop: '1px',
                                        fontWeight: 600
                                    }}>
                                        {kotCount} {kotCount === 1 ? 'Order' : 'Orders'}
                                    </div>
                                )}
                            </div>

                            {/* Status Badge */}
                            <div style={{
                                backgroundColor: bg,
                                color: color,
                                padding: isMobile ? '3px 6px' : '6px 12px',
                                borderRadius: isMobile ? '6px' : '10px',
                                fontSize: isMobile ? '0.68rem' : '0.8rem',
                                fontWeight: 800,
                                width: isMobile ? '90%' : '85%',
                                marginTop: isMobile ? '4px' : 'auto',
                                letterSpacing: '0.1px'
                            }}>
                                {label}
                            </div>
                        </motion.button>
                    );
                })}

                {/* Add Custom Table Card */}
                <motion.button
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: Math.min(tables.length * 0.03, 0.4) }}
                    whileHover={{ y: -4, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAddTable}
                    style={{
                        background: 'transparent',
                        border: '2px dashed var(--color-border)',
                        borderRadius: isMobile ? '12px' : '20px',
                        padding: isMobile ? '10px 4px' : '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: isMobile ? '4px' : '12px',
                        cursor: 'pointer',
                        minHeight: isMobile ? '85px' : '160px',
                        color: 'var(--color-text-secondary)',
                        outline: 'none',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.color = 'var(--color-primary)';
                        e.currentTarget.style.background = 'var(--color-bg-secondary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                        e.currentTarget.style.background = 'transparent';
                    }}
                >
                    <div style={{
                        width: isMobile ? '24px' : '44px',
                        height: isMobile ? '24px' : '44px',
                        borderRadius: '50%',
                        border: '2px dashed var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: isMobile ? '1rem' : '1.5rem',
                        fontWeight: 600
                    }}>
                        +
                    </div>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? '0.8rem' : '1rem' }}>
                        Add Table
                    </div>
                </motion.button>
            </div>
        </div>
    );
}
