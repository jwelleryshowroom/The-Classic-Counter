import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { ArrowLeft, Building2, Save, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BusinessSettings = ({ onClose }) => {
    const { businessInfo, updateBusinessInfo } = useSettings();

    // Local draft state — only commits to context on Save
    const [draft, setDraft] = useState({ ...businessInfo });
    const [saved, setSaved] = useState(false);

    const updateDraft = (key, value) => {
        setDraft(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const updateAddressField = (field, val) => {
        setDraft(prev => {
            const newFields = {
                ...prev,
                [field]: val
            };
            const streetStr = (newFields.street || '').trim();
            const landmarkStr = (newFields.landmark || '').trim();
            const cityStr = (newFields.city || '').trim();
            const stateStr = (newFields.state || '').trim();
            const pinStr = (newFields.pin || '').trim();
            
            const formatted = `${streetStr}${landmarkStr ? ', ' + landmarkStr : ''}\n${cityStr}${stateStr ? ', ' + stateStr : ''}${pinStr ? ' ' + pinStr : ''}`.trim();
            
            return {
                ...newFields,
                businessAddress: formatted
            };
        });
        setSaved(false);
    };

    const handleSave = () => {
        // Push all draft fields into context (and thus localStorage)
        Object.entries(draft).forEach(([key, value]) => {
            updateBusinessInfo(key, value);
        });
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    const isDirty = JSON.stringify(draft) !== JSON.stringify(businessInfo);

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-base)',
        color: 'var(--color-text-main)',
        fontSize: '1rem',
        boxSizing: 'border-box',
        transition: 'border-color 0.2s ease',
        outline: 'none',
        marginTop: '8px',
        fontFamily: 'inherit'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '0.72rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        color: 'var(--color-text-muted)',
        marginTop: '20px'
    };

    return (
        <motion.div
            key="business"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
        >
            {/* Sub-header */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '16px 24px',
                borderBottom: '1px solid var(--color-border)'
            }}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    style={{
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text-main)',
                        cursor: 'pointer',
                        padding: '7px',
                        borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <ArrowLeft size={18} />
                </motion.button>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building2 size={18} color="var(--color-primary)" /> Business Info
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Profile, Logo & Branding</div>
                </div>
            </div>

            {/* Scrollable Form Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 100px' }} className="hide-scrollbar">
                <div style={{
                    background: 'var(--color-bg-secondary)',
                    borderRadius: '20px',
                    padding: '20px',
                    border: '1px solid var(--color-border)',
                }}>
                    <label style={{ ...labelStyle, marginTop: 0 }}>
                        Business Name
                        <input
                            type="text"
                            value={draft.businessName}
                            onChange={(e) => updateDraft('businessName', e.target.value)}
                            placeholder="The Classic Counter"
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </label>

                    <label style={labelStyle}>
                        Phone Label
                        <input
                            type="text"
                            value={draft.businessPhone}
                            onChange={(e) => updateDraft('businessPhone', e.target.value)}
                            placeholder="e.g. +91 98765 43210"
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </label>

                    <div style={{ marginTop: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '10px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                            Business Address
                        </div>
                        
                        <label style={{ ...labelStyle, marginTop: '10px' }}>
                            Street / Building Name
                            <input
                                type="text"
                                value={draft.street || ''}
                                onChange={(e) => updateAddressField('street', e.target.value)}
                                placeholder="Street / Building Name (e.g. Mahavir Marg)"
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </label>

                        <label style={{ ...labelStyle, marginTop: '15px' }}>
                            Nearby Location / Landmark
                            <input
                                type="text"
                                value={draft.landmark || ''}
                                onChange={(e) => updateAddressField('landmark', e.target.value)}
                                placeholder="Nearby Location / Landmark (e.g. opp. Hotel Shyam Palace)"
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                            />
                        </label>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '15px' }}>
                            <label style={{ ...labelStyle, marginTop: 0, flex: 1.2 }}>
                                City / District
                                <input
                                    type="text"
                                    value={draft.city || ''}
                                    onChange={(e) => updateAddressField('city', e.target.value)}
                                    placeholder="City / District"
                                    style={inputStyle}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                                />
                            </label>
                            
                            <label style={{ ...labelStyle, marginTop: 0, flex: 0.8 }}>
                                State
                                <input
                                    type="text"
                                    value={draft.state || ''}
                                    onChange={(e) => updateAddressField('state', e.target.value)}
                                    placeholder="State"
                                    style={inputStyle}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                                />
                            </label>

                            <label style={{ ...labelStyle, marginTop: 0, flex: 1 }}>
                                Pin Code
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={draft.pin || ''}
                                    onChange={(e) => updateAddressField('pin', e.target.value)}
                                    placeholder="Pin Code"
                                    style={inputStyle}
                                    onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                    onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                                />
                            </label>
                        </div>
                    </div>

                    <label style={labelStyle}>
                        Bill Footer Message
                        <input
                            type="text"
                            value={draft.businessFooter}
                            onChange={(e) => updateDraft('businessFooter', e.target.value)}
                            placeholder="Thank you for visiting!"
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </label>

                    <label style={labelStyle}>
                        Google Map Link
                        <input
                            type="url"
                            value={draft.googleMapLink}
                            onChange={(e) => updateDraft('googleMapLink', e.target.value)}
                            placeholder="https://maps.app.goo.gl/..."
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </label>

                    <label style={labelStyle}>
                        Public Domain (For Links)
                        <input
                            type="url"
                            value={draft.publicUrl}
                            onChange={(e) => updateDraft('publicUrl', e.target.value)}
                            placeholder="https://myapp.web.app"
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                    </label>
                </div>
            </div>

            {/* Sticky Save Button */}
            <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                backdropFilter: 'blur(12px)',
                flexShrink: 0
            }}>
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSave}
                    style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '14px',
                        border: 'none',
                        background: saved
                            ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                            : (isDirty ? 'var(--color-primary)' : 'var(--color-bg-base)'),
                        color: isDirty || saved ? 'white' : 'var(--color-text-muted)',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: isDirty ? 'pointer' : 'default',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.3s ease',
                        boxShadow: isDirty && !saved ? '0 4px 15px rgba(37, 99, 235, 0.3)' : 'none'
                    }}
                >
                    <AnimatePresence mode="wait">
                        {saved ? (
                            <motion.span
                                key="saved"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Check size={18} /> Saved Successfully!
                            </motion.span>
                        ) : (
                            <motion.span
                                key="save"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Save size={18} /> {isDirty ? 'Save Changes' : 'No Changes'}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </div>

            <style>{`
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </motion.div>
    );
};

export default BusinessSettings;
