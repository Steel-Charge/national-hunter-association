import { supabase } from './src/lib/supabase';

async function fixRoles() {
    console.log('Fixing user roles...');

    // Update Edgelord to Solo
    const { data: edgelord, error: edgelordError } = await supabase
        .from('profiles')
        .update({ role: 'Solo' })
        .eq('name', 'Edgelord')
        .select();

    if (edgelordError) {
        console.error('Error updating Edgelord:', edgelordError);
    } else {
        console.log('✓ Updated Edgelord to Solo:', edgelord);
    }

    // Update Toto to Solo (in case they're stuck as Hunter)
    const { data: toto, error: totoError } = await supabase
        .from('profiles')
        .update({ role: 'Solo' })
        .eq('name', 'Toto')
        .select();

    if (totoError) {
        console.error('Error updating Toto:', totoError);
    } else {
        console.log('✓ Updated Toto to Solo:', toto);
    }

    console.log('\nDone! Roles have been updated.');
    process.exit(0);
}

fixRoles();
