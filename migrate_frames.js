const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables manually
const envPath = path.resolve(__dirname, '.env.local');
const envData = fs.readFileSync(envPath, 'utf8');
const env = {};
envData.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabaseRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseRoleKey);

const sql = `
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS active_frame TEXT,
ADD COLUMN IF NOT EXISTS unlocked_frames TEXT[];

-- Update existing profiles to have 'Common' unlocked
UPDATE profiles 
SET unlocked_frames = ARRAY['Common'] 
WHERE unlocked_frames IS NULL;
`;

// Note: Many Supabase setups don't allow running raw SQL via JS unless an RPC is set up.
// For now, I'll attempt to update a dummy record to see if columns exist, 
// and if not, I'll inform the user they might need to run it manually if I can't.
// But usually, I've seen these projects have a 'supabase_admin' client or similar.

async function run() {
    console.log("Checking for columns...");
    const { data, error } = await supabase.from('profiles').select('*').limit(1);

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    const columns = Object.keys(data[0]);
    if (columns.includes('active_frame') && columns.includes('unlocked_frames')) {
        console.log("Columns already exist.");
    } else {
        console.log("Columns missing. Please run the SQL in add_frame_columns.sql in the Supabase Dashboard.");
        console.log("Columns found: " + columns.join(", "));
    }
}

run();
