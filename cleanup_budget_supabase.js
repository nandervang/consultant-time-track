// Cleanup budget planning entries from cash_flow_entries table
// Run this in the browser console on your cash flow page when logged in

const cleanupBudgetEntries = async () => {
  console.log('🧹 Starting cleanup of budget planning entries...');
  
  // First, check what budget entries exist
  const { data: budgetEntries, error: fetchError } = await supabase
    .from('cash_flow_entries')
    .select('*')
    .eq('is_budget_entry', true);

  if (fetchError) {
    console.error('❌ Error fetching budget entries:', fetchError);
    return;
  }

  console.log(`🔍 Found ${budgetEntries.length} budget planning entries to remove:`, budgetEntries);

  if (budgetEntries.length === 0) {
    console.log('✅ No budget planning entries found in cash_flow_entries table');
    return;
  }

  // Delete all budget planning entries
  const { error: deleteError } = await supabase
    .from('cash_flow_entries')
    .delete()
    .eq('is_budget_entry', true);

  if (deleteError) {
    console.error('❌ Error deleting budget entries:', deleteError);
    return;
  }

  console.log(`✅ Successfully removed ${budgetEntries.length} budget planning entries from cash_flow_entries table`);
  
  // Verify cleanup
  const { data: remaining, error: verifyError } = await supabase
    .from('cash_flow_entries')
    .select('count')
    .eq('is_budget_entry', true);

  if (verifyError) {
    console.error('❌ Error verifying cleanup:', verifyError);
    return;
  }

  console.log('✅ Cleanup verification: Budget entries remaining in cash_flow_entries:', remaining?.length || 0);
  console.log('🔄 Refresh your cash flow page to see the changes');
};

// Run the cleanup
cleanupBudgetEntries();