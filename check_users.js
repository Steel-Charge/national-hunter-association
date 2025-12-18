const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

async function checkUsers() {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const { data, error } = await supabase.from('profiles').select('name').in('name', ['Don', 'Donna']);

    if (error) {
        console.log('ERROR: ' + error.message);
    } else {
        console.log('USERS_FOUND: ' + data.map(u => u.name).join(', '));
    }
}

checkUsers();
