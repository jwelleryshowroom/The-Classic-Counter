import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

try {
    // Initialize firebase-admin. Since we don't pass explicit credentials,
    // it will try to load Application Default Credentials (ADC) from the environment.
    initializeApp({
        projectId: 'classicconfection'
    });
    
    const db = getFirestore();
    const snap = await db.collection('authorized_users').get();
    console.log(`Success! Found ${snap.size} authorized users.`);
} catch (error) {
    console.error("Failed to initialize or fetch from Firestore:", error.message);
}
