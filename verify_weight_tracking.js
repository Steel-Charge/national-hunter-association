const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local manually
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^"|"$/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase URL or Key in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyWeightTracking() {
    console.log('--- Verifying Weight Tracking Feature ---');

    try {
        // 1. Get a test profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id, name')
            .limit(1)
            .single();

        if (profileError) throw profileError;
        console.log(`Using test profile: ${profile.name} (${profile.id})`);

        const testDate = new Date().toISOString().split('T')[0];
        const testWeight = 75.5;

        // 2. Insert/Upsert a weight entry
        console.log(`Inserting weight entry: ${testWeight} kg on ${testDate}...`);
        const { data: insertData, error: insertError } = await supabase
            .from('weight_entries')
            .upsert({
                profile_id: profile.id,
                date: testDate,
                weight: testWeight
            }, { onConflict: 'profile_id, date' })
            .select()
            .single();

        if (insertError) {
            if (insertError.code === '42P01') {
                console.error('FAILED: Table "weight_entries" does not exist. Please run create_weight_entries.sql in Supabase Dashboard.');
                process.exit(1);
            }
            throw insertError;
        }
        console.log('SUCCESS: Weight entry inserted/updated.');

        // 3. Select weight entries for the profile
        console.log('Fetching weight entries...');
        const { data: entries, error: selectError } = await supabase
            .from('weight_entries')
            .select('*')
            .eq('profile_id', profile.id);

        if (selectError) throw selectError;
        console.log(`SUCCESS: Found ${entries.length} entries for ${profile.name}.`);

        // 4. Cleanup (optional, but good practice for testing)
        // console.log('Cleaning up test entry...');
        // await supabase.from('weight_entries').delete().eq('id', insertData.id);
        // console.log('SUCCESS: Cleanup complete.');

        console.log('--- Verification Successful ---');
    } catch (error) {
        console.error('Verification failed:', error.message);
        process.exit(1);
    }
}

verifyWeightTracking();
