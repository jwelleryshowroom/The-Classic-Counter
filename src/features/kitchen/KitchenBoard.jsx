import React, { useMemo } from 'react';
import { useTableSessions } from '../../context/useTableSessions';
import { formatDistanceToNow } from 'date-fns';
import ProfileMenu from '../../components/ProfileMenu';
import { formatTableName } from '../../components/shared/TableStatusCard';
import { useSettings } from '../../context/SettingsContext';

export default function KitchenBoard() {
    const { sessions, updateKOTStatus } = useTableSessions();
    const { isMobile } = useSettings();

    const activeKOTs = useMemo(() => {
        let allKOTs = [];
        sessions.forEach(session => {
            if (session.kots) {
                session.kots.forEach(kot => {
                    if (kot.status !== 'served') {
                        allKOTs.push({ ...kot, tableId: session.tableId, sessionId: session.id });
                    }
                });
            }
        });
        return allKOTs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }, [sessions]);

    const handleUpdateStatus = (sessionId, kotId, currentStatus) => {
        let newStatus = currentStatus;
        if (currentStatus === 'ordered') newStatus = 'preparing';
        else if (currentStatus === 'preparing') newStatus = 'ready';
        else if (currentStatus === 'ready') newStatus = 'served'; 
        
        if (newStatus !== currentStatus) {
            updateKOTStatus(sessionId, kotId, newStatus);
        }
    };

    return (
        <div style={{ height: '100%', padding: isMobile ? '10px' : '24px', background: 'var(--color-bg-base)', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? '12px' : '24px' }}>
                <h2 style={{ margin: 0, fontWeight: 800, fontSize: isMobile ? '1.25rem' : '1.8rem' }}>Kitchen Display System</h2>
                <ProfileMenu />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: isMobile ? '8px' : '20px' }}>
                {activeKOTs.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', height: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', opacity: 0.8 }}>
                        <div style={{ fontSize: '5rem', marginBottom: '16px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.2))' }}>👨‍🍳</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '8px' }}>Kitchen is clear</div>
                        <div style={{ fontSize: '1rem' }}>No active orders at the moment.</div>
                    </div>
                ) : (
                    activeKOTs.map(kot => (
                        <div key={kot.id} style={{
                            background: 'var(--color-bg-surface)', padding: isMobile ? '8px' : '16px',
                            borderRadius: isMobile ? '8px' : '12px', border: '1px solid var(--color-border)',
                            borderTop: `4px solid ${kot.status === 'ready' ? 'var(--color-success)' : kot.status === 'preparing' ? 'var(--color-primary)' : 'var(--color-warning)'}`,
                            display: 'flex', flexDirection: 'column'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: isMobile ? '6px' : '12px' }}>
                                <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 700 }}>{formatTableName(kot.tableId)}</div>
                                <div style={{ color: 'var(--color-text-muted)', fontSize: isMobile ? '0.72rem' : '0.85rem' }}>
                                    {formatDistanceToNow(new Date(kot.createdAt), { addSuffix: true })}
                                </div>
                            </div>
                            
                            <div style={{ flex: 1, marginBottom: isMobile ? '10px' : '16px', padding: '4px 0' }}>
                                {kot.items.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', padding: isMobile ? '4px 0' : '6px 0', borderBottom: '1px dashed var(--color-border)' }}>
                                        <span style={{ fontWeight: 800, color: 'var(--color-primary)', width: isMobile ? '20px' : '30px', fontSize: isMobile ? '0.85rem' : '1rem' }}>{item.qty}x</span>
                                        <span style={{ flex: 1, marginLeft: isMobile ? '4px' : '8px', fontSize: isMobile ? '0.85rem' : '1.05rem' }}>{item.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <span style={{ fontWeight: 600, textTransform: 'uppercase', fontSize: isMobile ? '0.72rem' : '0.8rem', color: 'var(--color-text-muted)' }}>
                                    {kot.status}
                                </span>
                                {kot.status !== 'ready' && (
                                    <button
                                        onClick={() => handleUpdateStatus(kot.sessionId, kot.id, kot.status)}
                                        style={{
                                            padding: isMobile ? '6px 10px' : '10px 20px', borderRadius: '6px', border: 'none',
                                            background: kot.status === 'ordered' ? 'var(--color-primary)' : 'var(--color-success)',
                                            color: 'white', fontWeight: 700, cursor: 'pointer',
                                            fontSize: isMobile ? '0.75rem' : '0.9rem'
                                        }}
                                    >
                                        {kot.status === 'ordered' ? 'Start' : 'Ready'}
                                    </button>
                                )}
                                {kot.status === 'ready' && (
                                    <span style={{ color: 'var(--color-success)', fontWeight: 600, padding: isMobile ? '6px 0' : '10px 0', fontSize: isMobile ? '0.75rem' : '0.9rem' }}>Ready</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
