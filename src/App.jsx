import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './App.css';
import { TransactionProvider } from './context/TransactionContext';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { useTheme } from './context/useTheme';
import { InstallProvider } from './context/InstallContext';
import { MilestoneProvider } from './context/MilestoneContext';
import { InventoryProvider } from './context/InventoryContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { CustomerProvider } from './context/CustomerContext';
import { TableSessionProvider } from './context/TableSessionContext';
import MilestoneModal from './components/MilestoneModal';
import SettingsDrawer from './components/SettingsDrawer';
import DataManagementDrawer from './components/DataManagementDrawer';
import Home from './components/Home';
import Login from './components/Login';
import InstallPrompt from './components/InstallPrompt';
import PendingApproval from './components/PendingApproval';
import AdminConsole from './components/AdminConsole';
import BottomNav from './components/BottomNav';
import HapticHUD from './components/HapticHUD';
import ErrorBoundary from './components/ErrorBoundary';
import { setupGlobalErrorListeners } from './utils/logger';
import SuspenseLoader from './components/SuspenseLoader'; // [NEW]

// [Refactor] Lazy Load Heavy Components for Performance
const Billing = lazy(() => import('./components/Billing'));
const Orders = lazy(() => import('./components/Orders'));
const Inventory = lazy(() => import('./components/Inventory'));
const PublicInvoice = lazy(() => import('./components/PublicInvoice'));
const WaiterLayout = lazy(() => import('./features/waiter/WaiterLayout'));
const KitchenBoard = lazy(() => import('./features/kitchen/KitchenBoard'));
// Analytics & Reports are currently inside Home/Dashboard, but if referenced by Route, lazy load them.
// Currently MainLayout defines routes.

import { AnimatePresence } from 'framer-motion';
import PageTransition from './components/PageTransition';

const MainLayout = () => {
  const location = useLocation();
  const { navVisible, isMobile } = useSettings();

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ 
        flex: 1, 
        minHeight: 0, 
        position: 'relative', 
        overflow: 'hidden',
        paddingBottom: (isMobile && navVisible) ? '90px' : '0px',
        transition: 'padding-bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <Suspense fallback={<SuspenseLoader />}>
          <AnimatePresence mode="wait" initial={false}>
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><Home /></PageTransition>} />
              <Route path="/billing" element={<PageTransition><Billing /></PageTransition>} />
              <Route path="/orders" element={<PageTransition><Orders /></PageTransition>} />
              <Route path="/inventory" element={<PageTransition><Inventory /></PageTransition>} />
              <Route path="/waiter" element={<PageTransition><WaiterLayout /></PageTransition>} />
              <Route path="/kitchen" element={<PageTransition><KitchenBoard /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </div>
      <BottomNav />
    </div>
  );
};

// Wrapper to pass User Context to ErrorBoundary
const ErrorBoundaryWrapper = ({ children }) => {
  const { user } = useAuth();

  useEffect(() => {
    setupGlobalErrorListeners(user);
  }, [user]);

  return (
    <ErrorBoundary user={user}>
      {children}
    </ErrorBoundary>
  );
};

const ProtectedApp = () => {
  const { user, isAllowed, role, loading, isImpersonating, stopImpersonating, businessName } = useAuth();

  if (loading || isAllowed === null) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100dvh',
      width: '100vw',
      backgroundColor: '#121212',
      color: '#ffffff',
      gap: '24px',
      position: 'absolute',
      inset: 0,
      zIndex: 99999,
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{
        position: 'relative',
        width: '64px',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Outer glowing spinning circle */}
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '3px solid transparent',
          borderTopColor: '#FFD700',
          borderBottomColor: '#FFD700',
          animation: 'appLoaderSpin 1.2s linear infinite',
        }} />
        {/* Inner pulsing badge */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#8B4513',
          boxShadow: '0 0 15px rgba(255, 215, 0, 0.4)',
          animation: 'appLoaderPulse 1.2s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'white',
          fontFamily: 'inherit'
        }}>
          LK
        </div>
      </div>
      
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px'
      }}>
        <div style={{ 
          fontSize: '1.2rem', 
          fontWeight: 700, 
          letterSpacing: '1.5px',
          color: '#E0E0E0'
        }}>
          The Classic Counter
        </div>
        <div style={{ 
          fontSize: '0.72rem', 
          letterSpacing: '2px', 
          color: '#8c7e72',
          textTransform: 'uppercase',
          fontWeight: 600
        }}>
          Sales & Expense Tracker
        </div>
      </div>

      <style>{`
        @keyframes appLoaderSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes appLoaderPulse {
          0%, 100% { transform: scale(0.92); opacity: 0.8; }
          50% { transform: scale(1.08); opacity: 1; }
        }
      `}</style>
    </div>
  );

  if (!user) return <Login />;

  if (role === 'super_admin') return <AdminConsole />;

  if (isAllowed === false) return <PendingApproval />;

  return (
    <TransactionProvider>
      <TableSessionProvider>
        <MilestoneProvider>
          <InventoryProvider>
            <SettingsProvider>
              <CustomerProvider>
                {isImpersonating && (
                  <div style={{
                    backgroundColor: '#1b3a24',
                    borderBottom: '1px solid #2e5c3b',
                    padding: '10px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: '#4ade80',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    zIndex: 99999,
                    position: 'relative',
                    fontFamily: 'system-ui, sans-serif'
                  }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>👁️</span> 
                      <span>SUPER ADMIN MODE: VIEWING <span style={{ color: 'white', textTransform: 'uppercase' }}>{businessName}</span></span>
                    </span>
                    <button 
                      onClick={stopImpersonating}
                      style={{
                        backgroundColor: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 6px rgba(239, 68, 68, 0.2)'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = 0.9}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = 1}
                    >
                      Exit Impersonation
                    </button>
                  </div>
                )}
                <InstallPrompt />
                <MainLayout />
                <SettingsDrawer />
                <HapticHUD />
                <DataManagementDrawer />
                <MilestoneModal />
              </CustomerProvider>
            </SettingsProvider>
          </InventoryProvider>
        </MilestoneProvider>
      </TableSessionProvider>
    </TransactionProvider>
  );
};

const AppContent = () => {
  return (
    <Suspense fallback={<SuspenseLoader />}>
      <Routes>
        {/* Public Route - Lazy Loaded */}
        <Route path="/view/:orderId" element={<PublicInvoice />} />

        {/* Protected Routes */}
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InstallProvider>
          <ThemeProvider>
            <ToastProvider>
              <ErrorBoundaryWrapper>
                <AppContent />
              </ErrorBoundaryWrapper>
            </ToastProvider>
          </ThemeProvider>
        </InstallProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
