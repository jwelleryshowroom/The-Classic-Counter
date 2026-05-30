import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { useAuth } from '../context/useAuth';
import { useToast } from '../context/useToast';
import { collection, onSnapshot, doc, getDoc, setDoc, updateDoc, getDocs, query, where, writeBatch, deleteDoc } from 'firebase/firestore';
import { Building, Users, Clock, CheckCircle, XCircle, LogOut, Check, X, Shield, Landmark, AlertTriangle, Database } from 'lucide-react';
import ConfirmDialog from './shared/ConfirmDialog';

const AdminConsole = () => {
    const { logout, user, impersonateBusiness } = useAuth();
    const { showToast } = useToast();
    
    const [applications, setApplications] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [usersCount, setUsersCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'businesses'

    // Modal state for rejection feedback
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingApp, setRejectingApp] = useState(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [migrationTargetId, setMigrationTargetId] = useState('biz_tc6b61d1');

    // Theme-based confirmation pop-up state
    const [confirmDialog, setConfirmDialog] = useState(null); // null or { title, message, confirmText, cancelText, onConfirm, type }

    useEffect(() => {
        // 1. Listen to all applications
        const unsubscribeApps = onSnapshot(collection(db, 'business_applications'), (snapshot) => {
            const apps = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setApplications(apps);
        }, (error) => {
            console.error("Error syncing applications:", error);
        });

        // 2. Listen to registered businesses
        const unsubscribeBiz = onSnapshot(collection(db, 'businesses'), (snapshot) => {
            const biz = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBusinesses(biz);
        }, (error) => {
            console.error("Error syncing businesses:", error);
        });

        // 3. Fetch count of authorized users
        const fetchUsersCount = async () => {
            try {
                const snap = await getDocs(collection(db, 'authorized_users'));
                setUsersCount(snap.size);
            } catch (err) {
                console.error(err);
            }
        };

        fetchUsersCount();
        setLoading(false);

        return () => {
            unsubscribeApps();
            unsubscribeBiz();
        };
    }, []);

    // Approve logic execution
    const executeApproval = async (app) => {
        try {
            // 1. Generate Business ID
            const businessId = 'biz_' + Math.random().toString(36).substring(2, 10);
            const timestamp = new Date().toISOString();
            
            // 2. Create Business Document
            await setDoc(doc(db, 'businesses', businessId), {
                id: businessId,
                name: app.businessName,
                type: app.type,
                phone: app.phone,
                ownerEmail: app.email,
                status: 'approved',
                createdAt: timestamp
            });

            // 3. Create Settings Document for this Business
            await setDoc(doc(db, 'businesses', businessId, 'settings', 'config'), {
                businessInfo: {
                    businessName: app.businessName,
                    businessPhone: app.phone,
                    businessAddress: app.address || '',
                    street: app.street || '',
                    landmark: app.landmark || '',
                    city: app.city || '',
                    state: app.state || '',
                    pin: app.pin || '',
                    businessFooter: app.billFooter || 'Thank you for visiting!',
                    googleMapLink: app.googleMapLink || '',
                    publicUrl: app.publicUrl || ''
                },
                waiterTableCount: 5,
                masterCategoryOrder: [],
                cashierName: app.name || 'Owner'
            });

            // 4. Add User to authorized_users with role admin
            await setDoc(doc(db, 'authorized_users', app.email), {
                email: app.email,
                name: app.name || 'Business Owner',
                role: 'admin',
                businessId: businessId,
                businessName: app.businessName,
                createdAt: timestamp
            });

            // 5. Update Application Status to approved
            await updateDoc(doc(db, 'business_applications', app.email), {
                status: 'approved',
                businessId: businessId,
                approvedAt: timestamp
            });

            showToast(`Business "${app.businessName}" approved successfully!`, "success");
        } catch (error) {
            console.error("Approval error:", error);
            showToast("Failed to approve business.", "error");
        }
    };

    // Trigger Custom Approve Confirm Modal
    const handleApprove = (app) => {
        setConfirmDialog({
            title: 'Approve Application',
            message: `Are you sure you want to approve the application for "${app.businessName}"? This will create their workspace and grant admin permissions.`,
            confirmText: 'Approve Workspace',
            cancelText: 'Cancel',
            type: 'success',
            onConfirm: () => {
                executeApproval(app);
                setConfirmDialog(null);
            }
        });
    };

    // Open reject modal
    const openReject = (app) => {
        setRejectingApp(app);
        setFeedbackText('');
        setShowRejectModal(true);
    };

    // Confirm reject handler
    const handleRejectConfirm = async () => {
        if (!rejectingApp) return;

        try {
            await updateDoc(doc(db, 'business_applications', rejectingApp.email), {
                status: 'rejected',
                feedback: feedbackText.trim() || 'Details provided were insufficient.',
                rejectedAt: new Date().toISOString()
            });

            setShowRejectModal(false);
            setRejectingApp(null);
            showToast(`Application for "${rejectingApp.businessName}" discarded.`, "info");
        } catch (error) {
            console.error("Rejection error:", error);
            showToast("Failed to reject application.", "error");
        }
    };

    const handleMigrationClick = () => {
        const target = migrationTargetId.trim();
        if (!target) {
            showToast("Please enter a valid Target Business ID.", "error");
            return;
        }

        setConfirmDialog({
            title: 'Migrate Legacy Data',
            message: `Are you sure you want to transfer all legacy data (documents without a business ID) to "${target}"? This will update transactions, menu items, table sessions, and customers.`,
            confirmText: 'Start Migration',
            cancelText: 'Cancel',
            type: 'warning',
            onConfirm: () => {
                executeMigration(target);
                setConfirmDialog(null);
            }
        });
    };

    const executeMigration = async (targetId) => {
        let transactionsMigrated = 0;
        let inventoryMigrated = 0;
        let customersMigrated = 0;
        let sessionsMigrated = 0;
        let settingsMigrated = false;
        
        try {
            showToast("Migration started... Please do not close or reload the browser.", "info");

            // 1. Migrate Transactions
            const txSnap = await getDocs(collection(db, 'transactions'));
            let txCount = 0;
            let txBatch = writeBatch(db);
            let txOps = 0;

            for (const d of txSnap.docs) {
                const data = d.data();
                const docBizId = data.businessId || null;
                if (!docBizId || docBizId === targetId) {
                    const newDocRef = doc(db, 'businesses', targetId, 'transactions', d.id);
                    txBatch.set(newDocRef, { ...data, businessId: targetId });
                    txBatch.delete(doc(db, 'transactions', d.id));
                    txCount++;
                    txOps += 2;
                    
                    if (txOps >= 400) {
                        await txBatch.commit();
                        txBatch = writeBatch(db);
                        txOps = 0;
                    }
                }
            }
            if (txOps > 0) {
                await txBatch.commit();
            }
            transactionsMigrated = txCount;

            // 2. Migrate Inventory Items
            const invSnap = await getDocs(collection(db, 'inventory_items'));
            let invCount = 0;
            let invBatch = writeBatch(db);
            let invOps = 0;

            for (const d of invSnap.docs) {
                const data = d.data();
                const docBizId = data.businessId || null;
                if (!docBizId || docBizId === targetId) {
                    const newDocRef = doc(db, 'businesses', targetId, 'inventory_items', d.id);
                    invBatch.set(newDocRef, { ...data, businessId: targetId });
                    invBatch.delete(doc(db, 'inventory_items', d.id));
                    invCount++;
                    invOps += 2;
                    
                    if (invOps >= 400) {
                        await invBatch.commit();
                        invBatch = writeBatch(db);
                        invOps = 0;
                    }
                }
            }
            if (invOps > 0) {
                await invBatch.commit();
            }
            inventoryMigrated = invCount;

            // 3. Migrate Table Sessions
            const sessSnap = await getDocs(collection(db, 'tableSessions'));
            let sessCount = 0;
            let sessBatch = writeBatch(db);
            let sessOps = 0;

            for (const d of sessSnap.docs) {
                const data = d.data();
                const docBizId = data.businessId || null;
                if (!docBizId || docBizId === targetId) {
                    const newDocRef = doc(db, 'businesses', targetId, 'tableSessions', d.id);
                    sessBatch.set(newDocRef, { ...data, businessId: targetId });
                    sessBatch.delete(doc(db, 'tableSessions', d.id));
                    sessCount++;
                    sessOps += 2;
                    
                    if (sessOps >= 400) {
                        await sessBatch.commit();
                        sessBatch = writeBatch(db);
                        sessOps = 0;
                    }
                }
            }
            if (sessOps > 0) {
                await sessBatch.commit();
            }
            sessionsMigrated = sessCount;

            // 4. Migrate Customers
            const custSnap = await getDocs(collection(db, 'customers'));
            let custCount = 0;
            let custBatch = writeBatch(db);
            let custOps = 0;

            for (const d of custSnap.docs) {
                const data = d.data();
                const docBizId = data.businessId || null;
                const docId = d.id;
                if (!docBizId || docBizId === targetId || docId.startsWith(`${targetId}_`)) {
                    const phone = data.phone || docId.split('_').pop();
                    if (phone && phone.length === 10) {
                        const newDocRef = doc(db, 'businesses', targetId, 'customers', phone);
                        custBatch.set(newDocRef, {
                            ...data,
                            businessId: targetId,
                            phone: phone
                        });
                        custBatch.delete(doc(db, 'customers', docId));
                        custCount++;
                        custOps += 2;

                        if (custOps >= 400) {
                            await custBatch.commit();
                            custBatch = writeBatch(db);
                            custOps = 0;
                        }
                    }
                }
            }
            if (custOps > 0) {
                await custBatch.commit();
            }
            customersMigrated = custCount;

            // 5. Migrate Settings Config
            const oldSettingsRef = doc(db, 'settings', targetId);
            const settingsSnap = await getDoc(oldSettingsRef);
            if (settingsSnap.exists()) {
                await setDoc(doc(db, 'businesses', targetId, 'settings', 'config'), settingsSnap.data());
                await deleteDoc(oldSettingsRef);
                settingsMigrated = true;
            }

            showToast(`Migration complete! Migrated ${transactionsMigrated} transactions, ${inventoryMigrated} items, ${sessionsMigrated} table sessions, ${customersMigrated} customer records, and settings: ${settingsMigrated ? 'YES' : 'NO'}.`, "success");
            setMigrationTargetId('');
        } catch (error) {
            console.error("Migration error:", error);
            showToast(`Migration failed: ${error.message}`, "error");
        }
    };

    const pendingApps = applications.filter(a => a.status === 'pending');
    const totalBusinesses = businesses.length;

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerTitleGroup}>
                    <div style={styles.headerIcon}>
                        <Landmark size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={styles.headerTitle}>The Classic Counter</h1>
                        <p style={styles.headerSubtitle}>Super Admin Control Panel</p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={styles.userBadge}>
                        <Shield size={14} color="#22c55e" />
                        <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>{user.email}</span>
                    </div>
                    <button onClick={logout} style={styles.logoutBtn}>
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </header>

            {/* Dashboard Stats */}
            <section style={styles.statsSection}>
                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconBadge, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
                        <Clock size={24} />
                    </div>
                    <div>
                        <div style={styles.statVal}>{pendingApps.length}</div>
                        <div style={styles.statLabel}>Pending Requests</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconBadge, backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <Building size={24} />
                    </div>
                    <div>
                        <div style={styles.statVal}>{totalBusinesses}</div>
                        <div style={styles.statLabel}>Approved Businesses</div>
                    </div>
                </div>

                <div style={styles.statCard}>
                    <div style={{ ...styles.statIconBadge, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <div style={styles.statVal}>{usersCount}</div>
                        <div style={styles.statLabel}>Total Staff Users</div>
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <div style={styles.tabsContainer}>
                <button 
                    onClick={() => setActiveTab('pending')}
                    style={{
                        ...styles.tabBtn,
                        color: activeTab === 'pending' ? '#22c55e' : '#a3a3a3',
                        borderBottom: activeTab === 'pending' ? '2px solid #22c55e' : '2px solid transparent'
                    }}
                >
                    Pending Requests ({pendingApps.length})
                </button>
                <button 
                    onClick={() => setActiveTab('businesses')}
                    style={{
                        ...styles.tabBtn,
                        color: activeTab === 'businesses' ? '#22c55e' : '#a3a3a3',
                        borderBottom: activeTab === 'businesses' ? '2px solid #22c55e' : '2px solid transparent'
                    }}
                >
                    Approved Businesses ({totalBusinesses})
                </button>
            </div>

            {/* Content list */}
            <main style={styles.mainContent}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <div className="spinner"></div>
                    </div>
                ) : activeTab === 'pending' ? (
                    pendingApps.length === 0 ? (
                        <div style={styles.emptyState}>
                            <CheckCircle size={48} color="#22c55e" style={{ marginBottom: '12px' }} />
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>All caught up!</div>
                            <div style={{ fontSize: '0.85rem', color: '#a3a3a3', marginTop: '4px' }}>No pending applications waiting for review.</div>
                        </div>
                    ) : (
                        <div style={styles.grid}>
                            {pendingApps.map(app => (
                                <div key={app.id} style={styles.appCard}>
                                    <div style={styles.appCardHeader}>
                                        <div>
                                            <h3 style={styles.appCardTitle}>{app.businessName}</h3>
                                            <span style={styles.appTypeBadge}>{app.type}</span>
                                        </div>
                                        <div style={styles.appDate}>{new Date(app.createdAt).toLocaleDateString()}</div>
                                    </div>
                                    
                                    <div style={styles.appCardBody}>
                                        <div style={styles.infoLine}>
                                            <strong>Applicant:</strong> {app.name} ({app.email})
                                        </div>
                                        <div style={styles.infoLine}>
                                            <strong>Phone:</strong> {app.phone}
                                        </div>
                                        {app.address && (
                                            <div style={styles.infoLine}>
                                                <strong>Address:</strong> {app.address}
                                            </div>
                                        )}
                                        {app.billFooter && (
                                            <div style={styles.infoLine}>
                                                <strong>Bill Footer:</strong> {app.billFooter}
                                            </div>
                                        )}
                                        {app.googleMapLink && (
                                            <div style={styles.infoLine}>
                                                <strong>Map Link:</strong> <a href={app.googleMapLink} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'underline' }}>View Map</a>
                                            </div>
                                        )}
                                        {app.publicUrl && (
                                            <div style={styles.infoLine}>
                                                <strong>Public URL:</strong> <a href={app.publicUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#22c55e', textDecoration: 'underline' }}>{app.publicUrl}</a>
                                            </div>
                                        )}
                                        {app.notes && (
                                            <div style={{ ...styles.infoLine, marginTop: '8px', padding: '10px', background: '#242424', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                <strong>Notes:</strong> {app.notes}
                                            </div>
                                        )}
                                    </div>

                                    <div style={styles.appCardActions}>
                                        <button onClick={() => handleApprove(app)} style={styles.approveBtn}>
                                            <Check size={16} /> Approve
                                        </button>
                                        <button onClick={() => openReject(app)} style={styles.discardBtn}>
                                            <X size={16} /> Discard
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    businesses.length === 0 ? (
                        <div style={styles.emptyState}>
                            <Building size={48} color="#a3a3a3" style={{ marginBottom: '12px' }} />
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#ffffff' }}>No businesses registered</div>
                            <div style={{ fontSize: '0.85rem', color: '#a3a3a3', marginTop: '4px' }}>Approved business dashboards will appear here.</div>
                        </div>
                    ) : (
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Business Name</th>
                                        <th style={styles.th}>Type</th>
                                        <th style={styles.th}>Business ID</th>
                                        <th style={styles.th}>Owner Email</th>
                                        <th style={styles.th}>Phone</th>
                                        <th style={styles.th}>Approved Date</th>
                                        <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {businesses.map(biz => (
                                        <tr key={biz.id} style={styles.tr}>
                                            <td style={{ ...styles.td, fontWeight: 700, color: '#ffffff' }}>{biz.name}</td>
                                            <td style={styles.td}>{biz.type}</td>
                                            <td style={{ ...styles.td, fontFamily: 'monospace', color: '#22c55e' }}>{biz.id}</td>
                                            <td style={styles.td}>{biz.ownerEmail}</td>
                                            <td style={styles.td}>{biz.phone}</td>
                                            <td style={styles.td}>{biz.createdAt ? new Date(biz.createdAt).toLocaleDateString() : 'N/A'}</td>
                                            <td style={{ ...styles.td, textAlign: 'right' }}>
                                                <button
                                                    onClick={() => impersonateBusiness(biz.id, biz.name)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                                        color: '#22c55e',
                                                        border: '1px solid rgba(34, 197, 94, 0.3)',
                                                        borderRadius: '8px',
                                                        fontWeight: 700,
                                                        fontSize: '0.8rem',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '4px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                                                    }}
                                                >
                                                    👁️ View Dashboard
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )
                )}
            </main>

            {/* Legacy Data Migration Utility */}
            <section style={{ ...styles.statsSection, gridTemplateColumns: '1fr', marginTop: '32px', width: '100%', maxWidth: '1200px' }}>
                <div style={{ ...styles.statCard, flexDirection: 'column', alignItems: 'flex-start', gap: '16px', padding: '28px', background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ ...styles.statIconBadge, backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', width: '44px', height: '44px', borderRadius: '12px' }}>
                            <Database size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>Legacy Data Migration Tool</h3>
                            <p style={{ fontSize: '0.85rem', color: '#a3a3a3', margin: '4px 0 0' }}>Transfer legacy documents (lacking `businessId`) to a newly approved workspace.</p>
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', width: '100%', maxWidth: '600px', marginTop: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a3a3a3', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Target Business ID</label>
                            <input 
                                type="text"
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    backgroundColor: '#242424',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    color: '#ffffff',
                                    fontSize: '0.9rem',
                                    outline: 'none',
                                    width: '100%',
                                    fontFamily: 'monospace'
                                }}
                                placeholder="e.g. biz_tc6b61d1"
                                value={migrationTargetId}
                                onChange={(e) => setMigrationTargetId(e.target.value)}
                            />
                        </div>
                        <button 
                            onClick={handleMigrationClick}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                height: '45px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#4f46e5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#6366f1'}
                        >
                            <Database size={16} /> Run Migration
                        </button>
                    </div>
                </div>
            </section>

            {/* Rejection Feedback Modal */}
            {showRejectModal && rejectingApp && (
                <div style={styles.modalBackdrop}>
                    <div style={styles.modalCard}>
                        <h2 style={{ fontSize: '1.25rem', color: '#ffffff', margin: '0 0 12px' }}>Discard Application</h2>
                        <p style={{ fontSize: '0.9rem', color: '#a3a3a3', lineHeight: 1.5, margin: '0 0 20px' }}>
                            You are about to discard the application for <strong>{rejectingApp.businessName}</strong>. 
                            Please specify a brief reason/feedback so the applicant can correct and re-apply:
                        </p>
                        
                        <textarea
                            style={styles.modalTextarea}
                            placeholder="e.g. Please provide a valid 10-digit mobile number, or clarify additional notes..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                        />

                        <div style={styles.modalActions}>
                            <button onClick={handleRejectConfirm} style={styles.modalRejectBtn}>
                                Discard Request
                            </button>
                            <button onClick={() => setShowRejectModal(false)} style={styles.modalCancelBtn}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Theme-based Confirmation Dialog Modal */}
            <ConfirmDialog
                isOpen={!!confirmDialog}
                onClose={() => setConfirmDialog(null)}
                onConfirm={confirmDialog?.onConfirm || (() => {})}
                title={confirmDialog?.title || ''}
                message={confirmDialog?.message || ''}
                confirmText={confirmDialog?.confirmText || 'Confirm'}
                cancelText={confirmDialog?.cancelText || 'Cancel'}
                type={confirmDialog?.type || 'warning'}
            />
        </div>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        width: '100vw',
        background: '#121212',
        color: '#e5e5e5',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 24px 60px'
    },
    header: {
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 0',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
    },
    headerTitleGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
    },
    headerIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '12px',
        background: '#22c55e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
    },
    headerTitle: {
        fontSize: '1.3rem',
        fontWeight: 800,
        margin: 0,
        color: '#ffffff',
        lineHeight: 1.2
    },
    headerSubtitle: {
        fontSize: '0.8rem',
        color: '#a3a3a3',
        margin: 0
    },
    userBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)'
    },
    logoutBtn: {
        padding: '8px 16px',
        backgroundColor: '#242424',
        border: '1px solid rgba(255,255,255,0.06)',
        color: '#a3a3a3',
        borderRadius: '10px',
        fontWeight: 600,
        fontSize: '0.85rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    statsSection: {
        width: '100%',
        maxWidth: '1200px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginTop: '32px'
    },
    statCard: {
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px'
    },
    statIconBadge: {
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    statVal: {
        fontSize: '1.75rem',
        fontWeight: 800,
        color: '#ffffff',
        lineHeight: 1.1
    },
    statLabel: {
        fontSize: '0.85rem',
        color: '#a3a3a3',
        marginTop: '4px',
        fontWeight: 500
    },
    tabsContainer: {
        width: '100%',
        maxWidth: '1200px',
        display: 'flex',
        gap: '24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        marginTop: '40px'
    },
    tabBtn: {
        padding: '12px 8px',
        background: 'transparent',
        border: 'none',
        fontSize: '1rem',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.2s'
    },
    mainContent: {
        width: '100%',
        maxWidth: '1200px',
        marginTop: '28px'
    },
    emptyState: {
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '60px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: '24px'
    },
    appCard: {
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        transition: 'all 0.2s'
    },
    appCardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
        paddingBottom: '12px'
    },
    appCardTitle: {
        fontSize: '1.15rem',
        fontWeight: 800,
        color: '#ffffff',
        margin: '0 0 6px'
    },
    appTypeBadge: {
        fontSize: '0.72rem',
        background: 'rgba(34, 197, 94, 0.1)',
        color: '#22c55e',
        padding: '3px 8px',
        borderRadius: '6px',
        fontWeight: 700,
        textTransform: 'uppercase'
    },
    appDate: {
        fontSize: '0.75rem',
        color: '#737373'
    },
    appCardBody: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        fontSize: '0.88rem',
        color: '#d4d4d4'
    },
    infoLine: {
        lineHeight: 1.5
    },
    appCardActions: {
        display: 'flex',
        gap: '12px',
        marginTop: 'auto',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.04)'
    },
    approveBtn: {
        flex: 1,
        padding: '10px',
        backgroundColor: '#22c55e',
        color: 'white',
        border: 'none',
        borderRadius: '10px',
        fontWeight: 700,
        fontSize: '0.88rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        boxShadow: '0 4px 10px rgba(34, 197, 94, 0.15)',
        transition: 'all 0.2s'
    },
    discardBtn: {
        flex: 1,
        padding: '10px',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        border: '1px solid rgba(239, 68, 68, 0.2)',
        borderRadius: '10px',
        fontWeight: 700,
        fontSize: '0.88rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        transition: 'all 0.2s'
    },
    tableWrapper: {
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '20px',
        overflowX: 'auto'
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        textAlign: 'left'
    },
    th: {
        padding: '16px 20px',
        background: '#1f1f1f',
        fontSize: '0.8rem',
        fontWeight: 700,
        color: '#a3a3a3',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
    },
    td: {
        padding: '16px 20px',
        fontSize: '0.9rem',
        color: '#d4d4d4',
        borderBottom: '1px solid rgba(255,255,255,0.04)'
    },
    tr: {
        transition: 'background 0.2s',
        ':hover': {
            background: 'rgba(255,255,255,0.01)'
        }
    },
    modalBackdrop: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 30000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
    },
    modalCard: {
        background: '#1a1a1a',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '24px',
        padding: '28px',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
    },
    modalTextarea: {
        width: '100%',
        height: '110px',
        background: '#242424',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        color: '#ffffff',
        padding: '12px',
        fontSize: '0.9rem',
        outline: 'none',
        resize: 'none',
        fontFamily: 'inherit',
        marginTop: '8px'
    },
    modalActions: {
        display: 'flex',
        gap: '12px',
        marginTop: '24px'
    },
    modalRejectBtn: {
        flex: 1.2,
        padding: '12px',
        backgroundColor: '#ef4444',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontWeight: 700,
        fontSize: '0.9rem',
        cursor: 'pointer'
    },
    modalCancelBtn: {
        flex: 0.8,
        padding: '12px',
        backgroundColor: '#242424',
        color: '#a3a3a3',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '12px',
        fontWeight: 600,
        fontSize: '0.9rem',
        cursor: 'pointer'
    }
};

export default AdminConsole;
