import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X } from 'lucide-react';
import type { CreateEmployeeData } from '../../hooks/useSalaryEmployees';

interface SalaryEmployee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  employee_number: string | null;
  position: string | null;
  base_salary: number;
  currency: string;
  employment_start_date: string;
  employment_end_date: string | null;
  is_active: boolean;
}

interface EmployeeFormProps {
  employee?: SalaryEmployee | null;
  onSubmit: (data: CreateEmployeeData) => Promise<void>;
  onCancel: () => void;
}

export default function EmployeeForm({ employee, onSubmit, onCancel }: EmployeeFormProps) {
  const [formData, setFormData] = useState<CreateEmployeeData>({
    name: '',
    email: '',
    phone: '',
    employee_number: '',
    position: '',
    base_salary: 0,
    currency: 'SEK',
    employment_start_date: new Date().toISOString().split('T')[0],
    employment_end_date: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when editing
  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name,
        email: employee.email || '',
        phone: employee.phone || '',
        employee_number: employee.employee_number || '',
        position: employee.position || '',
        base_salary: employee.base_salary,
        currency: employee.currency,
        employment_start_date: employee.employment_start_date,
        employment_end_date: employee.employment_end_date || '',
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    
    if (formData.base_salary <= 0) {
      setError('Base salary must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Clean up form data
      const submitData: CreateEmployeeData = {
        ...formData,
        email: formData.email?.trim() || undefined,
        phone: formData.phone?.trim() || undefined,
        employee_number: formData.employee_number?.trim() || undefined,
        position: formData.position?.trim() || undefined,
        employment_end_date: formData.employment_end_date || undefined,
      };

      await onSubmit(submitData);
    } catch (err) {
      console.error('Error saving employee:', err);
      setError(err instanceof Error ? err.message : 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {employee ? 'Edit Employee' : 'Add New Employee'}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Employee Number
                </label>
                <Input
                  value={formData.employee_number}
                  onChange={(e) => setFormData({ ...formData, employee_number: e.target.value })}
                  placeholder="Employee ID/Number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+46 70 123 45 67"
                />
              </div>
            </div>

            {/* Position Information */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Position/Role
              </label>
              <Input
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Job title or position"
              />
            </div>

            {/* Salary Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Base Salary (Monthly) *
                </label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  title="Select currency"
                >
                  <option value="SEK">SEK (Swedish Krona)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="NOK">NOK (Norwegian Krone)</option>
                  <option value="DKK">DKK (Danish Krone)</option>
                </select>
              </div>
            </div>

            {/* Employment Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Employment Start Date *
                </label>
                <Input
                  type="date"
                  value={formData.employment_start_date}
                  onChange={(e) => setFormData({ ...formData, employment_start_date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Employment End Date
                </label>
                <Input
                  type="date"
                  value={formData.employment_end_date}
                  onChange={(e) => setFormData({ ...formData, employment_end_date: e.target.value })}
                  placeholder="Leave empty if currently employed"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  employee ? 'Update Employee' : 'Add Employee'
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}