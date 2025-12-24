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

async function cleanupPendingRequests() {
    console.log('Checking for pending title requests for Edgelord...');

    // Get Edgelord's profile ID
    const { data: profile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('name', 'Edgelord')
        .single();

    if (!profile) {
        console.log('Edgelord profile not found');
        return;
    }

    // Check for pending requests
    const { data: requests } = await supabase
        .from('title_requests')
        .select('*')
        .eq('profile_id', profile.id)
        .eq('status', 'pending');

    console.log(`Found ${requests?.length || 0} pending requests`);

    if (requests && requests.length > 0) {
        console.log('Pending requests:', JSON.stringify(requests, null, 2));

        console.log('\nDeleting pending requests (solo hunters don\'t need approval)...');
        const { error } = await supabase
            .from('title_requests')
            .delete()
            .eq('profile_id', profile.id)
            .eq('status', 'pending');

        if (error) {
            console.error('Error deleting requests:', error);
        } else {
            console.log('✅ Successfully deleted pending requests!');
        }
    } else {
        console.log('✅ No pending requests to clean up');
    }
}

cleanupPendingRequests();
