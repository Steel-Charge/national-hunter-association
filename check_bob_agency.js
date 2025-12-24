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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkBob() {
    const { data: bob, error } = await supabase
        .from('profiles')
        .select('name, role, agency_id')
        .eq('name', 'Bob')
        .single();

    if (error) {
        console.error('Error fetching Bob:', error);
    } else {
        console.log('Bob Profile:', bob);
    }

    // Also check Dancer
    const { data: dancer } = await supabase
        .from('profiles')
        .select('name, role, agency_id')
        .eq('name', 'Dancer')
        .single();

    console.log('Dancer Profile:', dancer);

    if (bob?.agency_id) {
        const { data: agency } = await supabase.from('agencies').select('*').eq('id', bob.agency_id).single();
        console.log('Bob Agency:', agency);
    }
}

checkBob();
