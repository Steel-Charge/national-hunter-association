const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('DATABASE_URL=')) {
            console.log('DATABASE_URL found');
            // Extract it to print? verify it looks like postgres://...
            const lines = envContent.split('\n');
            const dbLine = lines.find(l => l.startsWith('DATABASE_URL='));
            if (dbLine) console.log('URL Prefix:', dbLine.substring(0, 15));
        } else {
            console.log('DATABASE_URL NOT found');
        }
    } else {
        console.log('.env.local not found');
    }
} catch (err) {
    console.error(err);
}
