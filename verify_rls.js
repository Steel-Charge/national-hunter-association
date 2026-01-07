
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) env[key.trim()] = value.trim();
    });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyRLS() {
    console.log('Verifying RLS Settings...');

    // We can't query pg_tables/pg_policies directly with ANON key usually, 
    // unless exposes via RPC or open policy.
    // Try RPC first if available (debug_get_policies or similar)
    // If not, we will try to insert/select and see if it works without error.

    // Test Agents
    console.log('Testing Profiles Table...');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('id').limit(1);
    if (pError) console.error('Profiles Check Failed:', pError.message);
    else console.log('Profiles Check OK');

    // Test Agencies
    console.log('Testing Agencies Table...');
    const { data: agencies, error: aError } = await supabase.from('agencies').select('id').limit(1);
    if (aError) console.error('Agencies Check Failed:', aError.message);
    else console.log('Agencies Check OK');

    // Test Connections
    console.log('Testing Connections Table...');
    const { data: connections, error: cError } = await supabase.from('connections').select('id').limit(1);
    if (cError) console.error('Connections Check Failed:', cError.message);
    else console.log('Connections Check OK');

}

verifyRLS();
