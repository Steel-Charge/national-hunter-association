
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

async function fixAvatars() {
    console.log('Checking for malformed avatars...');

    // Fetch all profiles
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, name, avatar_url');

    if (error) {
        console.error('Error fetching profiles:', error);
        return;
    }

    for (const profile of profiles) {
        if (profile.avatar_url && profile.avatar_url.includes('data:image/jpeg:base64')) {
            console.log(`Fixing profile: ${profile.name}`);
            const fixedUrl = profile.avatar_url.replace('data:image/jpeg:base64', 'data:image/jpeg;base64');

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: fixedUrl })
                .eq('id', profile.id);

            if (updateError) {
                console.error(`Failed to update ${profile.name}:`, updateError);
            } else {
                console.log(`Successfully fixed ${profile.name}`);
            }
        }
    }
    console.log('Done.');
}

fixAvatars();
