const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const hasDbUrl = envContent.includes('DATABASE_URL=');
    const hasDirectUrl = envContent.includes('DIRECT_URL=');

    console.log('DATABASE_URL_EXISTS:', hasDbUrl);
    console.log('DIRECT_URL_EXISTS:', hasDirectUrl);
} catch (e) {
    console.error('Error reading .env.local', e.message);
}
