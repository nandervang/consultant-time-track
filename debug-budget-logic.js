import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rwguvflvltqcxuduzlux.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3V2Zmx2bHRxY3h1ZHV6bHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NjA5NzcsImV4cCI6MjA0OTMzNjk3N30.vIY2LLn2nF_IaKcQgtfbBzVNwqBVBUiLtdNAhKlR9Hc'
);

async function debugBudgetLogic() {
  console.log('=== BUDGET LOGIC ANALYSIS ===');
  
  // Get all budgets
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: false });
  
  console.log('Current budgets:', budgets?.length || 0);
  budgets?.forEach(b => {
    console.log(`- ${b.name} (${b.category}): ${b.budget_limit} SEK, period: ${b.period}`);
  });

  // Get all expenses
  const { data: expenses } = await supabase
    .from('cash_flow_entries')
    .select('*')
    .eq('type', 'expense')
    .order('date', { ascending: false });
  
  console.log('\n=== ALL EXPENSES BY CATEGORY ===');
  console.log('Total expenses:', expenses?.length || 0);
  
  // Group by category
  const expensesByCategory = {};
  expenses?.forEach(exp => {
    if (!expensesByCategory[exp.category]) {
      expensesByCategory[exp.category] = [];
    }
    expensesByCategory[exp.category].push(exp);
  });

  console.log('\nExpense categories found:');
  Object.keys(expensesByCategory).forEach(category => {
    const categoryExpenses = expensesByCategory[category];
    const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    console.log(`\n${category}: ${total} SEK (${categoryExpenses.length} entries)`);
    
    // Show expenses by month
    const byMonth = {};
    categoryExpenses.forEach(exp => {
      const month = exp.date.slice(0, 7);
      if (!byMonth[month]) byMonth[month] = 0;
      byMonth[month] += exp.amount;
    });
    
    Object.keys(byMonth).sort().forEach(month => {
      console.log(`  ${month}: ${byMonth[month]} SEK`);
    });
  });

  // Check budget matching logic
  console.log('\n=== BUDGET CATEGORY MATCHING ===');
  budgets?.forEach(budget => {
    console.log(`\nBudget: ${budget.name} (${budget.category})`);
    
    const matchingExpenses = expenses?.filter(exp => {
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
    
    const totalMatched = matchingExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
    console.log(`  Matched expenses: ${totalMatched} SEK (${matchingExpenses?.length || 0} entries)`);
    
    if (matchingExpenses && matchingExpenses.length > 0) {
      console.log('  Recent matches:');
      matchingExpenses.slice(0, 3).forEach(exp => {
        console.log(`    - ${exp.date}: ${exp.amount} SEK - ${exp.category} - ${exp.description}`);
      });
    }
  });
}

debugBudgetLogic().catch(console.error);
