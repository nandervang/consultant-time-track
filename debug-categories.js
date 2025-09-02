import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gvdblxwwpgqwamwewfig.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2ZGJseHd3cGdxd2Ftd2V3ZmlnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzNjE3MDAsImV4cCI6MjA0OTkzNzcwMH0.SFEZOgVqfS_MDqJHhT9HdLDbP8cT1ZnZbGdKDdOmJkA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCategories() {
  console.log('=== DEBUGGING CATEGORIES ===\n');
  
  try {
    // Check budget categories
    console.log('1. BUDGET CATEGORIES:');
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .eq('period', 'monthly')
      .order('created_at', { ascending: false });
    
    if (budgetError) {
      console.error('Budget error:', budgetError);
      return;
    }
    
    console.log(`Found ${budgets.length} monthly budgets:`);
    budgets.forEach(budget => {
      console.log(`  - ID: ${budget.id}`);
      console.log(`    Name: "${budget.name}"`);
      console.log(`    Category: "${budget.category}"`);
      console.log(`    Budget: ${budget.budget_limit} kr`);
      console.log(`    Active: ${budget.is_active}`);
      console.log('');
    });
    
    // Check all expense categories in cash flow
    console.log('2. EXPENSE CATEGORIES IN CASH FLOW:');
    const { data: expenses, error: expenseError } = await supabase
      .from('cash_flow_entries')
      .select('category, COUNT(*) as count, SUM(amount) as total')
      .eq('type', 'expense')
      .not('category', 'is', null)
      .order('count', { ascending: false });
    
    if (expenseError) {
      console.error('Expense error:', expenseError);
      return;
    }
    
    console.log(`Found ${expenses.length} expense categories:`);
    expenses.forEach(exp => {
      console.log(`  - Category: "${exp.category}"`);
      console.log(`    Count: ${exp.count} expenses`);
      console.log(`    Total: ${exp.total} kr`);
      console.log('');
    });
    
    // Check specific matching
    console.log('3. CATEGORY MATCHING TEST:');
    if (budgets.length > 0 && expenses.length > 0) {
      budgets.forEach(budget => {
        console.log(`\nTesting budget: "${budget.category}"`);
        const matches = expenses.filter(exp => {
          const budgetCat = budget.category.toLowerCase();
          const expCat = exp.category.toLowerCase();
          
          const exactMatch = expCat === budgetCat;
          const budgetContainsExp = budgetCat.includes(expCat.split(' ')[0]);
          const expContainsBudget = expCat.includes(budgetCat.split(' ')[0]);
          
          console.log(`    vs "${exp.category}": exact=${exactMatch}, budgetContains=${budgetContainsExp}, expContains=${expContainsBudget}`);
          
          return exactMatch || budgetContainsExp || expContainsBudget;
        });
        
        console.log(`    → Found ${matches.length} matching expense categories`);
        matches.forEach(match => {
          console.log(`      - "${match.category}": ${match.count} expenses, ${match.total} kr`);
        });
      });
    }
    
    // Check recent expenses
    console.log('\n4. RECENT EXPENSES (last 10):');
    const { data: recentExpenses, error: recentError } = await supabase
      .from('cash_flow_entries')
      .select('*')
      .eq('type', 'expense')
      .order('date', { ascending: false })
      .limit(10);
    
    if (recentError) {
      console.error('Recent expenses error:', recentError);
      return;
    }
    
    recentExpenses.forEach(exp => {
      console.log(`  - Date: ${exp.date}`);
      console.log(`    Category: "${exp.category}"`);
      console.log(`    Amount: ${exp.amount} kr`);
      console.log(`    Description: ${exp.description}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugCategories();
