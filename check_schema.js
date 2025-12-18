const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Basic .env parser
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

async function checkSchema() {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const { data, error } = await supabase.from('profiles').select('profile_type').limit(1);

    if (error) {
        console.log('COLUMN_MISSING: ' + error.message);
    } else {
        console.log('COLUMN_EXISTS');
    }
}

checkSchema();
