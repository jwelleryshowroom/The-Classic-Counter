import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { useToast } from '../context/useToast';
import { collection, onSnapshot, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { ArrowLeft, Users, UserPlus, Trash2, Shield, User, ShieldAlert, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import ConfirmDialog from './shared/ConfirmDialog';

const TeamManagement = ({ onClose }) => {
    const { user, businessId, businessName } = useAuth();
    const { theme } = useTheme();
    const { showToast } = useToast();
    const isDark = theme === 'dark';

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Form inputs
    const [newEmail, setNewEmail] = useState('');
    const [newName, setNewName] = useState('');
    const [newRole, setNewRole] = useState('staff'); // default staff / circuit
    const [submitting, setSubmitting] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState(null); // null or { email, title, message }

    useEffect(() => {
        if (!businessId) {
            setMembers([]);
            setLoading(false);
            return;
        }

        // Query authorized users belonging to this business
        const q = query(
            collection(db, 'authorized_users'),
            where('businessId', '==', businessId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMembers(docs);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching team members:", error);
            showToast("Failed to load team members.", "error");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [businessId]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!newEmail.trim() || !newName.trim()) {
            showToast("Please fill in all fields.", "error");
            return;
        }
        
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(newEmail.trim())) {
            showToast("Please enter a valid email address.", "error");
            return;
        }

        setSubmitting(true);
        try {
            const targetEmail = newEmail.trim().toLowerCase();
            const memberRef = doc(db, 'authorized_users', targetEmail);
            
            await setDoc(memberRef, {
                email: targetEmail,
                name: newName.trim(),
                role: newRole,
                businessId: businessId,
                businessName: businessName,
                createdAt: new Date().toISOString()
            });

            showToast("Team member added successfully!", "success");
            setNewEmail('');
            setNewName('');
            setNewRole('staff');
        } catch (error) {
            console.error("Error adding team member:", error);
            showToast("Failed to add team member.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveMember = (memberEmail) => {
        if (memberEmail.toLowerCase() === user.email.toLowerCase()) {
            showToast("You cannot remove yourself!", "error");
            return;
        }

        setConfirmDialog({
            email: memberEmail,
            title: 'Remove Team Member',
            message: `Are you sure you want to remove ${memberEmail} from the team? They will immediately lose access to ${businessName || 'the workspace'}.`
        });
    };

    const executeRemoveMember = async (memberEmail) => {
        try {
            await deleteDoc(doc(db, 'authorized_users', memberEmail));
            showToast("Member removed from team.", "success");
        } catch (error) {
            console.error("Error removing member:", error);
            showToast("Failed to remove member.", "error");
        }
    };

    const getRoleBadge = (role) => {
        switch (role) {
            case 'admin':
                return {
                    label: 'Munna Bhai 🕶️',
                    bg: 'rgba(234, 179, 8, 0.15)',
                    color: isDark ? '#facc15' : '#b45309',
                    border: '1px solid rgba(234, 179, 8, 0.3)'
                };
            case 'staff':
                return {
                    label: 'Circuit 🔌',
                    bg: 'rgba(59, 130, 246, 0.15)',
                    color: isDark ? '#60a5fa' : '#1d4ed8',
                    border: '1px solid rgba(59, 130, 246, 0.3)'
                };
            case 'guest':
            default:
                return {
                    label: 'Mamu 🤕',
                    bg: 'rgba(239, 68, 68, 0.15)',
                    color: isDark ? '#f87171' : '#dc2626',
                    border: '1px solid rgba(239, 68, 68, 0.3)'
                };
        }
    };

    return (
        <motion.div
            key="team"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '16px 24px',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <motion.button
                    whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    style={{
                        background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
                        color: 'var(--color-text-main)', cursor: 'pointer', padding: '7px',
                        borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={18} />
                </motion.button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} color="#8b5cf6" /> Team Management
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Manage access levels for {businessName}</div>
                </div>
            </div>

            {/* Content Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '28px' }} className="hide-scrollbar">
                
                {/* Form to Add Member */}
                <div style={{ padding: '20px', background: 'var(--color-bg-secondary)', borderRadius: '20px', border: '1px solid var(--color-border)' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem', fontWeight: 800, margin: '0 0 16px', color: 'var(--color-text-main)' }}>
                        <UserPlus size={18} color="var(--color-primary)" /> Add Team Member
                    </h3>

                    <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Name</label>
                            <input 
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Joy"
                                style={styles.input}
                                disabled={submitting}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Email Address</label>
                            <input 
                                type="email"
                                value={newEmail}
                                onChange={(e) => setNewEmail(e.target.value)}
                                placeholder="e.g. joy@example.com"
                                style={styles.input}
                                disabled={submitting}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Role / Access Level</label>
                            <select
                                value={newRole}
                                onChange={(e) => setNewRole(e.target.value)}
                                style={styles.select}
                                disabled={submitting}
                            >
                                <option value="guest">Mamu 🤕 (View Only)</option>
                                <option value="staff">Circuit 🔌 (Waiter / Order Operator)</option>
                                <option value="admin">Munna Bhai 🕶️ (Business Co-Owner)</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting}
                            style={{
                                width: '100%', padding: '12px', borderRadius: '12px',
                                background: 'var(--color-primary)', color: 'white', border: 'none',
                                fontWeight: 700, cursor: 'pointer', transition: 'opacity 0.2s',
                                opacity: submitting ? 0.7 : 1, marginTop: '8px'
                            }}
                        >
                            Add Team Member
                        </button>
                    </form>
                </div>

                {/* Team List */}
                <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, margin: '0 0 16px', color: 'var(--color-text-main)' }}>
                        Active Members ({members.length})
                    </h3>

                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : members.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            No other team members found.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {members.map(member => {
                                const badge = getRoleBadge(member.role);
                                const isSelf = member.email.toLowerCase() === user.email.toLowerCase();

                                return (
                                    <div 
                                        key={member.id} 
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '16px', borderRadius: '18px',
                                            background: isDark ? 'rgba(255,255,255,0.02)' : 'var(--color-bg-base)',
                                            border: '1px solid var(--color-border)'
                                        }}
                                    >
                                        <div style={{
                                            padding: '10px', borderRadius: '12px',
                                            background: 'var(--color-bg-secondary)', color: 'var(--color-text-muted)'
                                        }}>
                                            {member.role === 'admin' ? <Award size={20} color="#f59e0b" /> : <User size={20} />}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text-main)' }}>{member.name}</span>
                                                {isSelf && <span style={{ fontSize: '0.7rem', color: 'var(--color-success)', fontWeight: 700, textTransform: 'uppercase' }}>(You)</span>}
                                            </div>
                                            <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                                {member.email}
                                            </div>
                                            
                                            {/* Role Badge */}
                                            <div style={{
                                                display: 'inline-block',
                                                padding: '2px 8px', borderRadius: '6px',
                                                background: badge.bg, color: badge.color, border: badge.border,
                                                fontSize: '0.72rem', fontWeight: 700, marginTop: '8px'
                                            }}>
                                                {badge.label}
                                            </div>
                                        </div>

                                        {!isSelf && (
                                            <button 
                                                onClick={() => handleRemoveMember(member.email)}
                                                style={{
                                                    padding: '8px', borderRadius: '10px', border: 'none',
                                                    background: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            <ConfirmDialog 
                isOpen={!!confirmDialog}
                onClose={() => setConfirmDialog(null)}
                onConfirm={() => {
                    executeRemoveMember(confirmDialog.email);
                    setConfirmDialog(null);
                }}
                title={confirmDialog?.title || ''}
                message={confirmDialog?.message || ''}
                confirmText="Remove Member"
                cancelText="Keep Member"
                type="danger"
            />
        </motion.div>
    );
};

const styles = {
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        color: 'var(--color-text-main)',
        fontSize: '0.9rem',
        outline: 'none'
    },
    select: {
        width: '100%',
        padding: '10px 14px',
        background: 'var(--color-bg-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: '10px',
        color: 'var(--color-text-main)',
        fontSize: '0.9rem',
        outline: 'none',
        cursor: 'pointer'
    }
};

export default TeamManagement;
