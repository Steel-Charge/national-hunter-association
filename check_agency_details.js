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

async function checkAgency() {
    const id = '3fd214e3-9554-445f-aa4d-53a991838abb';
    const { data: agency, error } = await supabase
        .from('agencies')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching Agency:', error);
    } else {
        console.log('Agency Details:', agency);
    }

    // Check if 'test' agency exists
    const { data: testAgency } = await supabase
        .from('agencies')
        .select('*')
        .eq('name', 'test')
        .single();

    console.log("'test' Agency Details:", testAgency);
}

checkAgency();
