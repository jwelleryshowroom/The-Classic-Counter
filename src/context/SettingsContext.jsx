import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { useInventory } from './InventoryContext';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

// Default Configurations
const DEFAULT_MOBILE_SETTINGS = {
    menuBarMode: 'disappearing',
    iconStyle: 'emoji',
    showMenuLabels: false,
    showMilestoneModal: false, // Changed to OFF by default
    homeLayoutMode: 'bento'
};

const DEFAULT_DESKTOP_SETTINGS = {
    menuBarMode: 'disappearing',
    iconStyle: 'emoji',
    showMenuLabels: true,
    showMilestoneModal: false, // Changed to OFF by default
    homeLayoutMode: 'bento'
};

const parseAddress = (addressString) => {
    if (!addressString) return { street: '', landmark: '', city: '', state: '', pin: '' };
    const lines = addressString.split('\n').map(l => l.trim()).filter(Boolean);
    let street = '';
    let landmark = '';
    let city = '';
    let state = '';
    let pin = '';
    if (lines.length > 0) {
        const parts = lines[0].split(',');
        street = parts[0]?.trim() || '';
        if (parts.length > 1) {
            landmark = parts.slice(1).join(',').trim();
        }
    }
    if (lines.length > 1) {
        let rest = lines[1];
        const pinMatch = rest.match(/(?:-\s*)?(\d{6})$/);
        if (pinMatch) {
            pin = pinMatch[1];
            rest = rest.substring(0, pinMatch.index).trim();
            rest = rest.replace(/[\s,-]+$/, '');
        }
        const parts = rest.split(',');
        if (parts.length > 1) {
            city = parts[0].trim();
            state = parts.slice(1).join(',').trim();
        } else {
            city = rest.trim();
        }
    }
    return { street, landmark, city, state, pin };
};

export const SettingsProvider = ({ children }) => {
    const { user, businessId } = useAuth();
    const { items: menuItems } = useInventory();
    const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);
    
    // 1. Device Detection
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        setIsSettingsLoaded(false);
        lastRemoteSettingsRef.current = null;
        if (!businessId) return;

        const savedInfo = localStorage.getItem(`businessInfo_${businessId}`);
        if (savedInfo) {
            const parsedInfo = JSON.parse(savedInfo);
            if (parsedInfo.street === undefined) {
                const parsed = parseAddress(parsedInfo.businessAddress);
                parsedInfo.street = parsed.street;
                parsedInfo.landmark = parsed.landmark;
                parsedInfo.city = parsed.city;
                parsedInfo.state = parsed.state;
                parsedInfo.pin = parsed.pin;
            }
            setBusinessInfo(parsedInfo);
        } else {
            setBusinessInfo({
                businessName: 'The Classic Counter',
                businessPhone: 'e.g. +91 98765 43210',
                businessAddress: 'e.g. 123 Main St...',
                street: 'e.g. 123 Main St',
                landmark: '',
                city: '',
                state: '',
                pin: '',
                businessFooter: 'Thank you for visiting!',
                googleMapLink: 'https://maps.app.goo.gl/...',
                publicUrl: 'https://myapp.web.app'
            });
        }

        const savedTableCount = localStorage.getItem(`waiterTableCount_${businessId}`);
        setWaiterTableCount(savedTableCount !== null ? JSON.parse(savedTableCount) : 5);

        const savedCategoryOrder = localStorage.getItem(`masterCategoryOrder_${businessId}`);
        if (savedCategoryOrder !== null) {
            try {
                const parsed = JSON.parse(savedCategoryOrder);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setMasterCategoryOrder(parsed);
                } else {
                    setMasterCategoryOrder([]);
                }
            } catch (e) {
                setMasterCategoryOrder([]);
            }
        } else {
            setMasterCategoryOrder([]);
        }

        const savedCashierName = localStorage.getItem(`cashierName_${businessId}`);
        setCashierName(savedCashierName !== null ? JSON.parse(savedCashierName) : 'Ankit');
    }, [businessId]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 2. Load Profiles from LocalStorage
    const [mobileSettings, setMobileSettings] = useState(() => {
        const saved = localStorage.getItem('settings_mobile');
        return saved ? { ...DEFAULT_MOBILE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_MOBILE_SETTINGS;
    });

    const [desktopSettings, setDesktopSettings] = useState(() => {
        const saved = localStorage.getItem('settings_desktop');
        return saved ? { ...DEFAULT_DESKTOP_SETTINGS, ...JSON.parse(saved) } : DEFAULT_DESKTOP_SETTINGS;
    });

    // 3. Persist Changes
    useEffect(() => {
        localStorage.setItem('settings_mobile', JSON.stringify(mobileSettings));
    }, [mobileSettings]);

    useEffect(() => {
        localStorage.setItem('settings_desktop', JSON.stringify(desktopSettings));
    }, [desktopSettings]);

    // 4. Resolve Current Settings based on Device
    const currentSettings = isMobile ? mobileSettings : desktopSettings;
    const updateSettings = isMobile ? setMobileSettings : setDesktopSettings;

    // Helper to update specific key
    const updateSetting = (key, value) => {
        updateSettings(prev => ({ ...prev, [key]: value }));
    };

    // 5. Global / Shared Settings (NOT device specific)
    const [businessInfo, setBusinessInfo] = useState(() => {
        const saved = businessId ? localStorage.getItem(`businessInfo_${businessId}`) : null;
        if (saved) {
            const parsedInfo = JSON.parse(saved);
            if (parsedInfo.street === undefined) {
                const parsed = parseAddress(parsedInfo.businessAddress);
                parsedInfo.street = parsed.street;
                parsedInfo.landmark = parsed.landmark;
                parsedInfo.city = parsed.city;
                parsedInfo.state = parsed.state;
                parsedInfo.pin = parsed.pin;
            }
            return parsedInfo;
        }
        return {
            businessName: 'The Classic Counter',
            businessPhone: 'e.g. +91 98765 43210',
            businessAddress: 'e.g. 123 Main St...',
            street: 'e.g. 123 Main St',
            landmark: '',
            city: '',
            state: '',
            pin: '',
            businessFooter: 'Thank you for visiting!',
            googleMapLink: 'https://maps.app.goo.gl/...',
            publicUrl: 'https://myapp.web.app'
        };
    });

    const updateBusinessInfo = (key, value) => {
        setBusinessInfo(prev => ({ ...prev, [key]: value }));
    };

    const [hapticDebug, setHapticDebug] = useState(() => {
        const saved = localStorage.getItem('hapticDebug');
        return saved !== null ? JSON.parse(saved) : false;
    });

    const [waiterTableCount, setWaiterTableCount] = useState(() => {
        const saved = businessId ? localStorage.getItem(`waiterTableCount_${businessId}`) : null;
        return saved !== null ? JSON.parse(saved) : 5;
    });

    const [masterCategoryOrder, setMasterCategoryOrder] = useState(() => {
        const saved = businessId ? localStorage.getItem(`masterCategoryOrder_${businessId}`) : null;
        if (saved !== null) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed;
                }
            } catch (e) {
                console.error(e);
            }
        }
        return [];
    });

    const [cashierName, setCashierName] = useState(() => {
        const saved = businessId ? localStorage.getItem(`cashierName_${businessId}`) : null;
        return saved !== null ? JSON.parse(saved) : 'Ankit';
    });

    useEffect(() => {
        localStorage.setItem('hapticDebug', JSON.stringify(hapticDebug));
    }, [hapticDebug]);

    // Refs to store the latest values for snapshot comparison (preventing stale closures)
    const businessInfoRef = useRef(businessInfo);
    const waiterTableCountRef = useRef(waiterTableCount);
    const masterCategoryOrderRef = useRef(masterCategoryOrder);
    const cashierNameRef = useRef(cashierName);
    const lastRemoteSettingsRef = useRef(null);

    useEffect(() => { businessInfoRef.current = businessInfo; }, [businessInfo]);
    useEffect(() => { waiterTableCountRef.current = waiterTableCount; }, [waiterTableCount]);
    useEffect(() => { masterCategoryOrderRef.current = masterCategoryOrder; }, [masterCategoryOrder]);
    useEffect(() => { cashierNameRef.current = cashierName; }, [cashierName]);

    // Extract unique categories from menu items and sync/cleanup masterCategoryOrder
    useEffect(() => {
        if (!menuItems || !Array.isArray(menuItems)) return;

        const uniqueCategories = [...new Set(
            menuItems
                .map(item => item.masterCategory || item.category || 'General')
                .map(cat => cat.trim())
                .filter(Boolean)
        )];

        // Filter out legacy default categories that are not active in the current inventory
        const legacyDefaults = [
            'Starters',
            'Main Course',
            'Rice & Noodles',
            'Dal',
            'Fast Food',
            'Egg Specials',
            'Bread',
            'Sides',
            'Desserts',
            'Beverages',
            'Menu',
            'Cakes',
            'Pastries',
            'Drinks',
            'Snacks',
            'General'
        ];

        const cleanedOrder = masterCategoryOrder.filter(cat => {
            return uniqueCategories.includes(cat) || !legacyDefaults.includes(cat);
        });

        // Append any missing active categories
        const newOrder = [...cleanedOrder];
        let hasChanges = false;

        uniqueCategories.forEach(cat => {
            if (!newOrder.includes(cat)) {
                newOrder.push(cat);
                hasChanges = true;
            }
        });

        if (cleanedOrder.length !== masterCategoryOrder.length || hasChanges) {
            setMasterCategoryOrder(newOrder);
        }
    }, [menuItems, masterCategoryOrder]);

    // Realtime Sync from Firestore
    useEffect(() => {
        if (!user || !businessId) return;

        const settingsRef = doc(db, 'businesses', businessId, 'settings', 'config');
        const unsubscribe = onSnapshot(settingsRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                lastRemoteSettingsRef.current = data;

                if (data.businessInfo && JSON.stringify(data.businessInfo) !== JSON.stringify(businessInfoRef.current)) {
                    const info = { ...data.businessInfo };
                    if (info.street === undefined) {
                        const parsed = parseAddress(info.businessAddress);
                        info.street = parsed.street;
                        info.landmark = parsed.landmark;
                        info.city = parsed.city;
                        info.state = parsed.state;
                        info.pin = parsed.pin;
                    }
                    setBusinessInfo(info);
                    localStorage.setItem(`businessInfo_${businessId}`, JSON.stringify(info));
                }
                let incomingTableCount = data.waiterTableCount;
                if (incomingTableCount === 15 && businessId === 'jwelleryshowroom') {
                    console.log("Forcing waiterTableCount from 15 to 5 for business jwelleryshowroom");
                    incomingTableCount = 5;
                    // Sync the reset count to Firestore
                    setDoc(settingsRef, { waiterTableCount: 5 }, { merge: true }).catch(err => {
                        console.error("Error resetting waiterTableCount to 5:", err);
                    });
                }

                if (incomingTableCount !== undefined && incomingTableCount !== waiterTableCountRef.current) {
                    setWaiterTableCount(incomingTableCount);
                    localStorage.setItem(`waiterTableCount_${businessId}`, JSON.stringify(incomingTableCount));
                }
                if (data.masterCategoryOrder && Array.isArray(data.masterCategoryOrder) && JSON.stringify(data.masterCategoryOrder) !== JSON.stringify(masterCategoryOrderRef.current)) {
                    setMasterCategoryOrder(data.masterCategoryOrder);
                    localStorage.setItem(`masterCategoryOrder_${businessId}`, JSON.stringify(data.masterCategoryOrder));
                }
                if (data.cashierName !== undefined && data.cashierName !== cashierNameRef.current) {
                    setCashierName(data.cashierName);
                    localStorage.setItem(`cashierName_${businessId}`, JSON.stringify(data.cashierName));
                }
                setIsSettingsLoaded(true);
            } else {
                // Seed Firestore if document doesn't exist yet
                setDoc(settingsRef, {
                    businessInfo: businessInfoRef.current,
                    waiterTableCount: waiterTableCountRef.current,
                    masterCategoryOrder: masterCategoryOrderRef.current,
                    cashierName: cashierNameRef.current
                }, { merge: true }).then(() => {
                    setIsSettingsLoaded(true);
                }).catch(err => {
                    console.error("Error seeding business settings:", err);
                });
            }
        }, (error) => {
            console.error("Settings Firestore sync error:", error);
        });

        return () => unsubscribe();
    }, [user, businessId]);

    // Save local changes to Firestore
    useEffect(() => {
        if (!user || !businessId || !isSettingsLoaded) return;
        localStorage.setItem(`businessInfo_${businessId}`, JSON.stringify(businessInfo));

        const lastRemote = lastRemoteSettingsRef.current;
        if (lastRemote && JSON.stringify(lastRemote.businessInfo) !== JSON.stringify(businessInfo)) {
            const settingsRef = doc(db, 'businesses', businessId, 'settings', 'config');
            setDoc(settingsRef, { businessInfo }, { merge: true })
                .then(() => {
                    if (lastRemoteSettingsRef.current) {
                        lastRemoteSettingsRef.current.businessInfo = businessInfo;
                    }
                })
                .catch(err => console.error("Error saving businessInfo:", err));
        }
    }, [businessInfo, user, businessId, isSettingsLoaded]);

    useEffect(() => {
        if (!user || !businessId || !isSettingsLoaded) return;
        localStorage.setItem(`waiterTableCount_${businessId}`, JSON.stringify(waiterTableCount));

        const lastRemote = lastRemoteSettingsRef.current;
        if (lastRemote && lastRemote.waiterTableCount !== waiterTableCount) {
            const settingsRef = doc(db, 'businesses', businessId, 'settings', 'config');
            setDoc(settingsRef, { waiterTableCount }, { merge: true })
                .then(() => {
                    if (lastRemoteSettingsRef.current) {
                        lastRemoteSettingsRef.current.waiterTableCount = waiterTableCount;
                    }
                })
                .catch(err => console.error("Error saving waiterTableCount:", err));
        }
    }, [waiterTableCount, user, businessId, isSettingsLoaded]);

    useEffect(() => {
        if (!user || !businessId || !isSettingsLoaded) return;
        localStorage.setItem(`masterCategoryOrder_${businessId}`, JSON.stringify(masterCategoryOrder));

        const lastRemote = lastRemoteSettingsRef.current;
        if (lastRemote && JSON.stringify(lastRemote.masterCategoryOrder) !== JSON.stringify(masterCategoryOrder)) {
            const settingsRef = doc(db, 'businesses', businessId, 'settings', 'config');
            setDoc(settingsRef, { masterCategoryOrder }, { merge: true })
                .then(() => {
                    if (lastRemoteSettingsRef.current) {
                        lastRemoteSettingsRef.current.masterCategoryOrder = masterCategoryOrder;
                    }
                })
                .catch(err => console.error("Error saving masterCategoryOrder:", err));
        }
    }, [masterCategoryOrder, user, businessId, isSettingsLoaded]);

    useEffect(() => {
        if (!user || !businessId || !isSettingsLoaded) return;
        localStorage.setItem(`cashierName_${businessId}`, JSON.stringify(cashierName));

        const lastRemote = lastRemoteSettingsRef.current;
        if (lastRemote && lastRemote.cashierName !== cashierName) {
            const settingsRef = doc(db, 'businesses', businessId, 'settings', 'config');
            setDoc(settingsRef, { cashierName }, { merge: true })
                .then(() => {
                    if (lastRemoteSettingsRef.current) {
                        lastRemoteSettingsRef.current.cashierName = cashierName;
                    }
                })
                .catch(err => console.error("Error saving cashierName:", err));
        }
    }, [cashierName, user, businessId, isSettingsLoaded]);

    // Drawer States (Ephemeral)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const openSettings = () => setIsSettingsOpen(true);
    const closeSettings = () => setIsSettingsOpen(false);

    const [isDataOpen, setIsDataOpen] = useState(false);
    const openData = () => setIsDataOpen(true);
    const closeData = () => setIsDataOpen(false);

    const [navVisible, setNavVisible] = useState(true);

    const value = {
        // Exposed Values (Proxied to current profile)
        menuBarMode: currentSettings.menuBarMode,
        setMenuBarMode: (val) => updateSetting('menuBarMode', val),

        iconStyle: currentSettings.iconStyle,
        setIconStyle: (val) => updateSetting('iconStyle', val),

        showMenuLabels: currentSettings.showMenuLabels,
        setShowMenuLabels: (val) => updateSetting('showMenuLabels', val),

        showMilestoneModal: currentSettings.showMilestoneModal,
        setShowMilestoneModal: (val) => updateSetting('showMilestoneModal', val),

        homeLayoutMode: currentSettings.homeLayoutMode,
        setHomeLayoutMode: (val) => updateSetting('homeLayoutMode', val),

        // Global
        businessInfo,
        updateBusinessInfo,
        hapticDebug,
        setHapticDebug,
        waiterTableCount,
        setWaiterTableCount,
        masterCategoryOrder,
        setMasterCategoryOrder,
        cashierName,
        setCashierName,
        isSettingsOpen,
        openSettings,
        closeSettings,
        isDataOpen,
        openData,
        closeData,
        navVisible,
        setNavVisible,

        // Meta
        isMobile
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};
