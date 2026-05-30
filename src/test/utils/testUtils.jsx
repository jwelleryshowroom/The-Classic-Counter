import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../../context/ThemeContext';
import { ToastProvider } from '../../context/ToastContext';

/**
 * Custom render function that wraps components with necessary providers
 * Use this instead of @testing-library/react's render
 */
export const AllTheProviders = ({ children }) => {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
};

export const renderWithProviders = (ui, options = {}) => {
    return render(ui, { wrapper: AllTheProviders, ...options });
};

// Re-export everything from testing library
export * from '@testing-library/react';
export { renderWithProviders as render };
