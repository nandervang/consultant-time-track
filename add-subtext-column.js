// Simple script to add company_subtext column to user_profiles table
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addCompanySubtextColumn() {
  try {
    console.log('Adding company_subtext column to user_profiles table...');
    
    // Add the column using raw SQL
    const { data, error } = await supabase.rpc('add_company_subtext_column');
    
    if (error) {
      console.error('Error adding column:', error);
      return;
    }
    
    console.log('✅ Successfully added company_subtext column');
  } catch (error) {
    console.error('Error:', error);
  }
}

addCompanySubtextColumn();
