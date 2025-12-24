require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkEdgelordRole() {
    const { data, error } = await supabase
        .from('profiles')
        .select('name, role, agency_id, is_admin')
        .eq('name', 'Edgelord')
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Edgelord Profile:');
    console.log(JSON.stringify(data, null, 2));

    if (data.role !== 'Solo') {
        console.log('\n⚠️ WARNING: Edgelord role is not "Solo"!');
        console.log('Current role:', data.role);
        console.log('Expected role: Solo');
    }
}

checkEdgelordRole();
