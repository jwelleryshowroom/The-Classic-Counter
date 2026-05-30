import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PublicInvoice from '../PublicInvoice';
import { getDoc, doc } from 'firebase/firestore';

// Mock react-router-dom useParams
vi.mock('react-router-dom', () => ({
    useParams: () => ({ orderId: 'test-order-123' })
}));

// Mock firebase/firestore
vi.mock('firebase/firestore', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        doc: vi.fn((db, ...pathSegments) => ({
            db,
            path: pathSegments.join('/')
        })),
        getDoc: vi.fn()
    };
});

// Mock ../firebase config
vi.mock('../../firebase', () => ({
    db: {}
}));

describe('PublicInvoice Component - Senior Test Suite', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset window.location
        delete window.location;
        window.location = new URL('https://classiccounter.web.app/view/test-order-123');
    });

    it('should display loading state initially', async () => {
        // Mock getDoc to return a promise that doesn't resolve immediately
        getDoc.mockReturnValue(new Promise(() => {}));

        render(<PublicInvoice />);
        expect(screen.getByText(/LOADING INVOICE.../i)).toBeInTheDocument();
    });

    it('should render invoice successfully when transaction is found directly', async () => {
        // Mock valid transaction
        const mockTransaction = {
            id: 'test-order-123',
            type: 'sale',
            totalValue: 500,
            amount: 500,
            createdAt: '2026-05-30T13:28:17.448Z',
            items: [
                { name: 'Chocolate Cupcake', qty: 2, price: 150 },
                { name: 'Vanilla Pastry', qty: 1, price: 200 }
            ],
            payment: {
                method: 'cash',
                status: 'paid'
            }
        };

        getDoc.mockResolvedValueOnce({
            exists: () => true,
            id: 'test-order-123',
            data: () => mockTransaction
        });

        // Set search query ?biz=biz_4275ajbo
        window.location = new URL('https://classiccounter.web.app/view/test-order-123?biz=biz_4275ajbo');

        render(<PublicInvoice />);

        // Verify it stops loading and renders receipt details
        await waitFor(() => {
            expect(screen.queryByText(/LOADING INVOICE.../i)).not.toBeInTheDocument();
        });

        expect(screen.getAllByText('The Classic Counter')[0]).toBeInTheDocument();
        expect(screen.getByText('Chocolate Cupcake')).toBeInTheDocument();
        expect(screen.getByText('Vanilla Pastry')).toBeInTheDocument();
        expect(screen.getAllByText('₹500.00')[0]).toBeInTheDocument(); // total/subtotal value
    });

    it('should fall back to checking all known business IDs in parallel if biz param is missing or fails', async () => {
        const mockTransaction = {
            id: 'test-order-123',
            type: 'sale',
            totalValue: 350,
            amount: 350,
            createdAt: '2026-05-30T13:28:17.448Z',
            items: [{ name: 'Momo Plate', qty: 1, price: 350 }],
            payment: { method: 'upi', status: 'paid' }
        };

        // Mock calls:
        // 1st call for default/'biz_tc6b61d1': returns false (does not exist)
        // 2nd call for 'biz_4275ajbo': returns true (found!)
        // Others return false or resolve later
        getDoc.mockImplementation(async (docRef) => {
            const path = docRef.path;
            if (path.includes('biz_4275ajbo')) {
                return {
                    exists: () => true,
                    id: 'test-order-123',
                    data: () => mockTransaction
                };
            }
            return {
                exists: () => false
            };
        });

        // Set search URL without biz parameter (testing fallback search)
        window.location = new URL('https://classiccounter.web.app/view/test-order-123');

        render(<PublicInvoice />);

        await waitFor(() => {
            expect(screen.getByText('Momo Plate')).toBeInTheDocument();
        });

        // Check store details are displayed
        expect(screen.getAllByText('The Classic Counter')[0]).toBeInTheDocument();
        // Expect getDoc to be called multiple times for fallback search
        expect(getDoc).toHaveBeenCalled();
        expect(getDoc.mock.calls.length).toBeGreaterThan(1);
    });

    it('should display error screen when transaction does not exist anywhere', async () => {
        // Mock getDoc to return exists: false for all paths
        getDoc.mockResolvedValue({
            exists: () => false
        });

        window.location = new URL('https://classiccounter.web.app/view/test-order-123');

        render(<PublicInvoice />);

        await waitFor(() => {
            expect(screen.getByText('Invoice not found.')).toBeInTheDocument();
        });
        expect(screen.getByText('Unavailable')).toBeInTheDocument();
    });
});
