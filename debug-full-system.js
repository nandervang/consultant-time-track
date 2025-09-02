import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rwguvflvltqcxuduzlux.supabase.co', 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3Z3V2Zmx2bHRxY3h1ZHV6bHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NjA5NzcsImV4cCI6MjA0OTMzNjk3N30.vIY2LLn2nF_IaKcQgtfbBzVNwqBVBUiLtdNAhKlR9Hc'
);

async function debugFullBudgetSystem() {
  console.log('=== COMPLETE BUDGET SYSTEM DEBUG ===');
  
  // Get all budgets
  const { data: budgets, error: budgetError } = await supabase
    .from('budgets')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (budgetError) {
    console.error('Budget error:', budgetError);
    return;
  }
  
  console.log('Budgets found:', budgets?.length || 0);
  budgets?.forEach(b => {
    console.log(`- "${b.name}" | Category: "${b.category}" | ${b.budget_limit} SEK | Period: ${b.period}`);
  });

  // Get all actual expenses (not budget entries)
  const { data: expenses, error: expenseError } = await supabase
    .from('cash_flow_entries')
    .select('*')
    .eq('type', 'expense')
    .eq('is_budget_entry', false)
    .order('date', { ascending: false });
  
  if (expenseError) {
    console.error('Expense error:', expenseError);
    return;
  }
  
  console.log('\n=== ACTUAL EXPENSES ===');
  console.log('Actual expenses found:', expenses?.length || 0);
  
  expenses?.forEach(exp => {
    console.log(`- "${exp.description}" | Category: "${exp.category}" | ${exp.amount} SEK | Date: ${exp.date}`);
  });

  // Test monthly budget matching
  console.log('\n=== MONTHLY BUDGET MATCHING ===');
  const monthlyBudgets = budgets?.filter(b => b.period === 'monthly') || [];
  
  monthlyBudgets.forEach(budget => {
    console.log(`\nBudget: "${budget.name}" (${budget.category}) - ${budget.budget_limit} SEK/month`);
    
    const matchingExpenses = expenses?.filter(exp => {
      const budgetCat = budget.category.toLowerCase();
      const expCat = exp.category.toLowerCase();
      
      // Exact match
      const exactMatch = expCat === budgetCat;
      
      // Keyword matching for common categories
      const isTravel = (budgetCat.includes('travel') || budgetCat.includes('resa')) && 
                     (expCat.includes('resa') || expCat.includes('travel') || expCat.includes('konferens'));
      
      const isOffice = (budgetCat.includes('office') || budgetCat.includes('kontor')) && 
                     (expCat.includes('kontor') || expCat.includes('office') || expCat.includes('material'));
      
      const isSoftware = (budgetCat.includes('software') || budgetCat.includes('tool') || budgetCat.includes('verktyg')) && 
                       (expCat.includes('software') || expCat.includes('tool') || expCat.includes('verktyg') || expCat.includes('licens'));
      
      const isDevelopment = (budgetCat.includes('development') || budgetCat.includes('utveckling')) && 
                          (expCat.includes('kurs') || expCat.includes('utbildning') || expCat.includes('development'));
      
      const isEquipment = (budgetCat.includes('utrustning') || budgetCat.includes('equipment')) && 
                        (expCat.includes('utrustning') || expCat.includes('equipment') || expCat.includes('dator') || expCat.includes('hårdvara'));
      
      // Basic word matching (fallback)
      const budgetContainsExp = budgetCat.includes(expCat.split(' ')[0]);
      const expContainsBudget = expCat.includes(budgetCat.split(' ')[0]);
      
      const matches = exactMatch || isTravel || isOffice || isSoftware || isDevelopment || isEquipment || budgetContainsExp || expContainsBudget;
      
      if (matches) {
        console.log(`  MATCH: "${exp.category}" matches "${budget.category}" (${exactMatch ? 'exact' : 'keyword'})`);
      }
      
      return matches;
    }) || [];
    
    const totalSpent = matchingExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    console.log(`  Total spent: ${totalSpent} SEK (${matchingExpenses.length} expenses)`);
    console.log(`  Budget vs Spent: ${budget.budget_limit} SEK vs ${totalSpent} SEK`);
    console.log(`  Remaining: ${budget.budget_limit - totalSpent} SEK`);
    
    if (matchingExpenses.length > 0) {
      console.log('  Matching expenses:');
      matchingExpenses.forEach(exp => {
        console.log(`    - "${exp.description}" (${exp.category}) - ${exp.amount} SEK - ${exp.date}`);
      });
    }
  });

  // Summary calculation like the app should do
  console.log('\n=== BUDGET SUMMARY (like app should show) ===');
  let totalBudgetAllocated = 0;
  let totalSpentAcrossAllBudgets = 0;
  
  monthlyBudgets.forEach(budget => {
    const matchingExpenses = expenses?.filter(exp => {
      const budgetCat = budget.category.toLowerCase();
      const expCat = exp.category.toLowerCase();
      return expCat === budgetCat || 
             (budgetCat.includes('software') && expCat.includes('software')) ||
             (budgetCat.includes('development') && expCat.includes('development'));
    }) || [];
    
    const spent = matchingExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    totalBudgetAllocated += parseFloat(budget.budget_limit);
    totalSpentAcrossAllBudgets += spent;
    
    console.log(`${budget.name}: ${budget.budget_limit} SEK budget, ${spent} SEK spent`);
  });
  
  console.log(`\nTOTAL: ${totalBudgetAllocated} SEK budgeted, ${totalSpentAcrossAllBudgets} SEK spent`);
  console.log(`REMAINING: ${totalBudgetAllocated - totalSpentAcrossAllBudgets} SEK`);
}

debugFullBudgetSystem().catch(console.error);
