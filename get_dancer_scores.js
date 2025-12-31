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

async function getDancerScores() {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('profiles').select('*').eq('name', 'Dancer').single();

    if (error) {
        console.log('ERROR: ' + error.message);
    } else {
        console.log('PROFILE_TYPE:', data.profile_type);
        console.log('SCORES:', JSON.stringify(data.test_scores, null, 2));
    }
}

getDancerScores();
