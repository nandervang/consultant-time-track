import { createClient } from '@supabase/supabase-js';

// Supabase configuration - you may need to update these
const supabaseUrl = 'https://rszrkvvcunxusgpzpfpn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzenJrdnZjdW54dXNncHpwZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4NzYwOTksImV4cCI6MjAzODQ1MjA5OX0.HCunXJfCkcJMI4TUxwgOE-jryRAQ7gO9cN7kG46mXQE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugExpenses() {
  console.log('🔍 Debugging Budget Expenses...\n');

  try {
    // Get all cash flow entries (expenses)
    console.log('📊 Fetching all expense entries...');
    const { data: allExpenses, error: expenseError } = await supabase
      .from('cash_flow_entries')
      .select('*')
      .eq('type', 'expense')
      .order('date', { ascending: false });

    if (expenseError) {
      console.error('❌ Error fetching expenses:', expenseError);
      return;
    }

    console.log(`✅ Found ${allExpenses.length} total expense entries\n`);

    // Get all budgets
    console.log('📋 Fetching all budget categories...');
    const { data: budgets, error: budgetError } = await supabase
      .from('budgets')
      .select('*')
      .order('created_at', { ascending: false });

    if (budgetError) {
      console.error('❌ Error fetching budgets:', budgetError);
      return;
    }

    console.log(`✅ Found ${budgets.length} budget categories\n`);

    // Current month for filtering
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentYear = new Date().getFullYear();

    console.log(`📅 Current month: ${currentMonth}`);
    console.log(`📅 Current year: ${currentYear}\n`);

    // Show all budgets and their associated expenses
    console.log('🏷️  BUDGET CATEGORIES & EXPENSES:');
    console.log('=' * 50);

    budgets.forEach((budget, index) => {
      console.log(`\n${index + 1}. ${budget.name} (${budget.period})`);
      console.log(`   Budget: ${budget.budget_limit} SEK`);
      console.log(`   Category: "${budget.category}"`);
      console.log(`   Active: ${budget.is_active}`);

      // Find expenses for this budget category
      let categoryExpenses = [];
      
      if (budget.period === 'monthly') {
        categoryExpenses = allExpenses.filter(exp => {
          const entryDate = new Date(exp.date);
          const entryMonth = entryDate.toISOString().slice(0, 7);
          return entryMonth === currentMonth && (
            exp.category.toLowerCase() === budget.category.toLowerCase() ||
            exp.category.toLowerCase().includes(budget.category.toLowerCase().split(' ')[0]) ||
            budget.category.toLowerCase().includes(exp.category.toLowerCase().split(' ')[0])
          );
        });
      } else {
        categoryExpenses = allExpenses.filter(exp => {
          const entryDate = new Date(exp.date);
          const entryYear = entryDate.getFullYear();
          return entryYear === currentYear && (
            exp.category.toLowerCase() === budget.category.toLowerCase() ||
            exp.category.toLowerCase().includes(budget.category.toLowerCase().split(' ')[0]) ||
            budget.category.toLowerCase().includes(exp.category.toLowerCase().split(' ')[0])
          );
        });
      }

      const totalSpent = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      console.log(`   💰 Total spent: ${totalSpent} SEK`);
      console.log(`   📝 Matching expenses: ${categoryExpenses.length}`);

      if (categoryExpenses.length > 0) {
        categoryExpenses.forEach(exp => {
          console.log(`      - ${exp.date}: ${exp.description} (${exp.amount} SEK) [${exp.category}]`);
          console.log(`        Budget entry: ${exp.is_budget_entry}, Recurring: ${exp.is_recurring}`);
        });
      } else {
        console.log(`      No expenses found`);
      }
    });

    // Show all expenses not matching any budget
    console.log('\n\n🔍 EXPENSES NOT MATCHING ANY BUDGET:');
    console.log('=' * 40);

    const unmatchedExpenses = allExpenses.filter(exp => {
      return !budgets.some(budget => 
        exp.category.toLowerCase() === budget.category.toLowerCase() ||
        exp.category.toLowerCase().includes(budget.category.toLowerCase().split(' ')[0]) ||
        budget.category.toLowerCase().includes(exp.category.toLowerCase().split(' ')[0])
      );
    });

    if (unmatchedExpenses.length > 0) {
      unmatchedExpenses.slice(0, 10).forEach(exp => {
        console.log(`- ${exp.date}: ${exp.description} (${exp.amount} SEK) [${exp.category}]`);
      });
      if (unmatchedExpenses.length > 10) {
        console.log(`... and ${unmatchedExpenses.length - 10} more`);
      }
    } else {
      console.log('✅ All expenses match budget categories');
    }

    // Show recent expenses
    console.log('\n\n📅 RECENT EXPENSES (Last 10):');
    console.log('=' * 30);
    allExpenses.slice(0, 10).forEach(exp => {
      console.log(`${exp.date}: ${exp.description} (${exp.amount} SEK) [${exp.category}]`);
    });

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the debug script
debugExpenses().then(() => {
  console.log('\n✅ Debug complete!');
  process.exit(0);
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
