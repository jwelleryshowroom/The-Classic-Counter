import React, { useState, useMemo, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { triggerHaptic } from '../../../utils/haptics';
import { useSettings } from '../../../context/SettingsContext';
import { formatTableName } from '../../../components/shared/TableStatusCard';

export default function TableBar({ sessions, selectedTable, onSelectTable, tables = [], onAddTable }) {
    const getTableStatus = (tableId) => {
        const session = sessions.find(s => s.tableId === tableId);
        if (!session) return 'Available';
        return session.status;
    };

    return (
        <div style={{ padding: '12px 16px', background: 'var(--color-bg-base)', display: 'flex', gap: '12px', overflowX: 'auto', alignItems: 'center', minHeight: '65px' }} className="no-scrollbar">
            <div style={{ fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginRight: '8px', flexShrink: 0 }}>Active Tables</div>

            {tables.map(table => {
                const status = getTableStatus(table);
                const isSelected = selectedTable === table;

                // Color logic based on Billing.jsx
                let dotColor = 'var(--color-success)'; // Available
                if (status === 'Occupied') dotColor = 'var(--color-warning)';
                if (status === 'Billing Requested') dotColor = 'var(--color-danger)';

                return (
                    <button
                        key={table}
                        onClick={() => { triggerHaptic('light'); onSelectTable(table); }}
                        style={{
                            padding: '8px 20px', borderRadius: '12px',
                            border: `1px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            background: isSelected ? 'var(--color-bg-glass-input)' : 'var(--color-bg-surface)',
                            color: isSelected ? 'var(--color-primary)' : 'var(--color-text-primary)',
                            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                            minWidth: 'fit-content',
                            boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                            transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    >
                        <div style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: dotColor,
                            boxShadow: status === 'Billing Requested' ? '0 0 8px var(--color-danger)' : 'none'
                        }} />
                        <span style={{ fontWeight: isSelected ? 800 : 600, fontSize: '0.95rem' }}>{formatTableName(table)}</span>
                        {status === 'Billing Requested' && <span style={{ fontSize: '0.7rem', background: 'var(--color-danger)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontWeight: 700 }}>Bill Req</span>}
                    </button>
                );
            })}

            <button
                onClick={onAddTable}
                style={{
                    padding: '8px 16px', borderRadius: '12px', border: '1px dashed var(--color-border)',
                    background: 'transparent', color: 'var(--color-text-secondary)',
                    display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                    minWidth: 'fit-content', fontWeight: 600, transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-bg-secondary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
                <Plus size={16} /> Add Table
            </button>
        </div>
    );
}
