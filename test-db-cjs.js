const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://eloldmdciulxzwsnlvci.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVsb2xkbWRjaXVseHp3c25sdmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUwMDkxMDYsImV4cCI6MjA2MDU4NTEwNn0.gh9vAFWK_kmkpYYC5NOgi4rs4lSQY7KhMs6UqPuX5nI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    console.log('Basic connection test:', { testData, testError });
    
    // Test cash flow entries table
    const { data: cashFlowData, error: cashFlowError } = await supabase
      .from('cash_flow_entries')
      .select('*')
      .limit(1);
    
    console.log('Cash flow entries test:', { cashFlowData, cashFlowError });
    
    // Test dashboard widgets table
    const { data: widgetsData, error: widgetsError } = await supabase
      .from('dashboard_widgets')
      .select('*')
      .limit(1);
    
    console.log('Dashboard widgets test:', { widgetsData, widgetsError });
    
    return { success: true };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return { success: false, error };
  }
}

// Run the test
testDatabaseConnection();
