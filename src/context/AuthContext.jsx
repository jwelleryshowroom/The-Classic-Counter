import React, { useEffect, useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { AuthContext } from './AuthContextDef';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(null);

    // Multi-tenant States
    const [role, setRole] = useState('guest');
    const [businessId, setBusinessId] = useState(null);
    const [businessName, setBusinessName] = useState('');
    const [application, setApplication] = useState(null);

    const login = () => {
        return signInWithPopup(auth, googleProvider);
    };

    const logout = () => {
        return signOut(auth);
    };

    // Submitting a new business application
    const submitApplication = async (details) => {
        if (!user) return;
        try {
            const { doc, setDoc } = await import('firebase/firestore');
            const appRef = doc(db, "business_applications", user.email);
            const appData = {
                email: user.email,
                name: user.displayName || user.email.split('@')[0],
                businessName: details.businessName,
                phone: details.phone,
                type: details.type,
                notes: details.notes || '',
                address: details.address || '',
                billFooter: details.billFooter || '',
                googleMapLink: details.googleMapLink || '',
                publicUrl: details.publicUrl || '',
                status: 'pending',
                createdAt: new Date().toISOString()
            };
            await setDoc(appRef, appData);
            setApplication(appData);
        } catch (error) {
            console.error("Failed to submit application:", error);
            throw error;
        }
    };

    // Reapply after rejection
    const reapply = async () => {
        if (!user) return;
        try {
            const { doc, deleteDoc } = await import('firebase/firestore');
            const appRef = doc(db, "business_applications", user.email);
            await deleteDoc(appRef);
            setApplication(null);
        } catch (error) {
            console.error("Failed to reset application:", error);
            throw error;
        }
    };

    useEffect(() => {
        // 🚀 OPTIMIZATION: Check LocalStorage for cached data to initialize state immediately
        const cachedRole = localStorage.getItem('cached_role');
        const cachedEmail = localStorage.getItem('cached_email');
        const cachedBizId = localStorage.getItem('cached_business_id');
        const cachedBizName = localStorage.getItem('cached_business_name');
        
        if (cachedRole && cachedEmail) {
            setRole(cachedRole);
            setBusinessId(cachedBizId);
            setBusinessName(cachedBizName || '');
            if (cachedRole !== 'guest') {
                setIsAllowed(true);
            }
            // Keep loading as true on reload until onAuthStateChanged validates the active user session,
            // preventing a temporary flash of the Login screen during boot.
        }

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                // Dynamically fetch values from LocalStorage inside the callback to avoid closure staleness on logout/login transitions
                const currentCachedEmail = localStorage.getItem('cached_email');
                const currentCachedRole = localStorage.getItem('cached_role');
                const currentCachedBizId = localStorage.getItem('cached_business_id');
                const currentCachedBizName = localStorage.getItem('cached_business_name');

                if (currentUser.email === currentCachedEmail && currentCachedRole && currentCachedRole !== 'guest') {
                    setRole(currentCachedRole);
                    setBusinessId(currentCachedBizId);
                    setBusinessName(currentCachedBizName || '');
                    setIsAllowed(true);
                    setLoading(false); // Fast unlock with cached credentials
                } else {
                    setLoading(true); // Force loading screen while checking authority for new login
                }

                try {
                    // Check system_admins collection for super_admin access
                    const adminRef = doc(db, "system_admins", currentUser.email);
                    const adminSnap = await getDoc(adminRef);

                    if (adminSnap.exists() || (currentUser.email === 'msdhrsah@gmail.com' && !adminSnap.exists())) {
                        // Bootstrap the primary owner doc if it doesn't exist yet
                        if (currentUser.email === 'msdhrsah@gmail.com' && !adminSnap.exists()) {
                            await setDoc(adminRef, {
                                email: currentUser.email,
                                role: 'super_admin',
                                name: currentUser.displayName || 'App Owner',
                                createdAt: new Date().toISOString()
                            });
                        }

                        setIsAllowed(true);
                        setRole('super_admin');
                        setBusinessId('admin');
                        setBusinessName('The Classic Counter Admin');
                        setApplication(null);

                        localStorage.setItem('cached_role', 'super_admin');
                        localStorage.setItem('cached_email', currentUser.email);
                        localStorage.setItem('cached_business_id', 'admin');
                        localStorage.setItem('cached_business_name', 'The Classic Counter Admin');
                    } else {
                        // Check if user exists in 'authorized_users' collection
                        const userRef = doc(db, "authorized_users", currentUser.email);
                        const userSnap = await getDoc(userRef);

                        if (userSnap.exists()) {
                            const data = userSnap.data();
                            const realRole = data.role || 'guest';
                            const bizId = data.businessId || null;
                            const bizName = data.businessName || '';

                            setIsAllowed(true);
                            setRole(realRole);
                            setBusinessId(bizId);
                            setBusinessName(bizName);
                            setApplication(null);

                            // Cache for next boot
                            localStorage.setItem('cached_role', realRole);
                            localStorage.setItem('cached_email', currentUser.email);
                            localStorage.setItem('cached_business_id', bizId || '');
                            localStorage.setItem('cached_business_name', bizName);
                        } else {
                            console.warn("User email not found in authorized_users collection. Checking applications...");
                            setIsAllowed(false);
                            setRole('guest');
                            setBusinessId(null);
                            setBusinessName('');
                            
                            // Check if application exists
                            const appRef = doc(db, "business_applications", currentUser.email);
                            const appSnap = await getDoc(appRef);
                            if (appSnap.exists()) {
                                setApplication(appSnap.data());
                            } else {
                                setApplication(null);
                            }

                            // Clear invalid cache
                            localStorage.removeItem('cached_role');
                            localStorage.setItem('cached_email', currentUser.email);
                            localStorage.removeItem('cached_business_id');
                            localStorage.removeItem('cached_business_name');
                        }
                    }
                } catch (error) {
                    console.error("Error checking authorization:", error);
                    setIsAllowed(false);
                } finally {
                    setLoading(false);
                }
            } else {
                setIsAllowed(false);
                setRole('guest');
                setBusinessId(null);
                setBusinessName('');
                setApplication(null);
                
                // Clear cache on logout
                localStorage.removeItem('cached_role');
                localStorage.removeItem('cached_email');
                localStorage.removeItem('cached_business_id');
                localStorage.removeItem('cached_business_name');
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    const [impersonatedBusinessId, setImpersonatedBusinessId] = useState(null);
    const [impersonatedBusinessName, setImpersonatedBusinessName] = useState('');

    const impersonateBusiness = (id, name) => {
        setImpersonatedBusinessId(id);
        setImpersonatedBusinessName(name);
    };

    const stopImpersonating = () => {
        setImpersonatedBusinessId(null);
        setImpersonatedBusinessName('');
    };

    const value = {
        user,
        isAllowed,
        role: impersonatedBusinessId ? 'admin' : role,
        businessId: impersonatedBusinessId || businessId,
        businessName: impersonatedBusinessName || businessName,
        isImpersonating: !!impersonatedBusinessId,
        impersonateBusiness,
        stopImpersonating,
        application,
        login,
        logout,
        submitApplication,
        reapply,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
