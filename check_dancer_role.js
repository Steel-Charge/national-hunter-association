const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read environment variables from .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim();
    }
});

const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDancerRole() {
    const { data, error } = await supabase
        .from('profiles')
        .select('name, role, agency_id, is_admin')
        .eq('name', 'Dancer')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Dancer Profile:');
    console.log(JSON.stringify(data, null, 2));
}

checkDancerRole();
