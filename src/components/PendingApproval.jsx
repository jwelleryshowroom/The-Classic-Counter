import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { ShieldAlert, LogOut, Send, Building, Phone, FileText, Clock, XCircle, RefreshCw, KeyRound, ArrowLeft, MapPin } from 'lucide-react';

const PendingStyle = () => (
    <style>{`
        .pending-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            width: 100vw;
            padding: 20px;
            box-sizing: border-box;
            background: #121212;
            overflow-y: auto;
        }
        .pending-card {
            width: 100%;
            background-color: #1a1a1a;
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 28px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            box-sizing: border-box;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .pending-card.compact {
            max-width: 440px;
            padding: 36px 30px;
        }
        .pending-card.wide {
            max-width: 900px;
            padding: 36px 40px;
        }
        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }
        .form-column {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }
        .form-actions {
            display: flex;
            gap: 16px;
            margin-top: 10px;
        }
        .form-actions button {
            flex: 1;
        }
        @media (max-width: 768px) {
            .pending-card.wide {
                max-width: 480px;
                padding: 28px 20px;
            }
            .form-grid {
                grid-template-columns: 1fr;
                gap: 16px;
            }
            .form-actions {
                flex-direction: column;
                gap: 12px;
            }
        }
    `}</style>
);

const PendingApproval = () => {
    const { user, application, submitApplication, reapply, logout } = useAuth();
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // State to toggle between "Access Restricted" and "Register Form"
    const [showForm, setShowForm] = useState(false);

    // Form states
    const [businessName, setBusinessName] = useState('');
    const [phone, setPhone] = useState('');
    const [type, setType] = useState('Restaurant');
    const [notes, setNotes] = useState('');
    const [street, setStreet] = useState('');
    const [landmark, setLandmark] = useState('');
    const [city, setCity] = useState('');
    const [stateField, setStateField] = useState('');
    const [pin, setPin] = useState('');
    const [googleMapLink, setGoogleMapLink] = useState('');
    
    // Captcha States
    const [captchaCode, setCaptchaCode] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Generate random 5-character Captcha (omitting confusing characters like I, 1, O, 0)
    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaCode(code);
        setCaptchaInput('');
    };

    // Generate initial captcha when form opens
    useEffect(() => {
        if (showForm) {
            generateCaptcha();
        }
    }, [showForm]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        if (!businessName.trim()) {
            setError('Please enter your business name.');
            return;
        }
        if (!phone.trim() || phone.length !== 10 || !/^\d+$/.test(phone)) {
            setError('Please enter a valid 10-digit mobile number.');
            return;
        }
        if (!street.trim()) {
            setError('Please enter the street name / building name.');
            return;
        }
        if (!city.trim()) {
            setError('Please enter the city / district.');
            return;
        }
        if (!stateField.trim()) {
            setError('Please enter the state.');
            return;
        }
        if (!pin.trim() || !/^\d{6}$/.test(pin.trim())) {
            setError('Please enter a valid 6-digit pin code.');
            return;
        }
        if (captchaInput.trim().toUpperCase() !== captchaCode) {
            setError('Incorrect security code. Please try again.');
            generateCaptcha();
            return;
        }

        const formattedAddress = `${street.trim()}${landmark.trim() ? ', ' + landmark.trim() : ''}\n${city.trim()}${stateField.trim() ? ', ' + stateField.trim() : ''}${pin.trim() ? ' ' + pin.trim() : ''}`.trim();

        setSubmitting(true);
        try {
            await submitApplication({
                businessName: businessName.trim(),
                phone: phone.trim(),
                type,
                notes: notes.trim(),
                address: formattedAddress,
                street: street.trim(),
                landmark: landmark.trim(),
                city: city.trim(),
                state: stateField.trim(),
                pin: pin.trim(),
                googleMapLink: googleMapLink.trim()
            });
        } catch (err) {
            console.error(err);
            setError('Failed to submit application. Please try again.');
            generateCaptcha();
        } finally {
            setSubmitting(false);
        }
    };

    const handleReapply = async () => {
        try {
            if (application) {
                setBusinessName(application.businessName || '');
                setPhone(application.phone || '');
                setType(application.type || 'Restaurant');
                setNotes(application.notes || '');
                setStreet(application.street || application.address || '');
                setLandmark(application.landmark || '');
                setCity(application.city || '');
                setStateField(application.state || '');
                setPin(application.pin || '');
                setGoogleMapLink(application.googleMapLink || '');
            }
            await reapply();
            setShowForm(true);
        } catch (err) {
            console.error(err);
        }
    };

    // Style helper for logout button hover
    const [hoverLogout, setHoverLogout] = useState(false);

    // 1. Show Application Status = Rejected
    if (application && application.status === 'rejected') {
        return (
            <div className="pending-container">
                <PendingStyle />
                <div className="pending-card compact animate-fade-in">
                    <div style={{ color: 'var(--color-danger)', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                        <XCircle size={64} style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.3))' }} />
                    </div>
                    
                    <h1 style={styles.title}>Application Rejected</h1>
                    <p style={styles.description}>
                        Your application for <strong>{application.businessName}</strong> could not be approved at this time.
                    </p>

                    {application.feedback && (
                        <div style={{
                            margin: '20px 0',
                            padding: '16px',
                            background: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            textAlign: 'left'
                        }}>
                            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-danger)', textTransform: 'uppercase', marginBottom: '4px' }}>
                                Admin Feedback:
                            </div>
                            <div style={{ fontSize: '0.9rem', color: isDark ? '#fca5a5' : '#991b1b', fontStyle: 'italic' }}>
                                "{application.feedback}"
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', marginTop: '24px' }}>
                        <button
                            onClick={handleReapply}
                            className="btn"
                            style={{ ...styles.submitBtn, backgroundColor: 'var(--color-primary)' }}
                        >
                            <RefreshCw size={18} /> Modify & Re-submit
                        </button>

                        <button
                            onClick={logout}
                            onMouseEnter={() => setHoverLogout(true)}
                            onMouseLeave={() => setHoverLogout(false)}
                            className="btn"
                            style={{
                                ...styles.logoutBtn,
                                backgroundColor: hoverLogout ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                                borderColor: hoverLogout ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'
                            }}
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Show Application Status = Pending Approval
    if (application && application.status === 'pending') {
        return (
            <div className="pending-container">
                <PendingStyle />
                <div className="pending-card compact animate-fade-in">
                    <div style={{ color: '#f59e0b', marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
                        <ShieldAlert size={64} style={{ filter: 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.3))' }} />
                    </div>
                    
                    <h1 style={{ ...styles.title, color: 'var(--color-success)' }}>Access Pending</h1>
                    <p style={styles.description}>
                        Hello <strong>{user.displayName || user.email.split('@')[0]}</strong>,<br /><br />
                        Your account is waiting for administrator approval. Please contact the admin to enable access for:
                    </p>

                    <div style={{
                        margin: '24px 0',
                        padding: '16px',
                        background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                        border: '1px solid var(--color-border)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        wordBreak: 'break-all'
                    }}>
                        <code style={{
                            color: isDark ? '#ffffff' : '#000000',
                            fontSize: '0.95rem',
                            fontWeight: 600
                        }}>{user.email}</code>
                    </div>

                    <button
                        onClick={logout}
                        onMouseEnter={() => setHoverLogout(true)}
                        onMouseLeave={() => setHoverLogout(false)}
                        className="btn"
                        style={{
                            ...styles.logoutBtn,
                            width: '100%',
                            backgroundColor: hoverLogout ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                            borderColor: hoverLogout ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'
                        }}
                    >
                        <LogOut size={18} /> Logout
                    </button>
                </div>
            </div>
        );
    }

    // 3. Show Access Denied Gate (First State)
    if (!showForm) {
        return (
            <div className="pending-container">
                <PendingStyle />
                <div className="pending-card compact animate-fade-in">
                    <div style={{ color: '#ef4444', marginBottom: '24px', display: 'flex', justifyContent: 'center' }}>
                        <KeyRound size={64} style={{ filter: 'drop-shadow(0 0 10px rgba(239, 68, 68, 0.3))' }} />
                    </div>

                    <h1 style={styles.title}>Access Denied</h1>
                    <p style={{ ...styles.description, marginBottom: '32px' }}>
                        Hello <strong>{user.displayName || user.email.split('@')[0]}</strong>,<br /><br />
                        You do not have permissions to access the dashboard. If you represent a business, please request access to register your business workspace.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                        <button
                            onClick={() => setShowForm(true)}
                            className="btn"
                            style={styles.submitBtn}
                        >
                            <Building size={18} /> Request Access
                        </button>

                        <button
                            onClick={logout}
                            onMouseEnter={() => setHoverLogout(true)}
                            onMouseLeave={() => setHoverLogout(false)}
                            className="btn"
                            style={{
                                ...styles.logoutBtn,
                                backgroundColor: hoverLogout ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                                borderColor: hoverLogout ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'
                            }}
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 4. Show Onboarding Signup Form (Second State with Captcha)
    return (
        <div className="pending-container">
            <PendingStyle />
            <div className="pending-card wide animate-fade-in">
                
                {/* Header Row with Back Button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <button
                        onClick={() => setShowForm(false)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#ffffff',
                            cursor: 'pointer',
                            padding: '6px',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    
                    <div style={styles.logoBadgeSmall}>
                        <Building size={16} color="white" />
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>The Classic Counter</span>
                </div>

                <h1 style={{ ...styles.title, textAlign: 'left', fontSize: '1.6rem' }}>Register Business</h1>
                <p style={{ ...styles.subtitle, textAlign: 'left', margin: '0 0 24px' }}>
                    Apply for a business dashboard. Every request is vetted for quality and security.
                </p>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        color: '#f87171',
                        padding: '12px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        marginBottom: '20px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        textAlign: 'left'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="pending-form">
                    <div className="form-grid">
                        {/* Left Column */}
                        <div className="form-column">
                            {/* Business Name */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Business Name</label>
                                <div style={styles.inputWrapper}>
                                    <Building size={16} style={styles.inputIcon} />
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="e.g. Mona Jewelry"
                                        value={businessName}
                                        onChange={(e) => setBusinessName(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            {/* Phone & Type Row */}
                            <div style={styles.row}>
                                <div style={{ ...styles.inputGroup, flex: 1.2 }}>
                                    <label style={styles.label}>Phone Number</label>
                                    <div style={styles.inputWrapper}>
                                        <Phone size={16} style={styles.inputIcon} />
                                        <input
                                            type="text"
                                            maxLength={10}
                                            style={styles.input}
                                            placeholder="10 digit mobile"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>

                                <div style={{ ...styles.inputGroup, flex: 0.8 }}>
                                    <label style={styles.label}>Type</label>
                                    <select
                                        style={styles.select}
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                        disabled={submitting}
                                    >
                                        <option value="Restaurant">Restaurant</option>
                                        <option value="Jewelry Showroom">Jewelry</option>
                                        <option value="Grocery Store">Grocery</option>
                                        <option value="Boutique">Boutique</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            {/* Address */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Business Address</label>
                                
                                {/* Street Name */}
                                <div style={styles.inputWrapper}>
                                    <Building size={16} style={styles.inputIcon} />
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="Street / Building Name (e.g. Mahavir Marg)"
                                        value={street}
                                        onChange={(e) => setStreet(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>

                                {/* Nearby Location */}
                                <div style={styles.inputWrapper}>
                                    <MapPin size={16} style={styles.inputIcon} />
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="Nearby Location / Landmark (e.g. opp. Hotel Shyam Palace)"
                                        value={landmark}
                                        onChange={(e) => setLandmark(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>

                                {/* City, State, Pin Row */}
                                <div style={styles.row}>
                                    <div style={{ ...styles.inputWrapper, flex: 1.2 }}>
                                        <input
                                            type="text"
                                            style={{ ...styles.input, paddingLeft: '16px' }}
                                            placeholder="City / District"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div style={{ ...styles.inputWrapper, flex: 0.8 }}>
                                        <input
                                            type="text"
                                            style={{ ...styles.input, paddingLeft: '16px' }}
                                            placeholder="State"
                                            value={stateField}
                                            onChange={(e) => setStateField(e.target.value)}
                                            disabled={submitting}
                                        />
                                    </div>
                                    <div style={{ ...styles.inputWrapper, flex: 1 }}>
                                        <input
                                            type="text"
                                            maxLength={6}
                                            style={{ ...styles.input, paddingLeft: '16px' }}
                                            placeholder="Pin Code"
                                            value={pin}
                                            onChange={(e) => setPin(e.target.value)}
                                            disabled={submitting}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="form-column">
                            {/* Google Map Link */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Google Map Link</label>
                                <div style={styles.inputWrapper}>
                                    <MapPin size={16} style={styles.inputIcon} />
                                    <input
                                        type="text"
                                        style={styles.input}
                                        placeholder="https://maps.app.goo.gl/..."
                                        value={googleMapLink}
                                        onChange={(e) => setGoogleMapLink(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            {/* Additional Notes */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Additional Notes</label>
                                <div style={styles.inputWrapper}>
                                    <FileText size={16} style={{ ...styles.inputIcon, top: '20px' }} />
                                    <textarea
                                        style={{ ...styles.textarea, minHeight: '80px' }}
                                        placeholder="Tell us about your requirements..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        disabled={submitting}
                                    />
                                </div>
                            </div>

                            {/* Security Verification */}
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Security Verification</label>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                                    {/* Visual distored text card */}
                                    <div style={styles.captchaBox}>
                                        <span style={styles.captchaText}>{captchaCode}</span>
                                        {/* Diagonal scratch lines overlay */}
                                        <div style={styles.captchaScratchLines}></div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={generateCaptcha}
                                        style={styles.captchaRefreshBtn}
                                        title="Refresh Code"
                                    >
                                        <RefreshCw size={18} />
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    maxLength={5}
                                    style={styles.input}
                                    placeholder="Enter the 5-letter code above"
                                    value={captchaInput}
                                    onChange={(e) => setCaptchaInput(e.target.value)}
                                    disabled={submitting}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={logout}
                            onMouseEnter={() => setHoverLogout(true)}
                            onMouseLeave={() => setHoverLogout(false)}
                            style={{
                                ...styles.logoutBtn,
                                backgroundColor: hoverLogout ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                                borderColor: hoverLogout ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.15)'
                            }}
                            className="btn"
                        >
                            <LogOut size={18} /> Logout
                        </button>

                        <button
                            type="submit"
                            className="btn"
                            disabled={submitting}
                            style={styles.submitBtn}
                        >
                            <Send size={18} /> {submitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        padding: '20px',
        textAlign: 'center',
        background: '#121212', // Matches mockup dark background
    },
    card: {
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#1a1a1a', // Sleek premium card
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '28px',
        padding: '36px 30px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    },
    logoBadgeSmall: {
        width: '28px',
        height: '28px',
        borderRadius: '8px',
        backgroundColor: '#22c55e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: '2rem',
        fontWeight: 800,
        color: '#ffffff',
        margin: '0 0 10px',
        letterSpacing: '-0.5px'
    },
    subtitle: {
        fontSize: '0.92rem',
        color: '#a3a3a3',
        lineHeight: 1.5,
        margin: '0 0 32px'
    },
    description: {
        fontSize: '0.95rem',
        color: '#d4d4d4',
        lineHeight: 1.6,
        margin: '0'
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        textAlign: 'left'
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
    },
    label: {
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#a3a3a3',
        textTransform: 'uppercase',
        letterSpacing: '1px'
    },
    inputWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    inputIcon: {
        position: 'absolute',
        left: '16px',
        color: '#737373',
        pointerEvents: 'none'
    },
    input: {
        width: '100%',
        padding: '14px 16px 14px 44px',
        background: '#242424',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px',
        color: '#ffffff',
        fontSize: '0.95rem',
        outline: 'none',
        transition: 'all 0.2s',
    },
    select: {
        width: '100%',
        padding: '14px 16px',
        background: '#242424',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px',
        color: '#ffffff',
        fontSize: '0.95rem',
        outline: 'none',
        cursor: 'pointer',
        appearance: 'none',
        backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 16px center',
        backgroundSize: '16px'
    },
    textarea: {
        width: '100%',
        minHeight: '80px',
        padding: '14px 16px 14px 44px',
        background: '#242424',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '14px',
        color: '#ffffff',
        fontSize: '0.95rem',
        outline: 'none',
        resize: 'vertical',
        fontFamily: 'inherit'
    },
    row: {
        display: 'flex',
        gap: '16px'
    },
    captchaBox: {
        position: 'relative',
        background: 'repeating-linear-gradient(45deg, #181818, #181818 10px, #202020 10px, #202020 20px)',
        border: '1px dashed rgba(255,255,255,0.12)',
        borderRadius: '12px',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        userSelect: 'none'
    },
    captchaText: {
        fontFamily: '"Courier New", Courier, monospace',
        fontSize: '1.4rem',
        fontWeight: 900,
        color: '#22c55e',
        letterSpacing: '5px',
        fontStyle: 'italic',
        transform: 'rotate(-2deg)',
        textShadow: '1px 1px 3px rgba(0,0,0,0.8)'
    },
    captchaScratchLines: {
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        background: 'linear-gradient(135deg, transparent 46%, rgba(255,255,255,0.08) 49%, rgba(255,255,255,0.08) 51%, transparent 54%), linear-gradient(45deg, transparent 46%, rgba(255,255,255,0.08) 49%, rgba(255,255,255,0.08) 51%, transparent 54%)'
    },
    captchaRefreshBtn: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#ffffff',
        padding: '10px',
        borderRadius: '10px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    submitBtn: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#22c55e',
        color: 'white',
        border: 'none',
        borderRadius: '14px',
        fontSize: '1rem',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
    },
    logoutBtn: {
        width: '100%',
        padding: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        color: '#e5e5e5',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '14px',
        fontSize: '1rem',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s'
    }
};

export default PendingApproval;
