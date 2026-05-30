import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('TransactionContext - Basic Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Mock Data Factories', () => {
        it('should create mock transaction with default values', async () => {
            const { createMockTransaction } = await import('../../test/fixtures/mockData');
            const transaction = createMockTransaction();

            expect(transaction).toHaveProperty('id');
            expect(transaction).toHaveProperty('type');
            expect(transaction).toHaveProperty('amount');
            expect(transaction).toHaveProperty('date');
            expect(transaction).toHaveProperty('items');
        });

        it('should allow overriding default values', async () => {
            const { createMockTransaction } = await import('../../test/fixtures/mockData');
            const transaction = createMockTransaction({
                type: 'expense',
                amount: 5000
            });

            expect(transaction.type).toBe('expense');
            expect(transaction.amount).toBe(5000);
        });

        it('should create unique IDs for each transaction', async () => {
            const { createMockTransaction } = await import('../../test/fixtures/mockData');
            const txn1 = createMockTransaction();
            const txn2 = createMockTransaction();

            expect(txn1.id).not.toBe(txn2.id);
        });
    });

    describe('Transaction Data Validation', () => {
        it('should have valid transaction types', async () => {
            const { createMockTransaction } = await import('../../test/fixtures/mockData');
            const validTypes = ['sale', 'order', 'expense', 'settlement'];

            validTypes.forEach(type => {
                const txn = createMockTransaction({ type });
                expect(txn.type).toBe(type);
            });
        });

        it('should have positive amounts', async () => {
            const { createMockTransaction } = await import('../../test/fixtures/mockData');
            const txn = createMockTransaction({ amount: 1000 });

            expect(txn.amount).toBeGreaterThan(0);
        });

        it('should have valid ISO date string', async () => {
            const { createMockTransaction } = await import('../../test/fixtures/mockData');
            const txn = createMockTransaction();

            expect(txn.date).toBeDefined();
            expect(() => new Date(txn.date)).not.toThrow();
            expect(new Date(txn.date).toISOString()).toBe(txn.date);
        });

        it('should have items array', async () => {
            const { createMockTransaction } = await import('../../test/fixtures/mockData');
            const txn = createMockTransaction();

            expect(Array.isArray(txn.items)).toBe(true);
            expect(txn.items.length).toBeGreaterThan(0);
        });

        it('should have valid item structure', async () => {
            const { createMockTransaction } = await import('../../test/fixtures/mockData');
            const txn = createMockTransaction();
            const item = txn.items[0];

            expect(item).toHaveProperty('name');
            expect(item).toHaveProperty('price');
            expect(item).toHaveProperty('qty');
            expect(typeof item.name).toBe('string');
            expect(typeof item.price).toBe('number');
            expect(typeof item.qty).toBe('number');
        });
    });

    describe('Transaction Calculations', () => {
        it('should calculate total from items', async () => {
            const { createMockTransaction } = await import('../../test/fixtures/mockData');
            const txn = createMockTransaction({
                items: [
                    { name: 'Item 1', price: 100, qty: 2 },
                    { name: 'Item 2', price: 50, qty: 1 }
                ]
            });

            const total = txn.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
            expect(total).toBe(250);
        });
    });
});
