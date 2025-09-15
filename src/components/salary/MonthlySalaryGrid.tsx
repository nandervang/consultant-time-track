import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Edit2, CheckCircle, Calendar } from 'lucide-react';
import { formatSEK } from '../../lib/currency';
import SalaryEditModal from './SalaryEditModal';
import type { SalaryPaymentWithEmployee, CreateSalaryPaymentData, UpdateSalaryPaymentData } from '../../hooks/useSalaryPayments';

interface SalaryEmployee {
  id: string;
  name: string;
  position: string | null;
  base_salary: number;
  currency: string;
}

interface MonthlySalaryGridProps {
  employees: SalaryEmployee[];
  payments: SalaryPaymentWithEmployee[];
  year: number;
  onUpdatePayment: (updateData: UpdateSalaryPaymentData) => Promise<SalaryPaymentWithEmployee | null>;
  onAddPayment: (paymentData: CreateSalaryPaymentData) => Promise<SalaryPaymentWithEmployee | null>;
  onDeletePayment: (paymentId: string) => Promise<boolean>;
}

interface EditModalState {
  isOpen: boolean;
  employee: SalaryEmployee | null;
  payment: SalaryPaymentWithEmployee | null;
  year: number;
  month: number;
}

export default function MonthlySalaryGrid({ 
  employees, 
  payments, 
  year, 
  onUpdatePayment, 
  onAddPayment, 
  onDeletePayment 
}: MonthlySalaryGridProps) {
  const [editModal, setEditModal] = useState<EditModalState>({
    isOpen: false,
    employee: null,
    payment: null,
    year: 0,
    month: 0
  });
  const [loading, setLoading] = useState(false);

  // Generate months to show: 2 past + current + future months in current year
  // Same logic as cash flow page
  const months = useMemo(() => {
    const allMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const now = new Date();
    const currentYear = now.getFullYear();
    const monthsToShow: { name: string; number: number; isPast: boolean; isCurrent: boolean; isFuture: boolean }[] = [];
    
    if (year === currentYear) {
      // Current year: show 2 past + current + rest of year
      for (let i = -2; i <= 11 - now.getMonth(); i++) {
        const monthIndex = now.getMonth() + i;
        if (monthIndex >= 0 && monthIndex <= 11) {
          monthsToShow.push({
            name: allMonths[monthIndex],
            number: monthIndex + 1,
            isPast: i < 0,
            isCurrent: i === 0,
            isFuture: i > 0
          });
        }
      }
    } else if (year > currentYear) {
      // Future year - show all months
      return allMonths.map((name, index) => ({
        name,
        number: index + 1,
        isPast: false,
        isCurrent: false,
        isFuture: true
      }));
    } else {
      // Past year - show all months as past
      return allMonths.map((name, index) => ({
        name,
        number: index + 1,
        isPast: true,
        isCurrent: false,
        isFuture: false
      }));
    }
    
    return monthsToShow;
  }, [year]);

  // Create a lookup map for quick payment access
  const paymentLookup = useMemo(() => {
    const lookup: Record<string, SalaryPaymentWithEmployee> = {};
    payments.forEach(payment => {
      if (payment.year === year) {
        const key = `${payment.employee_id}_${payment.month}`;
        lookup[key] = payment;
      }
    });
    return lookup;
  }, [payments, year]);

  // Get payment for specific employee and month
  const getPayment = (employeeId: string, month: number): SalaryPaymentWithEmployee | undefined => {
    return paymentLookup[`${employeeId}_${month}`];
  };

  // Open modal to edit or create salary payment
  const openEditModal = (employee: SalaryEmployee, month: number) => {
    const payment = getPayment(employee.id, month);
    setEditModal({
      isOpen: true,
      employee,
      payment: payment || null,
      year,
      month
    });
  };

  // Close modal
  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      employee: null,
      payment: null,
      year: 0,
      month: 0
    });
  };

  // Handle save from modal
  const handleModalSave = async (paymentData: Record<string, unknown>) => {
    try {
      setLoading(true);
      
      if (paymentData.id) {
        // Update existing payment
        await onUpdatePayment({
          id: paymentData.id as string,
          salary_amount: paymentData.salary_amount as number,
          bonus_amount: paymentData.bonus_amount as number,
          deductions: paymentData.deductions as number,
          payment_date: paymentData.payment_date as string,
          status: paymentData.status as 'scheduled' | 'paid',
          notes: paymentData.notes as string
        });
      } else {
        // Create new payment
        await onAddPayment({
          employee_id: paymentData.employee_id as string,
          year: paymentData.year as number,
          month: paymentData.month as number,
          salary_amount: paymentData.salary_amount as number,
          bonus_amount: paymentData.bonus_amount as number,
          deductions: paymentData.deductions as number,
          payment_date: paymentData.payment_date as string,
          status: paymentData.status as 'scheduled' | 'paid',
          notes: paymentData.notes as string
        });
      }
    } catch (err) {
      console.error('Error saving salary payment:', err);
      throw err; // Re-throw to let modal handle error display
    } finally {
      setLoading(false);
    }
  };

  // Handle delete from modal
  const handleModalDelete = async (paymentId: string) => {
    try {
      setLoading(true);
      await onDeletePayment(paymentId);
    } catch (err) {
      console.error('Error deleting salary payment:', err);
      throw err; // Re-throw to let modal handle error display
    } finally {
      setLoading(false);
    }
  };

  // Get status info for payment
  const getPaymentStatus = (payment?: SalaryPaymentWithEmployee) => {
    if (!payment) {
      return {
        icon: null,
        color: 'text-gray-400',
        bgColor: 'bg-gray-50'
      };
    }

    // Don't show status for 0 salary amounts
    if (payment.salary_amount === 0) {
      return {
        icon: null,
        color: 'text-gray-400',
        bgColor: 'bg-gray-50'
      };
    }

    switch (payment.status) {
      case 'paid':
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        };
      case 'scheduled':
        return {
          icon: <Calendar className="h-3 w-3" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      default:
        return {
          icon: null,
          color: 'text-gray-400',
          bgColor: 'bg-gray-50'
        };
    }
  };

  if (employees.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No active employees found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 font-medium min-w-[200px] sticky left-0 bg-background z-10">
              Employee
            </th>
            {months.map((month) => (
              <th 
                key={month.number} 
                className={`text-center p-3 font-medium min-w-[120px] ${
                  month.isPast ? 'bg-muted/30 text-muted-foreground' :
                  month.isCurrent ? 'bg-blue-50 border-2 border-blue-200' :
                  'bg-background'
                }`}
              >
                <div>
                  <div className="text-sm">{month.name}</div>
                  <div className="text-xs text-muted-foreground">{year}</div>
                  {month.isCurrent && (
                    <div className="text-xs text-blue-600 font-medium">Current</div>
                  )}
                </div>
              </th>
            ))}
            <th className="text-center p-3 font-medium min-w-[120px]">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((employee) => {
            const yearlyTotal = months.reduce((total, month) => {
              const payment = getPayment(employee.id, month.number);
              return total + (payment?.total_amount || employee.base_salary);
            }, 0);

            return (
              <tr key={employee.id} className="border-b hover:bg-muted/50">
                <td className="p-3 sticky left-0 bg-background z-10 border-r">
                  <div>
                    <div className="font-medium">{employee.name}</div>
                    {employee.position && (
                      <div className="text-xs text-muted-foreground">{employee.position}</div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      Base: {formatSEK(employee.base_salary)}/month
                    </div>
                  </div>
                </td>
                
                {months.map((monthData) => {
                  const month = monthData.number;
                  const payment = getPayment(employee.id, month);
                  // Show actual payment amount (including 0) if payment exists, otherwise show base salary
                  const displayAmount = payment ? payment.salary_amount : employee.base_salary;
                  const status = getPaymentStatus(payment);
                  
                  return (
                    <td key={month} className="p-1 text-center">
                      <div className={`relative p-2 rounded group ${status.bgColor}`}>
                        <div className="flex flex-col items-center gap-1">
                          {/* Amount Display */}
                          <div className="flex items-center justify-center gap-1">
                            {status.icon && (
                              <span className={status.color}>
                                {status.icon}
                              </span>
                            )}
                            <span className={`text-xs font-medium ${status.color}`}>
                              {formatSEK(displayAmount).replace(' kr', '').trim()}
                            </span>
                          </div>
                          
                          {/* Bonus and Deductions */}
                          {payment?.bonus_amount && payment.bonus_amount > 0 && (
                            <div className="text-xs text-green-600">
                              +{formatSEK(payment.bonus_amount).replace(' kr', '').trim()}
                            </div>
                          )}
                          {payment?.deductions && payment.deductions > 0 && (
                            <div className="text-xs text-red-600">
                              -{formatSEK(payment.deductions).replace(' kr', '').trim()}
                            </div>
                          )}
                          
                          {/* Action Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-16 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => openEditModal(employee, month)}
                            disabled={loading}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            {payment ? 'Edit' : 'Add'}
                          </Button>
                        </div>
                      </div>
                    </td>
                  );
                })}
                
                <td className="p-3 text-center font-medium bg-muted/30">
                  {formatSEK(yearlyTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        
        {/* Totals Row */}
        <tfoot>
          <tr className="border-t-2 font-medium">
            <td className="p-3 sticky left-0 bg-background z-10">
              Monthly Totals
            </td>
            {months.map((monthData) => {
              const month = monthData.number;
              const monthlyTotal = employees.reduce((total, employee) => {
                const payment = getPayment(employee.id, month);
                return total + (payment?.total_amount || employee.base_salary);
              }, 0);
              
              return (
                <td key={month} className="p-3 text-center bg-muted/30">
                  {formatSEK(monthlyTotal)}
                </td>
              );
            })}
            <td className="p-3 text-center bg-muted/50 font-bold">
              {formatSEK(employees.reduce((total, employee) => {
                const employeeYearlyTotal = months.reduce((empTotal, monthData) => {
                  const payment = getPayment(employee.id, monthData.number);
                  return empTotal + (payment?.total_amount || employee.base_salary);
                }, 0);
                return total + employeeYearlyTotal;
              }, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
      
      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-green-600" />
          <span>Paid</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-blue-600" />
          <span>Scheduled (shows in cash flow)</span>
        </div>
        <div className="flex items-center gap-1">
          <Edit2 className="h-3 w-3" />
          <span>Hover and click to edit</span>
        </div>
        <div className="flex items-center gap-1 ml-4 text-blue-600">
          <span>•</span>
          <span>Showing: 2 past months + current + future months</span>
        </div>
      </div>
      
      {/* Salary Edit Modal */}
      <SalaryEditModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        employee={editModal.employee}
        payment={editModal.payment}
        year={editModal.year}
        month={editModal.month}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
      />
    </div>
  );
}