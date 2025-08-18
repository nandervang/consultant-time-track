// Alternative: Create tables using Supabase's RPC functionality
import { supabase } from '../lib/supabase.js';

export async function createCashFlowTables() {
  try {
    // First check if the table already exists
    const { data, error: checkError } = await supabase
      .from('cash_flow_entries')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST205') {
      console.log('Table does not exist, need to create it manually in Supabase SQL editor');
      return {
        success: false,
        message: 'Please run the SQL from create_tables_manual.sql in your Supabase SQL editor'
      };
    }
    
    console.log('✅ Cash flow tables exist and are accessible');
    return { success: true, message: 'Tables are ready' };
    
  } catch (error) {
    console.error('Error checking tables:', error);
    return { success: false, error };
  }
}

// Also export a test function to verify everything works
export async function testCashFlowOperation() {
  try {
    // Try a simple insert operation
    const testEntry = {
      type: 'income',
      amount: 1000,
      description: 'Test entry',
      category: 'Testing',
      date: new Date().toISOString().split('T')[0]
    };
    
    const { data, error } = await supabase
      .from('cash_flow_entries')
      .insert([testEntry])
      .select();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Test cash flow entry created:', data);
    
    // Clean up test entry
    if (data && data[0]) {
      await supabase
        .from('cash_flow_entries')
        .delete()
        .eq('id', data[0].id);
      console.log('✅ Test entry cleaned up');
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('❌ Cash flow operation failed:', error);
    return { success: false, error };
  }
}
