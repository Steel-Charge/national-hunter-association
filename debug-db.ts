
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        envVars[key.trim()] = value.trim();
    }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProfile() {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('name', 'Lockjaw')
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Profile:', data);
        console.log('Avatar URL:', data.avatar_url);
        console.log('Type of Avatar URL:', typeof data.avatar_url);
    }
}

debugProfile();
