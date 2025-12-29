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

async function checkPolicies() {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    console.log('Checking policies for connections table...');
    const { data, error } = await supabase.rpc('debug_get_policies', { tablename: 'connections' });

    // If debug_get_policies doesn't exist, we'll try a different way.
    if (error) {
        console.log('RPC debug_get_policies not found. Trying information_schema...');
        // We can't really query pg_policies via anon key unless we have a specific function.
        // Let's try to perform an insert and see the error.

        console.log('Attempting test insert...');
        const { error: insertError } = await supabase
            .from('connections')
            .insert({ user_id: '00000000-0000-0000-0000-000000000000', friend_id: '00000000-0000-0000-0000-000000000001', status: 'pending' });

        if (insertError) {
            console.log('Insert failed:', insertError.message, insertError.code);
        } else {
            console.log('Insert SUCCEEDED (this might be unexpected if RLS is tight)');
        }
    } else {
        console.log('Policies:', JSON.stringify(data, null, 2));
    }
}

checkPolicies();
