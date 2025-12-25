require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixRoles() {
    console.log('Fixing user roles...\n');

    // Update Edgelord to Solo
    const { data: edgelord, error: edgelordError } = await supabase
        .from('profiles')
        .update({ role: 'Solo' })
        .eq('name', 'Edgelord')
        .select();

    if (edgelordError) {
        console.error('❌ Error updating Edgelord:', edgelordError);
    } else {
        console.log('✓ Updated Edgelord to Solo');
        console.log(JSON.stringify(edgelord, null, 2));
    }

    // Update Toto to Solo (in case they're stuck as Hunter)
    const { data: toto, error: totoError } = await supabase
        .from('profiles')
        .update({ role: 'Solo' })
        .eq('name', 'Toto')
        .select();

    if (totoError) {
        console.error('❌ Error updating Toto:', totoError);
    } else {
        console.log('\n✓ Updated Toto to Solo');
        console.log(JSON.stringify(toto, null, 2));
    }

    console.log('\n✅ Done! Roles have been updated.');
}

fixRoles();
