import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/useTheme';
import { ArrowLeft, Layout, Monitor, Check, SlidersHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';
import MasterCategoryOrderManager from './MasterCategoryOrderManager';

const GeneralPreferences = ({ onClose }) => {
    const { dashboardMode, setDashboardMode, theme } = useTheme();
    const isDark = theme === 'dark';
    const {
        menuBarMode, setMenuBarMode,
        iconStyle, setIconStyle,
        showMenuLabels, setShowMenuLabels,
        showMilestoneModal, setShowMilestoneModal,
        waiterTableCount, setWaiterTableCount,
        masterCategoryOrder, setMasterCategoryOrder
    } = useSettings();

    const borderColor = 'var(--color-border)';

    return (
        <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            style={{ padding: '0 4px', height: '100%', overflowY: 'auto', paddingBottom: '100px' }}
            className="hide-scrollbar"
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={onClose}
                    style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-main)',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h2 style={{ fontSize: '1.2rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontWeight: 800 }}>
                    <SlidersHorizontal size={22} color="var(--color-primary)" />
                    General Preferences
                </h2>
            </div>

            {/* Interface Section */}
            <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--color-text-main)', marginBottom: '16px', opacity: 0.8 }}>Interface</h3>

            {/* Dashboard View Mode */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                        { id: 'inline', label: 'Inline Form', icon: <Layout size={20} />, text: 'Efficient & Fast' },
                        { id: 'popup', label: 'Popup Modal', icon: <Monitor size={20} />, text: 'Focused View' }
                    ].map((option) => (
                        <motion.div
                            key={option.id}
                            onClick={() => setDashboardMode(option.id)}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            style={{
                                border: `2px solid ${dashboardMode === option.id
                                    ? 'var(--color-primary)'
                                    : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)')}`,
                                borderRadius: '20px',
                                padding: '16px',
                                cursor: 'pointer',
                                background: dashboardMode === option.id
                                    ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)')
                                    : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)'),
                                backdropFilter: 'blur(12px)',
                                WebkitBackdropFilter: 'blur(12px)',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                            }}
                        >
                            <div style={{ marginBottom: '12px', color: dashboardMode === option.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
                                {option.icon}
                            </div>
                            <div style={{ fontWeight: 700, color: 'var(--color-text-main)', marginBottom: '4px' }}>{option.label}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{option.text}</div>

                            <div style={{
                                marginTop: '12px', height: '40px', background: 'var(--color-bg-secondary)', borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5,
                                border: `1px solid ${borderColor}`
                            }}>
                                {option.id === 'inline' ? (
                                    <div style={{ width: '80%', height: '4px', background: 'var(--color-text-muted)', borderRadius: '2px' }} />
                                ) : (
                                    <div style={{ width: '20px', height: '24px', background: 'var(--color-text-muted)', borderRadius: '4px', border: '1px solid currentColor' }} />
                                )}
                            </div>

                            {dashboardMode === option.id && (
                                <div style={{
                                    position: 'absolute', top: '12px', right: '12px',
                                    background: 'var(--color-primary)', borderRadius: '50%',
                                    width: '20px', height: '20px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                }}>
                                    <Check size={12} color="white" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Icon Style */}
            <div style={{ marginBottom: '32px' }}>
                <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>Icon Style</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <motion.div
                        onClick={() => setIconStyle('mono')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            border: `2px solid ${iconStyle === 'mono'
                                ? 'var(--color-primary)'
                                : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)')}`,
                            borderRadius: '16px',
                            padding: '16px',
                            cursor: 'pointer',
                            background: iconStyle === 'mono'
                                ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)')
                                : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)'),
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                        }}
                    >
                        <div style={{ fontSize: '1.4rem', filter: 'grayscale(100%)' }}>🍕</div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Mono</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Minimalist</div>
                        </div>
                    </motion.div>

                    <motion.div
                        onClick={() => setIconStyle('emoji')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            border: `2px solid ${iconStyle === 'emoji'
                                ? 'var(--color-primary)'
                                : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)')}`,
                            borderRadius: '16px',
                            padding: '16px',
                            cursor: 'pointer',
                            background: iconStyle === 'emoji'
                                ? (isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)')
                                : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)'),
                            backdropFilter: 'blur(12px)',
                            WebkitBackdropFilter: 'blur(12px)',
                            display: 'flex', alignItems: 'center', gap: '12px',
                            boxShadow: isDark ? 'none' : '0 4px 20px rgba(0,0,0,0.05)'
                        }}
                    >
                        <div style={{ fontSize: '1.4rem' }}>🍕</div>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: '0.9rem' }}>Emoji</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Vibrant</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* POS Configuration */}
            <div style={{ marginBottom: '32px' }}>
                <h4 style={{ color: 'var(--color-text-main)', margin: '0 0 12px 0', fontSize: '1rem', fontWeight: 700 }}>POS Configuration</h4>
                
                {/* Table Count */}
                <div style={{ marginBottom: '16px', padding: '16px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)' }}>Number of Tables</div>
                        <input 
                            type="number" 
                            value={waiterTableCount} 
                            onChange={(e) => setWaiterTableCount(Math.max(1, parseInt(e.target.value) || 1))}
                            style={{ width: '60px', padding: '6px 10px', borderRadius: '8px', border: `1px solid ${borderColor}`, background: 'var(--color-bg-base)', color: 'var(--color-text-main)', textAlign: 'center' }}
                        />
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Default number of tables shown in the Waiter and Billing screens. Active tables will always be shown.</div>
                </div>

                {/* Master Category Order */}
                <div style={{ padding: '16px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)', backdropFilter: 'blur(12px)', borderRadius: '16px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'}` }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '12px' }}>Master Category Order</div>
                    <MasterCategoryOrderManager 
                        masterCategoryOrder={masterCategoryOrder}
                        setMasterCategoryOrder={setMasterCategoryOrder}
                    />
                </div>
            </div>

            {/* Switches */}
            <div style={{
                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: '24px',
                padding: '8px',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)'}`
            }}>
                {/* Menu Labels */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: `1px solid ${borderColor}` }}>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Menu Labels</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Show text labels in navigation</div>
                    </div>
                    <div
                        onClick={() => setShowMenuLabels(!showMenuLabels)}
                        style={{
                            width: '44px', height: '24px',
                            background: showMenuLabels ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderRadius: '12px',
                            position: 'relative', cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                    >
                        <motion.div
                            animate={{ x: showMenuLabels ? 22 : 2 }}
                            style={{
                                width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        />
                    </div>
                </div>

                {/* Immersive Mode */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Immersive Mode</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Auto-hide navigation bar</div>
                    </div>
                    <div
                        onClick={() => setMenuBarMode(menuBarMode === 'disappearing' ? 'sticky' : 'disappearing')}
                        style={{
                            width: '44px', height: '24px',
                            background: menuBarMode === 'disappearing' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderRadius: '12px',
                            position: 'relative', cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                    >
                        <motion.div
                            animate={{ x: menuBarMode === 'disappearing' ? 22 : 2 }}
                            style={{
                                width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        />
                    </div>
                </div>

                {/* Sales Popups */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderTop: `1px solid ${borderColor}` }}>
                    <div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>Sales Popups</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Celebrate milestones with confetti</div>
                    </div>
                    <div
                        onClick={() => setShowMilestoneModal(!showMilestoneModal)}
                        style={{
                            width: '44px', height: '24px',
                            background: showMilestoneModal ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderRadius: '12px',
                            position: 'relative', cursor: 'pointer',
                            transition: 'background 0.3s'
                        }}
                    >
                        <motion.div
                            animate={{ x: showMilestoneModal ? 22 : 2 }}
                            style={{
                                width: '20px', height: '20px', background: 'white', borderRadius: '50%',
                                position: 'absolute', top: '2px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}
                        />
                    </div>
                </div>
            </div>
            
            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </motion.div>
    );
};

export default GeneralPreferences;
