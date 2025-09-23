console.log('Testing salary integration...');

// This script helps verify the salary data integration
// Run this in your browser console on the cash flow page

// 1. Check if salary data is being fetched
console.log('💰 Checking salary data...');

// Check localStorage or make a direct query to see salary data
async function checkSalaryData() {
  const { createClient } = window.supabase || {};
  if (!createClient) {
    console.log('❌ Supabase not available');
    return;
  }

  try {
    // Replace with your actual supabase client initialization
    const supabase = createClient(
      process.env.REACT_APP_SUPABASE_URL,
      process.env.REACT_APP_SUPABASE_ANON_KEY
    );

    // Check salary employees
    const { data: employees, error: empError } = await supabase
      .from('salary_employees')
      .select('*')
      .eq('is_active', true);

    console.log('👥 Active employees:', employees?.length || 0);
    if (employees) {
      employees.forEach(emp => {
        console.log(`  - ${emp.name}: ${emp.base_salary} SEK (${emp.position || 'No position'})`);
      });
    }

    // Check salary payments
    const { data: payments, error: payError } = await supabase
      .from('salary_payments')
      .select('*')
      .eq('status', 'paid');

    console.log('💳 Paid salary payments:', payments?.length || 0);

  } catch (error) {
    console.error('Error checking salary data:', error);
  }
}

checkSalaryData();