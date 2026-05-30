import fs from 'fs';
import os from 'os';
import path from 'path';

try {
    const configPath = path.join(os.homedir(), '.config', 'configstore', 'firebase-tools.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        console.log("Success! Read firebase-tools.json.");
        console.log("Keys available:", Object.keys(config));
        if (config.tokens) {
            console.log("Tokens available:", Object.keys(config.tokens));
        }
    } else {
        console.log("firebase-tools.json not found at:", configPath);
    }
} catch (error) {
    console.error("Error reading config:", error.message);
}
