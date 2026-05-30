import { vi } from 'vitest';

// Mock Firestore functions
export const mockFirestore = {
    collection: vi.fn(),
    doc: vi.fn(),
    addDoc: vi.fn(() => Promise.resolve({ id: 'mock-doc-id' })),
    updateDoc: vi.fn(() => Promise.resolve()),
    deleteDoc: vi.fn(() => Promise.resolve()),
    getDocs: vi.fn(() => Promise.resolve({ docs: [], empty: true })),
    onSnapshot: vi.fn((query, callback) => {
        // Immediately call with empty snapshot
        callback({ docs: [] });
        // Return unsubscribe function
        return vi.fn();
    }),
    query: vi.fn((collection) => collection),
    where: vi.fn((field, op, value) => ({ field, op, value })),
    orderBy: vi.fn((field, direction) => ({ field, direction })),
    writeBatch: vi.fn(() => ({
        delete: vi.fn(),
        commit: vi.fn(() => Promise.resolve())
    }))
};

// Mock Auth
export const mockAuth = {
    currentUser: {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
    },
    signInWithPopup: vi.fn(() => Promise.resolve({
        user: mockAuth.currentUser
    })),
    signOut: vi.fn(() => Promise.resolve()),
    onAuthStateChanged: vi.fn((callback) => {
        callback(mockAuth.currentUser);
        return vi.fn(); // unsubscribe
    })
};

// Mock Google Provider
export const mockGoogleProvider = {};

// Export mock db and auth
export const db = mockFirestore;
export const auth = mockAuth;
export const googleProvider = mockGoogleProvider;
