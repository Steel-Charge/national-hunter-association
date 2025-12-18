

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

const IMAGE_PATH = "C:/Users/shyle/.gemini/antigravity/brain/4237812a-c606-4d60-b5b1-590fbce3db37/uploaded_image_0_1765977314709.jpg";

async function testUpload() {
    try {
        console.log('Reading file...');
        const buffer = fs.readFileSync(IMAGE_PATH);
        console.log('File size:', buffer.length, 'bytes');

        const base64 = 'data:image/jpeg;base64,' + buffer.toString('base64');
        console.log('Base64 length:', base64.length);

        console.log('Attempting DB update for Lockjaw...');
        const { data, error } = await supabase
            .from('profiles')
            .update({ avatar_url: base64 })
            .eq('name', 'Lockjaw')
            .select();

        if (error) {
            console.error('DB Update Error:', error);
        } else {
            console.log('DB Update Success!');
            // console.log('Data:', data); // Don't log full data if it's huge
        }

    } catch (err) {
        console.error('Script Error:', err);
    }
}

testUpload();
