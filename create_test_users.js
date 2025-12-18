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

async function createUsers() {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

    const users = [
        { name: 'Don', profile_type: 'male_20_25' },
        { name: 'Donna', profile_type: 'female_15_20' }
    ];

    for (const user of users) {
        console.log(`Creating ${user.name}...`);
        const { data, error } = await supabase.from('profiles').insert([{
            name: user.name,
            password: 'yesplease',
            active_title: { name: 'Hunter', rarity: 'Common' },
            test_scores: {},
            settings: { statsCalculator: false, theme: null },
            is_admin: false,
            profile_type: user.profile_type
        }]).select().single();

        if (error) {
            console.log(`ERROR creating ${user.name}: ${error.message}`);
        } else {
            console.log(`SUCCESS creating ${user.name}`);
            // Add title
            await supabase.from('unlocked_titles').insert([{
                profile_id: data.id,
                name: 'Hunter',
                rarity: 'Common'
            }]);
        }
    }
}

createUsers();
