import React, { useState } from 'react';
import { format } from 'date-fns';
import { ChevronUp, ChevronDown, CheckCircle, Clock, PlayCircle } from 'lucide-react';

export default function KOTHistory({ kots, onRequestBill, status }) {
    const [expanded, setExpanded] = useState(false);

    const getStatusIcon = (status) => {
        switch(status) {
            case 'ordered': return <Clock size={14} color="var(--color-warning)" />;
            case 'preparing': return <PlayCircle size={14} color="var(--color-primary)" />;
            case 'ready': return <CheckCircle size={14} color="var(--color-success)" />;
            case 'served': return <CheckCircle size={14} color="var(--color-text-muted)" />;
            default: return null;
        }
    };

    const isBillRequested = status === 'Billing Requested';

    return (
        <div style={{
            position: 'absolute', bottom: '70px', left: 0, right: 0, // Above BottomNav
            background: 'var(--color-bg-surface)', borderTop: '1px solid var(--color-border)',
            boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
            zIndex: 10
        }}>
            <div 
                onClick={() => setExpanded(!expanded)}
                style={{
                    padding: '12px 24px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', cursor: 'pointer', fontWeight: 600
                }}
            >
                <span>KOT History ({kots.length} batches sent)</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                </div>
            </div>

            {expanded && (
                <div style={{ padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }} className="hide-scrollbar">
                        {kots.map((kot, index) => (
                            <div key={kot.id} style={{
                                minWidth: '200px', background: 'var(--color-bg-base)',
                                padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '8px' }}>
                                    <span>KOT #{index + 1}</span>
                                    <span>{format(new Date(kot.createdAt), 'hh:mm a')}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
                                    {getStatusIcon(kot.status)}
                                    <span style={{ textTransform: 'capitalize' }}>{kot.status}</span>
                                </div>
                                <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {kot.items.map((item, i) => (
                                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span>{item.qty} x {item.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={onRequestBill}
                        disabled={isBillRequested}
                        style={{
                            padding: '12px', borderRadius: '8px', border: 'none',
                            background: isBillRequested ? 'var(--color-bg-secondary)' : 'var(--color-danger)',
                            color: isBillRequested ? 'var(--color-text-muted)' : 'white',
                            fontWeight: 600, cursor: isBillRequested ? 'not-allowed' : 'pointer',
                            textAlign: 'center'
                        }}
                    >
                        {isBillRequested ? 'Bill Requested' : 'Request Bill for Table'}
                    </button>
                </div>
            )}
        </div>
    );
}
