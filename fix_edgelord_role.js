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

async function fixEdgelordRole() {
    console.log('Checking Edgelord\'s current role...');

    const { data: before, error: beforeError } = await supabase
        .from('profiles')
        .select('name, role, agency_id, is_admin')
        .eq('name', 'Edgelord')
        .single();

    if (beforeError) {
        console.error('Error fetching profile:', beforeError);
        return;
    }

    console.log('Before:', JSON.stringify(before, null, 2));

    if (before.role === 'Solo') {
        console.log('✅ Edgelord is already set to Solo role!');
        return;
    }

    console.log('\nUpdating Edgelord to Solo role...');

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'Solo', agency_id: null })
        .eq('name', 'Edgelord');

    if (updateError) {
        console.error('Error updating profile:', updateError);
        return;
    }

    const { data: after } = await supabase
        .from('profiles')
        .select('name, role, agency_id, is_admin')
        .eq('name', 'Edgelord')
        .single();

    console.log('\nAfter:', JSON.stringify(after, null, 2));
    console.log('\n✅ Successfully updated Edgelord to Solo role!');
}

fixEdgelordRole();
