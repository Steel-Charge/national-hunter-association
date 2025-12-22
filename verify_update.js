const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [k, v] = line.split('=');
    if (k && v) envVars[k.trim()] = v.trim();
});

const client = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function updateToto() {
    console.log('Attempting to update Toto bio...');
    const { data, error } = await client
        .from('profiles')
        .update({ bio: 'Test Bio from Script', manager_comment: 'Test Comment' })
        .eq('name', 'Toto')
        .select();

    if (error) {
        console.error('Update Error:', error);
    } else {
        console.log('Update Success:', data);
    }
}

updateToto();
