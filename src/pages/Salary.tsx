import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Users, 
  DollarSign,
  Calendar,
  Edit,
  Trash2,
  Play,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useSalaryEmployees } from '../hooks/useSalaryEmployees';
import { useSalaryPayments } from '../hooks/useSalaryPayments';
import { formatSEK } from '../lib/currency';
import EmployeeForm from '../components/salary/EmployeeForm';
import MonthlySalaryGrid from '../components/salary/MonthlySalaryGrid';

interface SalaryPageProps {
  isDarkMode?: boolean;
}

export default function SalaryPage({ isDarkMode }: SalaryPageProps) {
  const { 
    employees, 
    loading: employeesLoading, 
    error: employeesError,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    getActiveEmployees
  } = useSalaryEmployees();
  
  const {
    payments,
    loading: paymentsLoading,
    error: paymentsError,
    generateYearlyPayments,
    addSalaryPayment,
    updateSalaryPayment,
    deleteSalaryPayment
  } = useSalaryPayments();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loading = employeesLoading || paymentsLoading;
  const error = employeesError || paymentsError;

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(employee => {
      if (!employee.is_active) return false;
      
      const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           employee.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  }, [employees, searchTerm]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const activeEmployees = getActiveEmployees();
    const totalMonthlySalaries = activeEmployees.reduce((sum, emp) => sum + emp.base_salary, 0);
    
    // Calculate months following cash flow pattern: 2 past + current + future
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-based month
    const currentYear = currentDate.getFullYear();
    
    let totalMonthsInView: number;
    let futureMonthsCount: number;
    let pastMonthsCount: number;
    
    if (selectedYear === currentYear) {
      // Current year: 2 past + current + future months in year
      const monthsFromStart = Math.min(2, currentMonth - 1); // Past months available
      const monthsToEnd = 12 - currentMonth + 1; // Current + future months
      totalMonthsInView = monthsFromStart + monthsToEnd;
      futureMonthsCount = monthsToEnd - 1; // Exclude current month
      pastMonthsCount = monthsFromStart;
    } else if (selectedYear > currentYear) {
      // Future year - all 12 months
      totalMonthsInView = 12;
      futureMonthsCount = 12;
      pastMonthsCount = 0;
    } else {
      // Past year - all 12 months
      totalMonthsInView = 12;
      futureMonthsCount = 0;
      pastMonthsCount = 12;
    }
    
    const totalBudgetInView = totalMonthlySalaries * totalMonthsInView;
    
    const currentYearPayments = payments.filter(p => p.year === selectedYear);
    const actualPaid = currentYearPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.total_amount, 0);

    // Calculate scheduled payments 
    const scheduledPayments = currentYearPayments
      .filter(p => p.status === 'scheduled')
      .reduce((sum, p) => sum + p.total_amount, 0);

    return {
      totalEmployees: activeEmployees.length,
      totalMonthlySalaries,
      totalBudgetInView,
      actualPaid,
      scheduledPayments,
      remainingBudget: totalBudgetInView - actualPaid - scheduledPayments,
      totalMonthsInView,
      futureMonthsCount,
      pastMonthsCount
    };
  }, [getActiveEmployees, payments, selectedYear]);

  // Handle form submission
  const handleSubmit = async (formData: any) => {
    try {
      if (editingEmployee) {
        await updateEmployee({ ...formData, id: editingEmployee.id });
        setEditingEmployee(null);
      } else {
        await addEmployee(formData);
      }
      setShowAddForm(false);
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  // Handle edit
  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setShowAddForm(true);
  };

  // Handle delete
  const handleDelete = async (employeeId: string) => {
    if (confirm('Are you sure you want to delete this employee? This will deactivate them if they have salary payments.')) {
      await deleteEmployee(employeeId);
    }
  };

  // Generate yearly payments
  const handleGenerateYearlyPayments = async () => {
    if (confirm(`Generate salary payments for all active employees for ${selectedYear}?`)) {
      try {
        await generateYearlyPayments(selectedYear);
      } catch (err) {
        console.error('Error generating yearly payments:', err);
      }
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'scheduled': return <Calendar className="h-4 w-4 text-blue-600" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading salary data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salary Management</h1>
          <p className="text-muted-foreground">
            Manage employee salaries and monthly payments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleGenerateYearlyPayments}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Generate {selectedYear} Payments
          </Button>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="pt-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold">{summaryStats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Total</p>
                <p className="text-2xl font-bold">{formatSEK(summaryStats.totalMonthlySalaries)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {selectedYear === new Date().getFullYear() ? 'Period Budget' : 'Yearly Budget'}
                </p>
                <p className="text-2xl font-bold">{formatSEK(summaryStats.totalBudgetInView)}</p>
                {summaryStats.totalMonthsInView > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {summaryStats.totalMonthsInView} months in view
                    {selectedYear === new Date().getFullYear() && 
                      ` (${summaryStats.pastMonthsCount} past, current, ${summaryStats.futureMonthsCount} future)`
                    }
                  </p>
                )}
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid {selectedYear}</p>
                <p className="text-2xl font-bold text-green-600">{formatSEK(summaryStats.actualPaid)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Year Selection and Monthly Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Monthly Salary Overview</CardTitle>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Year:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-3 py-1 border rounded-md"
                aria-label="Select year for salary overview"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <MonthlySalaryGrid 
            employees={filteredEmployees}
            payments={payments}
            year={selectedYear}
            onUpdatePayment={updateSalaryPayment}
            onAddPayment={addSalaryPayment}
            onDeletePayment={deleteSalaryPayment}
          />
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Employees</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No employees found</p>
              <Button 
                onClick={() => setShowAddForm(true)}
                className="mt-2"
                variant="outline"
              >
                Add First Employee
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{employee.name}</h3>
                      {employee.position && (
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                          {employee.position}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span>Base Salary: {formatSEK(employee.base_salary)}</span>
                      <span>Start Date: {new Date(employee.employment_start_date).toLocaleDateString('sv-SE')}</span>
                      {employee.email && <span>Email: {employee.email}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(employee)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Form Dialog/Modal */}
      {showAddForm && (
        <EmployeeForm
          employee={editingEmployee}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowAddForm(false);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
}