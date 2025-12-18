const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://localhost:54321'; // Using local supabase if available, or the one from .env
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Placeholder, will use actual key in run_command

async function checkDancer() {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    const { data, error } = await supabase.from('profiles').select('name').eq('name', 'Dancer').single();
    if (error) {
        console.log('Dancer not found or error:', error.message);
    } else {
        console.log('Dancer found:', data);
    }
}

checkDancer();
