const { createClient } = require('@supabase/supabase-js');

async function listProfiles() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('profiles').select('name');
    if (error) {
        console.log('Error fetching profiles:', error.message);
    } else {
        console.log('Profiles in DB:', data.map(p => p.name).join(', '));
    }
}

listProfiles();
