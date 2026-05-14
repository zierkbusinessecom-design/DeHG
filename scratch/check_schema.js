
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkSchema() {
  const { data, error } = await supabase
    .from('disciplinary_records')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error fetching:', error);
  } else {
    console.log('Data:', data);
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    } else {
      console.log('No data found, trying to get columns via RPC or another way...');
    }
  }
}

checkSchema();
