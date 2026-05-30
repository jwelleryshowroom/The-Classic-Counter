import fs from 'fs';
import os from 'os';
import path from 'path';
import https from 'https';

function request(url, method, token, body = null) {
    return new Promise((resolve, reject) => {
        const u = new URL(url);
        const options = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        });
        req.on('error', (err) => reject(err));
        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
}

async function run() {
    const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
    if (!fs.existsSync(configPath)) {
        console.error("firebase-tools.json not found");
        process.exit(1);
    }
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const token = config.tokens?.access_token;
    if (!token) {
        console.error("No access token found in firebase-tools.json");
        process.exit(1);
    }

    const projectId = 'classicconfection';
    const targetId = 'biz_tc6b61d1';
    const baseDbPath = `projects/${projectId}/databases/(default)/documents`;

    console.log(`Starting Database Migration to Nested Subcollections for Target Business: ${targetId}`);

    const collectionsToMigrate = ['transactions', 'inventory_items', 'tableSessions', 'customers'];

    for (const collName of collectionsToMigrate) {
        console.log(`\n--- Migrating collection: ${collName} ---`);
        let url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collName}?pageSize=300`;
        const listResult = await request(url, 'GET', token);

        if (!listResult.documents) {
            console.log(`No documents found in flat collection ${collName} or empty.`);
            continue;
        }

        console.log(`Found ${listResult.documents.length} legacy documents in ${collName}.`);
        
        let batchWrites = [];
        let count = 0;

        for (const doc of listResult.documents) {
            const docId = doc.name.split('/').pop();
            const fields = doc.fields || {};
            
            // Check if document belongs to legacy (no businessId) or targets our businessId
            const docBizId = fields.businessId?.stringValue || null;
            
            const isTarget = !docBizId || docBizId === targetId || docId.startsWith(`${targetId}_`);

            if (isTarget) {
                // Determine new path and document ID
                let newDocId = docId;
                if (collName === 'customers') {
                    // Normalize phone number (strip businessId prefix if present)
                    const phone = fields.phone?.stringValue || docId.split('_').pop();
                    newDocId = phone;
                    fields.phone = { stringValue: phone };
                }

                // Add or update businessId field in the document fields
                fields.businessId = { stringValue: targetId };

                const newName = `${baseDbPath}/businesses/${targetId}/${collName}/${newDocId}`;
                const oldName = doc.name;

                // Add to batch writes: 1 set/update write + 1 delete write
                batchWrites.push({
                    update: {
                        name: newName,
                        fields: fields
                    }
                });

                batchWrites.push({
                    delete: oldName
                });

                count++;
            }
        }

        if (batchWrites.length > 0) {
            console.log(`Migrating ${count} documents (generating ${batchWrites.length} write operations)...`);
            // Firestore commit batch size limit is 500 writes. We will slice the array into chunks of 200 writes (100 docs).
            const chunkSize = 200;
            for (let i = 0; i < batchWrites.length; i += chunkSize) {
                const chunk = batchWrites.slice(i, i + chunkSize);
                const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
                const commitResult = await request(commitUrl, 'POST', token, { writes: chunk });
                if (commitResult.error) {
                    console.error(`Error committing batch:`, JSON.stringify(commitResult.error, null, 2));
                } else {
                    console.log(`Committed chunk of ${chunk.length} operations successfully.`);
                }
            }
        } else {
            console.log(`No matching documents to migrate in ${collName}.`);
        }
    }

    // 5. Migrate Settings
    console.log(`\n--- Migrating collection: settings ---`);
    const oldSettingsName = `${baseDbPath}/settings/${targetId}`;
    const newSettingsName = `${baseDbPath}/businesses/${targetId}/settings/config`;

    // Fetch old settings doc
    const settingsGetUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/${targetId}`;
    const settingsDoc = await request(settingsGetUrl, 'GET', token);

    if (settingsDoc && settingsDoc.fields) {
        console.log("Found legacy settings document. Copying to new subcollection...");
        const commitUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`;
        const commitResult = await request(commitUrl, 'POST', token, {
            writes: [
                {
                    update: {
                        name: newSettingsName,
                        fields: settingsDoc.fields
                    }
                },
                {
                    delete: oldSettingsName
                }
            ]
        });
        if (commitResult.error) {
            console.error("Error committing settings migration:", JSON.stringify(commitResult.error, null, 2));
        } else {
            console.log("Settings migrated successfully.");
        }
    } else {
        console.log("No legacy settings document found under old path.");
    }

    console.log("\nDatabase Migration completed successfully!");
}

run().catch(console.error);
