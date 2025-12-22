const { createClient } = require('@supabase/supabase-js');

// Hardcoded for debugging since we know these were in env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tkhhdxwvmrfsbokjzfef.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '...'; // We need the key. 
// I'll assume the user has the env loaded or I can try to read it again. 
// Actually I'll use the debug-db approach of reading .env.local

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

async function checkToto() {
    const { data, error } = await client
        .from('profiles')
        .select('name, bio, manager_comment, video_url')
        .eq('name', 'Toto')
        .single();

    if (error) console.error('Error:', error);
    else console.log('Toto Profile:', data);
}

checkToto();
