// Mock data factory functions for testing

export const createMockTransaction = (overrides = {}) => ({
    id: 'txn-' + Math.random().toString(36).substr(2, 9),
    type: 'sale',
    amount: 1000,
    date: new Date().toISOString(),
    items: [
        { name: 'Test Product', price: 500, qty: 2 }
    ],
    createdAt: new Date().toISOString(),
    ...overrides
});

export const createMockInventoryItem = (overrides = {}) => ({
    id: 'item-' + Math.random().toString(36).substr(2, 9),
    name: 'Black Forest Cake',
    price: 500,
    stock: 10,
    category: 'Cakes',
    image: '🎂',
    ...overrides
});

export const createMockOrder = (overrides = {}) => ({
    id: 'order-' + Math.random().toString(36).substr(2, 9),
    type: 'order',
    customer: {
        name: 'John Doe',
        phone: '1234567890',
        email: 'john@example.com'
    },
    items: [
        { name: 'Chocolate Cake', price: 500, qty: 1 }
    ],
    status: 'pending',
    totalValue: 500,
    amount: 500,
    payment: {
        method: 'cash',
        amount: 500,
        balance: 0
    },
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides
});

export const createMockCustomer = (overrides = {}) => ({
    id: 'customer-' + Math.random().toString(36).substr(2, 9),
    name: 'Jane Smith',
    phone: '9876543210',
    email: 'jane@example.com',
    address: '123 Main St',
    ...overrides
});

export const createMockUser = (overrides = {}) => ({
    uid: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'user@example.com',
    displayName: 'Test User',
    role: 'admin',
    ...overrides
});
