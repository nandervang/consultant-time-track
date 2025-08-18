// Simple test to check database tables and create them if needed
import { supabase } from './lib/supabase.js';

async function testAndCreateTables() {
  try {
    console.log('Testing database connection...');
    
    // Test if cash_flow_entries table exists by trying to select from it
    const { data: testData, error: testError } = await supabase
      .from('cash_flow_entries')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('cash_flow_entries table does not exist:', testError.message);
      
      // Try to create the table using RPC or direct SQL
      console.log('You need to run the SQL from create_tables_manual.sql in your Supabase SQL editor');
      console.log('1. Go to https://supabase.com/dashboard/project/eloldmdciulxzwsnlvci/sql');
      console.log('2. Copy and paste the SQL from create_tables_manual.sql');
      console.log('3. Click "Run" to execute the SQL');
      
      return false;
    } else {
      console.log('✅ cash_flow_entries table exists!');
      console.log('Test data:', testData);
      return true;
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
}

// Run the test
testAndCreateTables();
