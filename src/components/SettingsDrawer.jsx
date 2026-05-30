import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/useTheme';
import { useAuth } from '../context/useAuth';
import { useInstall } from '../context/useInstall';
import { useSettings } from '../context/SettingsContext';
import RoleInfoModal from './RoleInfoModal';
import { Settings as SettingsIcon, Smartphone, X, Info, Database, Building2, FileText, Users, SlidersHorizontal, ChevronRight, ArrowLeft, Wrench } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

import BusinessSettings from './settings/BusinessSettings';
import GeneralPreferences from './settings/GeneralPreferences';
import TeamManagement from './TeamManagement';

// In-app Coming Soon placeholder
const ComingSoon = ({ title, subtitle, icon: Icon, color, onClose }) => (
    <motion.div
        key="comingsoon"
        initial={{ x: 30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 30, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
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
                    <Icon size={18} color={color} /> {title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtitle}</div>
            </div>
        </div>
        <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: '16px'
        }}>
            <motion.div
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                style={{
                    width: '72px', height: '72px', borderRadius: '20px',
                    background: `linear-gradient(135deg, ${color}22, ${color}11)`,
                    border: `1px solid ${color}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                <Wrench size={32} color={color} />
            </motion.div>
            <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--color-text-main)', marginBottom: '8px' }}>Coming Soon</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6, maxWidth: '260px' }}>
                    The <strong>{title}</strong> section is under construction and will be available in a future update.
                </div>
            </div>
            <div style={{
                marginTop: '8px', padding: '10px 20px', borderRadius: '30px',
                background: `${color}18`, border: `1px solid ${color}33`,
                color: color, fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.5px'
            }}>🚧 IN DEVELOPMENT</div>
        </div>
    </motion.div>
);

const MenuCard = ({ icon, title, subtitle, onClick, isDark }) => (
    <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => {
            triggerHaptic('light');
            onClick();
        }}
        style={{
            background: isDark ? 'rgba(255,255,255,0.03)' : 'var(--color-bg-base)',
            borderRadius: '20px',
            padding: '16px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'var(--color-border)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            cursor: 'pointer',
            boxShadow: isDark ? 'none' : '0 2px 10px rgba(0,0,0,0.02)'
        }}
    >
        <div style={{
            padding: '12px',
            borderRadius: '16px',
            background: isDark ? 'rgba(255,255,255,0.05)' : 'var(--color-bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: 'var(--color-text-main)', fontSize: '0.95rem' }}>{title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{subtitle}</div>
        </div>
        <ChevronRight size={20} color="var(--color-text-muted)" style={{ opacity: 0.5 }} />
    </motion.div>
);

const SettingsDrawer = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { role: _role } = useAuth();
    const { deferredPrompt, promptInstall } = useInstall();
    const { isSettingsOpen, closeSettings, openData } = useSettings();

    const [showRoleInfo, setShowRoleInfo] = useState(false);
    const [currentView, setCurrentView] = useState('main'); // 'main', 'business', 'preferences'

    // Prevent body scroll when open
    useEffect(() => {
        if (isSettingsOpen) {
            document.body.style.overflow = 'hidden';
            setCurrentView('main'); // Reset to main when opened
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSettingsOpen]);

    if (!isSettingsOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 20002, display: 'flex', justifyContent: 'flex-end' }}>
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeSettings}
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)',
                }}
            />

            {/* Drawer Panel */}
            <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    height: '100%',
                    background: isDark ? 'rgba(9, 9, 11, 0.6)' : 'rgba(255, 255, 255, 0.65)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.4)'}`,
                    boxShadow: isDark
                        ? '-5px 0 30px rgba(0,0,0,0.5), inset 1px 0 0 rgba(255,255,255,0.1)'
                        : '-5px 0 30px rgba(0,0,0,0.1), inset 1px 0 0 rgba(255,255,255,0.5)',
                    position: 'relative',
                    zIndex: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '24px',
                    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent',
                    zIndex: 20
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: 'var(--color-primary)',
                            padding: '10px', borderRadius: '14px',
                            color: 'white', display: 'flex',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                        }}>
                            <SettingsIcon size={24} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)', letterSpacing: '-0.5px' }}>Settings</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Preferences & Controls</p>
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            triggerHaptic('light');
                            closeSettings();
                        }}
                        style={{
                            background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            border: 'none', cursor: 'pointer',
                            color: 'var(--color-text-main)', display: 'flex', padding: '8px', borderRadius: '50%'
                        }}
                    >
                        <X size={20} />
                    </motion.button>
                </div>

                {/* Content Area with View Swapping */}
                <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                    <AnimatePresence mode="wait">
                        {currentView === 'main' && (
                            <motion.div
                                key="main"
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -20, opacity: 0 }}
                                style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: '100px', height: '100%' }}
                                className="hide-scrollbar"
                            >
                                {/* Premium Role Badge */}
                                <motion.div
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setShowRoleInfo(true);
                                    }}
                                    style={{
                                        marginBottom: '32px',
                                        padding: '24px',
                                        background: _role === 'admin'
                                            ? (isDark ? 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(234, 179, 8, 0.03) 100%)' : 'linear-gradient(135deg, rgba(254, 240, 138, 0.3) 0%, rgba(254, 240, 138, 0.05) 100%)')
                                            : (_role === 'staff'
                                                ? (isDark ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.03) 100%)' : 'linear-gradient(135deg, rgba(191, 219, 254, 0.3) 0%, rgba(191, 219, 254, 0.05) 100%)')
                                                : (isDark ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.1) 0%, rgba(244, 63, 94, 0.03) 100%)' : 'linear-gradient(135deg, rgba(254, 205, 211, 0.3) 0%, rgba(254, 205, 211, 0.05) 100%)')),
                                        borderRadius: '24px',
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.4)'}`,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
                                        background: 'linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.2) 45%, transparent 50%)',
                                        transform: 'rotate(25deg)', pointerEvents: 'none', opacity: 0.5
                                    }}></div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                        <div style={{
                                            padding: '6px 12px', borderRadius: '20px',
                                            background: _role === 'admin' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                            color: _role === 'admin' ? (isDark ? '#facc15' : '#b45309') : (isDark ? '#60a5fa' : '#1d4ed8'),
                                            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`
                                        }}>
                                            {_role === 'admin' ? 'ADMIN ACCESS' : 'STAFF MEMBER'}
                                        </div>
                                        <Info size={18} color="var(--color-text-muted)" />
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Current Profile</div>
                                        <div style={{
                                            fontSize: '2rem',
                                            fontWeight: 800,
                                            background: 'linear-gradient(90deg, var(--color-text-main), var(--color-text-muted))',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                            letterSpacing: '-1px'
                                        }}>
                                            {_role === 'admin' ? 'Munna Bhai' : _role === 'staff' ? 'Circuit' : 'Mamu'}
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Drill-down Menu Options */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <MenuCard 
                                        icon={<Building2 size={20} color="#6366f1" />}
                                        title="Business Info"
                                        subtitle="Profile, Logo & Branding"
                                        onClick={() => setCurrentView('business')}
                                        isDark={isDark}
                                    />
                                    <MenuCard 
                                        icon={<FileText size={20} color="#f59e0b" />}
                                        title="Taxation & GST"
                                        subtitle="GSTIN, Rates & Parser"
                                        onClick={() => setCurrentView('taxation')}
                                        isDark={isDark}
                                    />
                                    <MenuCard 
                                        icon={<Users size={20} color="#8b5cf6" />}
                                        title="Team Management"
                                        subtitle="Manage Staff & Roles"
                                        onClick={() => setCurrentView('team')}
                                        isDark={isDark}
                                    />
                                    <MenuCard 
                                        icon={<SlidersHorizontal size={20} color="#ec4899" />}
                                        title="General Preferences"
                                        subtitle="Interface & Display"
                                        onClick={() => setCurrentView('preferences')}
                                        isDark={isDark}
                                    />
                                    {_role === 'admin' && (
                                        <MenuCard 
                                            icon={<Database size={20} color="#ef4444" />}
                                            title="Manage Database"
                                            subtitle="Backup & Restore"
                                            onClick={() => {
                                                openData();
                                                closeSettings();
                                            }}
                                            isDark={isDark}
                                        />
                                    )}
                                </div>

                                {/* Install App Link */}
                                {deferredPrompt && (
                                    <motion.div
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ marginTop: '32px' }}
                                    >
                                        <button
                                            onClick={promptInstall}
                                            style={{
                                                width: '100%', padding: '16px', borderRadius: '16px',
                                                background: 'var(--color-primary)',
                                                color: 'white', border: 'none',
                                                fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                                boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)'
                                            }}
                                        >
                                            <Smartphone size={18} />
                                            Install App
                                        </button>
                                    </motion.div>
                                )}

                                {/* Version Footer */}
                                <div style={{ textAlign: 'center', marginTop: '40px' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Classic Counter</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>v1.8.6 • Enterprise Edition</div>
                                </div>
                            </motion.div>
                        )}
                        
                        {currentView === 'business' && (
                            <BusinessSettings key="business" onClose={() => setCurrentView('main')} />
                        )}
                        
                        {currentView === 'preferences' && (
                            <GeneralPreferences key="preferences" onClose={() => setCurrentView('main')} />
                        )}

                        {currentView === 'taxation' && (
                            <ComingSoon
                                key="taxation"
                                title="Taxation & GST"
                                subtitle="GSTIN, Rates & Parser"
                                icon={FileText}
                                color="#f59e0b"
                                onClose={() => setCurrentView('main')}
                            />
                        )}

                        {currentView === 'team' && (
                            <TeamManagement key="team" onClose={() => setCurrentView('main')} />
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            <RoleInfoModal isOpen={showRoleInfo} onClose={() => setShowRoleInfo(false)} />
        </div>
    );
};

export default SettingsDrawer;
