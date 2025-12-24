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

async function checkDetailedSchema() {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const { data: columnData, error } = await supabase.rpc('get_column_details', { t_name: 'profiles' });

    if (error) {
        // If RPC doesn't exist, try a direct query to information_schema (might fail due to permissions)
        console.log('RPC failed, trying direct select...');
        const { data, error: selectError } = await supabase.from('profiles').select('*').limit(1);
        if (selectError) {
            console.log('Error: ' + selectError.message);
        } else {
            console.log('Columns: ' + Object.keys(data[0]).join(', '));
            // Check sample role
            console.log('Sample Role: ' + data[0].role);
        }
    } else {
        console.log(JSON.stringify(columnData, null, 2));
    }
}

checkDetailedSchema();
