import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rwguvflvltqcxuduzlux.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3V2Zmx2bHRxY3h1ZHV6bHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NjA5NzcsImV4cCI6MjA0OTMzNjk3N30.vIY2LLn2nF_IaKcQgtfbBzVNwqBVBUiLtdNAhKlR9Hc'
);

async function debugExpenseMatching() {
  console.log('=== EXPENSE TO BUDGET MATCHING ANALYSIS ===');
  
  // Get all budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log('Current budgets:', budgets?.length || 0);
  budgets?.forEach(b => {
    console.log(`- Budget: "${b.name}" | Category: "${b.category}" | ${b.budget_limit} SEK | Period: ${b.period}`);
  });

  // Get all expenses (not budget entries)
  const { data: expenses } = await supabase
    .from('cash_flow_entries')
    .select('*')
    .eq('type', 'expense')
    .eq('is_budget_entry', false)
    .order('date', { ascending: false });
  
  console.log('\n=== ACTUAL EXPENSES (not budget entries) ===');
  console.log('Total actual expenses:', expenses?.length || 0);
  
  expenses?.forEach(exp => {
    console.log(`- Expense: "${exp.description}" | Category: "${exp.category}" | ${exp.amount} SEK | Date: ${exp.date}`);
  });

  // Test category matching logic
  console.log('\n=== CATEGORY MATCHING TEST ===');
  if (budgets && expenses) {
    budgets.forEach(budget => {
      console.log(`\nTesting budget: "${budget.name}" (category: "${budget.category}")`);
      
      const matchingExpenses = expenses.filter(exp => {
        const budgetCat = budget.category.toLowerCase();
        const expCat = exp.category.toLowerCase();
        
        // Exact match
        if (expCat === budgetCat) return true;
        
        // Keyword matching for common categories
        if ((budgetCat.includes('travel') || budgetCat.includes('resa')) && 
            (expCat.includes('resa') || expCat.includes('travel') || expCat.includes('konferens'))) return true;
        
        if ((budgetCat.includes('office') || budgetCat.includes('kontor')) && 
            (expCat.includes('kontor') || expCat.includes('office') || expCat.includes('material'))) return true;
        
        if ((budgetCat.includes('software') || budgetCat.includes('tool') || budgetCat.includes('verktyg')) && 
            (expCat.includes('software') || expCat.includes('tool') || expCat.includes('verktyg') || expCat.includes('licens'))) return true;
        
        if ((budgetCat.includes('development') || budgetCat.includes('utveckling')) && 
            (expCat.includes('kurs') || expCat.includes('utbildning') || expCat.includes('development'))) return true;
        
        if ((budgetCat.includes('utrustning') || budgetCat.includes('equipment')) && 
            (expCat.includes('utrustning') || expCat.includes('equipment') || expCat.includes('dator') || expCat.includes('hårdvara'))) return true;
        
        // Basic word matching (fallback)
        if (budgetCat.includes(expCat.split(' ')[0]) || expCat.includes(budgetCat.split(' ')[0])) return true;
        
        return false;
      });
      
      const totalMatched = matchingExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      console.log(`  Matched expenses: ${totalMatched} SEK (${matchingExpenses.length} entries)`);
      
      if (matchingExpenses.length > 0) {
        matchingExpenses.forEach(exp => {
          console.log(`    - "${exp.description}" (${exp.category}) - ${exp.amount} SEK`);
        });
      } else {
        console.log(`    - No matching expenses found for category "${budget.category}"`);
      }
    });
  }

  // Show expenses that don't match any budget
  console.log('\n=== UNMATCHED EXPENSES ===');
  if (budgets && expenses) {
    const unmatchedExpenses = expenses.filter(exp => {
      return !budgets.some(budget => {
        const budgetCat = budget.category.toLowerCase();
        const expCat = exp.category.toLowerCase();
        
        // Same matching logic as above
        if (expCat === budgetCat) return true;
        if ((budgetCat.includes('travel') || budgetCat.includes('resa')) && 
            (expCat.includes('resa') || expCat.includes('travel') || expCat.includes('konferens'))) return true;
        if ((budgetCat.includes('office') || budgetCat.includes('kontor')) && 
            (expCat.includes('kontor') || expCat.includes('office') || expCat.includes('material'))) return true;
        if ((budgetCat.includes('software') || budgetCat.includes('tool') || budgetCat.includes('verktyg')) && 
            (expCat.includes('software') || expCat.includes('tool') || expCat.includes('verktyg') || expCat.includes('licens'))) return true;
        if ((budgetCat.includes('development') || budgetCat.includes('utveckling')) && 
            (expCat.includes('kurs') || expCat.includes('utbildning') || expCat.includes('development'))) return true;
        if ((budgetCat.includes('utrustning') || budgetCat.includes('equipment')) && 
            (expCat.includes('utrustning') || expCat.includes('equipment') || expCat.includes('dator') || expCat.includes('hårdvara'))) return true;
        if (budgetCat.includes(expCat.split(' ')[0]) || expCat.includes(budgetCat.split(' ')[0])) return true;
        
        return false;
      });
    });
    
    console.log(`Unmatched expenses: ${unmatchedExpenses.length}`);
    unmatchedExpenses.forEach(exp => {
      console.log(`- "${exp.description}" (${exp.category}) - ${exp.amount} SEK`);
    });
  }
}

debugExpenseMatching().catch(console.error);
