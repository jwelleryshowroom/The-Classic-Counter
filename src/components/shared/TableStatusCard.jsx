import React from 'react';

/**
 * Format tableId ("T1" -> "Table 1", "1" -> "Table 1")
 */
export const formatTableName = (tableId) => {
    if (!tableId) return 'Table ?';
    const num = String(tableId).replace(/^T/i, '');
    return `Table ${num}`;
};

/**
 * Derive a human-readable status from a session's KOT data.
 * KOT statuses: ordered -> preparing -> ready -> served
 *
 * Priority:
 * 1. Billing Requested  (session-level flag)
 * 2. Ready ✓            (all active KOTs are ready)
 * 3. Preparing          (some KOTs are ordered/preparing)
 * 4. Served             (all KOTs served — session should close soon)
 * 5. Occupied           (session exists but no KOTs yet)
 */
export const deriveTableStatus = (session) => {
    if (!session || session.status === 'Available') {
        return { label: 'Available', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    }

    if (session.status === 'Billing Requested') {
        return { label: 'Bill Req.', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' };
    }

    const kots = session.kots || [];

    if (kots.length === 0) {
        return { label: 'Occupied', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
    }

    const activeKOTs = kots.filter(k => k.status !== 'served');

    // All served
    if (activeKOTs.length === 0) {
        return { label: 'Served', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    }

    // All active KOTs are ready (kitchen marked them ready)
    const allReady = activeKOTs.every(k => k.status === 'ready');
    if (allReady) {
        return { label: 'Ready ✓', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
    }

    // Some are being prepared
    const somePrep = activeKOTs.some(k => k.status === 'preparing');
    if (somePrep) {
        return { label: 'Preparing', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' };
    }

    // All ordered, not yet started
    return { label: 'Ordered', color: '#818cf8', bg: 'rgba(129, 140, 248, 0.12)' };
};

/**
 * Shared TableStatusCard — real-time table status tile.
 * Used in: Dashboard (DesktopHome), Waiter (TableBar), and can be used anywhere.
 */
const TableStatusCard = ({
    session,
    onClick,
    isDark = true,
    glassCardStyle = {},
    glassTextStyle,
    glassSubTextStyle,
}) => {
    const { label, color, bg } = deriveTableStatus(session);
    const tableName = formatTableName(session.tableId);
    const kotCount = (session.kots || []).length;

    const textColor = glassTextStyle || (isDark ? '#ffffff' : '#27272a');
    const subTextColor = glassSubTextStyle || (isDark ? '#a1a1aa' : '#71717a');

    const baseCard = {
        borderRadius: '16px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        minHeight: '140px',
        ...(isDark
            ? {
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.09)',
                  backdropFilter: 'blur(12px)',
              }
            : {
                  backgroundColor: 'white',
                  border: '1px solid #f4f4f5',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
              }),
        ...glassCardStyle,
    };

    return (
        <div onClick={onClick} style={baseCard} className="table-status-card">
            {/* Accent top-bar showing status color */}
            <div style={{
                position: 'absolute',
                top: 0, left: '20%', right: '20%', height: '3px',
                borderRadius: '0 0 4px 4px',
                background: color,
                opacity: 0.85,
            }} />

            {/* Table Name + KOT count */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: textColor, letterSpacing: '-0.5px' }}>
                        {tableName}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: subTextColor, marginTop: '4px' }}>
                        {kotCount} {kotCount === 1 ? 'Order' : 'Orders'}
                    </div>
                </div>
            </div>

            {/* Status Badge */}
            <div style={{
                backgroundColor: bg,
                color: color,
                padding: '7px 0',
                borderRadius: '10px',
                fontSize: '0.82rem',
                fontWeight: 700,
                textAlign: 'center',
                width: '100%',
                letterSpacing: '0.2px',
            }}>
                {label}
            </div>

            <style>{`
                .table-status-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.2);
                }
            `}</style>
        </div>
    );
};

export default TableStatusCard;
