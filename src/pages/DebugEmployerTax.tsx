import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

interface SalaryPayment {
  id: string;
  year: number;
  month: number;
  total_amount: number;
  status: string;
  cash_flow_entry_id?: string;
  employer_tax_entry_id?: string;
  employee?: { name: string };
}

interface CashFlowEntry {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  date: string;
}

interface DebugInfo {
  hasColumns: boolean;
  userSettings: {
    auto_generate_employer_tax?: boolean;
    employer_tax_payment_date?: number;
  } | null;
  salaryPayments: SalaryPayment[];
  cashFlowEntries: CashFlowEntry[];
}

export default function DebugEmployerTaxPage() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    hasColumns: false,
    userSettings: null,
    salaryPayments: [],
    cashFlowEntries: []
  });
  const [loading, setLoading] = useState(true);

  const loadDebugInfo = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Check user settings
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('auto_generate_employer_tax, employer_tax_payment_date, company_name')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile error:', profileError);
      }

      // Check salary payments
      const { data: salaryData, error: salaryError } = await supabase
        .from('salary_payments')
        .select(`
          *,
          employee:salary_employees(name)
        `)
        .eq('user_id', user.id)
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(10);

      if (salaryError) {
        console.error('Salary error:', salaryError);
      }

      // Check cash flow entries
      const { data: cashFlowData, error: cashFlowError } = await supabase
        .from('cash_flow_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (cashFlowError) {
        console.error('Cash flow error:', cashFlowError);
      }

      setDebugInfo({
        hasColumns: !!userProfile,
        userSettings: userProfile,
        salaryPayments: salaryData || [],
        cashFlowEntries: cashFlowData || []
      });

    } catch (error) {
      console.error('Debug info error:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDebugInfo();
  }, [loadDebugInfo]);

  const triggerEmployerTaxTest = async () => {
    if (!user) return;

    try {
      // Find the most recent scheduled salary payment
      const scheduledSalary = debugInfo.salaryPayments.find(p => p.status === 'scheduled');
      
      if (!scheduledSalary) {
        alert('No scheduled salary payments found. Please set a salary payment to "scheduled" status first.');
        return;
      }

      // Trigger an update to force employer tax creation
      const { error } = await supabase
        .from('salary_payments')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', scheduledSalary.id);

      if (error) throw error;

      alert('Triggered employer tax update. Check the cash flow entries below after a few seconds.');
      setTimeout(loadDebugInfo, 2000); // Reload after 2 seconds
    } catch (error) {
      console.error('Test trigger error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Error triggering test: ' + errorMessage);
    }
  };

  if (!user) {
    return <div className="p-4">Please log in to access debug information.</div>;
  }

  if (loading) {
    return <div className="p-4">Loading debug information...</div>;
  }

  const employerTaxEntries = debugInfo.cashFlowEntries.filter(entry => 
    entry.category?.toLowerCase().includes('tax') || 
    entry.description?.toLowerCase().includes('tax') ||
    entry.description?.toLowerCase().includes('employer')
  );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Employer Tax Debug Page</h1>
      
      {/* Database Columns Check */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Database Columns</h2>
        <p className={`text-sm ${debugInfo.hasColumns ? 'text-green-600' : 'text-red-600'}`}>
          {debugInfo.hasColumns ? '✅ Employer tax columns exist' : '❌ Employer tax columns missing - run the SQL script'}
        </p>
      </div>

      {/* User Settings */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">User Settings</h2>
        {debugInfo.userSettings ? (
          <div className="space-y-1 text-sm">
            <p>Auto-generate employer tax: <span className={debugInfo.userSettings.auto_generate_employer_tax ? 'text-green-600 font-semibold' : 'text-red-600'}>{debugInfo.userSettings.auto_generate_employer_tax ? 'ENABLED' : 'DISABLED'}</span></p>
            <p>Payment date: {debugInfo.userSettings.employer_tax_payment_date || 'Not set'}</p>
          </div>
        ) : (
          <p className="text-red-600">No user profile found</p>
        )}
      </div>

      {/* Salary Payments */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Recent Salary Payments</h2>
        {debugInfo.salaryPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Employee</th>
                  <th className="text-left p-2">Month</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Cash Flow ID</th>
                  <th className="text-left p-2">Employer Tax ID</th>
                </tr>
              </thead>
              <tbody>
                {debugInfo.salaryPayments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="p-2">{payment.employee?.name || 'Unknown'}</td>
                    <td className="p-2">{payment.year}-{payment.month.toString().padStart(2, '0')}</td>
                    <td className="p-2">{payment.total_amount?.toLocaleString('sv-SE')} kr</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        payment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                        payment.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="p-2">{payment.cash_flow_entry_id ? '✅' : '❌'}</td>
                    <td className="p-2">{payment.employer_tax_entry_id ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No salary payments found</p>
        )}
      </div>

      {/* Employer Tax Entries */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">Employer Tax Cash Flow Entries ({employerTaxEntries.length})</h2>
        {employerTaxEntries.length > 0 ? (
          <div className="space-y-2">
            {employerTaxEntries.map((entry) => (
              <div key={entry.id} className="border rounded p-2 text-sm">
                <div className="font-medium">{entry.description}</div>
                <div className="text-gray-600">
                  {entry.amount?.toLocaleString('sv-SE')} kr • {entry.category} • {entry.date}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-red-600">❌ No employer tax entries found</p>
        )}
      </div>

      {/* All Cash Flow Entries */}
      <div className="bg-white rounded-lg border p-4">
        <h2 className="text-lg font-semibold mb-2">All Cash Flow Entries ({debugInfo.cashFlowEntries.length})</h2>
        {debugInfo.cashFlowEntries.length > 0 ? (
          <div className="max-h-60 overflow-y-auto space-y-1">
            {debugInfo.cashFlowEntries.map((entry) => (
              <div key={entry.id} className="text-xs border-b pb-1">
                <span className={`font-medium ${entry.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.type === 'income' ? '+' : '-'}{entry.amount?.toLocaleString('sv-SE')} kr
                </span>
                {' • '}
                <span>{entry.description}</span>
                {' • '}
                <span className="text-gray-500">{entry.category} • {entry.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No cash flow entries found</p>
        )}
      </div>

      {/* Test Button */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h2 className="text-lg font-semibold mb-2">Test Employer Tax Generation</h2>
        <p className="text-sm text-gray-600 mb-3">
          This will trigger a salary payment update to force employer tax creation.
        </p>
        <button
          onClick={triggerEmployerTaxTest}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Trigger Test
        </button>
      </div>
    </div>
  );
}