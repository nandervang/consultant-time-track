import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rszrkvvcunxusgpzpfpn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzenJrdnZjdW54dXNncHpwZnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjI4NzYwOTksImV4cCI6MjAzODQ1MjA5OX0.HCunXJfCkcJMI4TUxwgOE-jryRAQ7gO9cN7kG46mXQE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function quickCheck() {
  console.log('🔍 Quick database check...\n');

  try {
    // Test connection with a simple count
    console.log('1. Testing connection...');
    const { count: expenseCount, error: countError } = await supabase
      .from('cash_flow_entries')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'expense');

    if (countError) {
      console.error('❌ Connection failed:', countError.message);
      return;
    }

    console.log(`✅ Found ${expenseCount} total expenses\n`);

    // Get recent expenses
    console.log('2. Recent expenses:');
    const { data: recentExpenses, error: recentError } = await supabase
      .from('cash_flow_entries')
      .select('date, category, description, amount')
      .eq('type', 'expense')
      .order('date', { ascending: false })
      .limit(5);

    if (recentError) {
      console.error('❌ Recent expenses error:', recentError.message);
      return;
    }

    recentExpenses.forEach(exp => {
      console.log(`   ${exp.date}: ${exp.description} (${exp.amount} SEK) [${exp.category}]`);
    });

    // Get budget count
    console.log('\n3. Budget categories:');
    const { count: budgetCount, error: budgetCountError } = await supabase
      .from('budgets')
      .select('*', { count: 'exact', head: true });

    if (budgetCountError) {
      console.error('❌ Budget count error:', budgetCountError.message);
      return;
    }

    console.log(`✅ Found ${budgetCount} budget categories\n`);

    // Get current month expenses
    const currentMonth = new Date().toISOString().slice(0, 7);
    console.log(`4. Current month (${currentMonth}) expenses:`);
    
    const { data: monthlyExpenses, error: monthlyError } = await supabase
      .from('cash_flow_entries')
      .select('date, category, description, amount')
      .eq('type', 'expense')
      .gte('date', `${currentMonth}-01`)
      .lt('date', `${currentMonth}-32`)
      .order('date', { ascending: false });

    if (monthlyError) {
      console.error('❌ Monthly expenses error:', monthlyError.message);
      return;
    }

    console.log(`✅ Found ${monthlyExpenses.length} expenses this month`);
    monthlyExpenses.slice(0, 5).forEach(exp => {
      console.log(`   ${exp.date}: ${exp.description} (${exp.amount} SEK) [${exp.category}]`);
    });

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

quickCheck().then(() => {
  console.log('\n✅ Quick check complete!');
}).catch(error => {
  console.error('❌ Script failed:', error);
});
