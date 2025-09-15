import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatSEK } from '../../lib/currency';
import { DollarSign, Trash2 } from 'lucide-react';

import type { SalaryPaymentWithEmployee } from '../../hooks/useSalaryPayments';

interface SalaryEmployee {
  id: string;
  name: string;
  position: string | null;
  base_salary: number;
  currency: string;
}

interface SalaryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: SalaryEmployee | null;
  payment: SalaryPaymentWithEmployee | null;
  year: number;
  month: number;
  onSave: (paymentData: Record<string, unknown>) => Promise<void>;
  onDelete?: (paymentId: string) => Promise<void>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function SalaryEditModal({
  isOpen,
  onClose,
  employee,
  payment,
  year,
  month,
  onSave,
  onDelete
}: SalaryEditModalProps) {
  const [salaryAmount, setSalaryAmount] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [deductions, setDeductions] = useState('');
  const [paymentDate, setPaymentDate] = useState('');
  const [status, setStatus] = useState<'scheduled' | 'paid'>('scheduled');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Reset form when modal opens/closes or payment changes
  useEffect(() => {
    if (isOpen && employee) {
      if (payment) {
        // Editing existing payment
        setSalaryAmount(payment.salary_amount.toString());
        setBonusAmount(payment.bonus_amount?.toString() || '');
        setDeductions(payment.deductions?.toString() || '');
        setPaymentDate(payment.payment_date || `${year}-${month.toString().padStart(2, '0')}-01`);
        setStatus(payment.status === 'cancelled' ? 'scheduled' : payment.status);
        setNotes(payment.notes || '');
      } else {
        // Creating new payment
        setSalaryAmount(employee.base_salary.toString());
        setBonusAmount('');
        setDeductions('');
        setPaymentDate(`${year}-${month.toString().padStart(2, '0')}-01`);
        setStatus('scheduled');
        setNotes('');
      }
    }
  }, [isOpen, employee, payment, year, month]);

  const handleSave = async () => {
    if (!employee) return;

    const salaryAmountNum = parseFloat(salaryAmount) || 0;
    const bonusAmountNum = parseFloat(bonusAmount) || 0;
    const deductionsNum = parseFloat(deductions) || 0;

    if (salaryAmountNum < 0 || bonusAmountNum < 0 || deductionsNum < 0) {
      alert('Amounts cannot be negative');
      return;
    }

    try {
      setLoading(true);
      
      const paymentData: Record<string, unknown> = {
        employee_id: employee.id,
        year,
        month,
        salary_amount: salaryAmountNum,
        bonus_amount: bonusAmountNum || undefined,
        deductions: deductionsNum || undefined,
        payment_date: paymentDate,
        status,
        notes: notes.trim() || undefined
      };

      if (payment) {
        paymentData.id = payment.id;
      }

      await onSave(paymentData);
      onClose();
    } catch (error) {
      console.error('Error saving salary payment:', error);
      alert('Failed to save salary payment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!payment || !onDelete) return;
    
    if (confirm('Are you sure you want to delete this salary payment?')) {
      try {
        setLoading(true);
        await onDelete(payment.id!);
        onClose();
      } catch (error) {
        console.error('Error deleting salary payment:', error);
        alert('Failed to delete salary payment');
      } finally {
        setLoading(false);
      }
    }
  };

  const totalAmount = (parseFloat(salaryAmount) || 0) + (parseFloat(bonusAmount) || 0) - (parseFloat(deductions) || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {payment ? 'Edit' : 'Add'} Salary Payment
          </DialogTitle>
          <div className="text-sm text-muted-foreground">
            {employee?.name} • {MONTH_NAMES[month - 1]} {year}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Salary Amount */}
          <div>
            <Label htmlFor="salaryAmount">Salary Amount ({employee?.currency || 'SEK'})</Label>
            <Input
              id="salaryAmount"
              type="number"
              min="0"
              step="0.01"
              value={salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
              placeholder="0"
            />
            <div className="text-xs text-muted-foreground mt-1">
              Base salary: {formatSEK(employee?.base_salary || 0)}
            </div>
          </div>

          {/* Bonus Amount */}
          <div>
            <Label htmlFor="bonusAmount">Bonus Amount (optional)</Label>
            <Input
              id="bonusAmount"
              type="number"
              min="0"
              step="0.01"
              value={bonusAmount}
              onChange={(e) => setBonusAmount(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Deductions */}
          <div>
            <Label htmlFor="deductions">Deductions (optional)</Label>
            <Input
              id="deductions"
              type="number"
              min="0"
              step="0.01"
              value={deductions}
              onChange={(e) => setDeductions(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Payment Date */}
          <div>
            <Label htmlFor="paymentDate">Payment Date</Label>
            <Input
              id="paymentDate"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={(value: 'scheduled' | 'paid') => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              rows={2}
            />
          </div>

          {/* Total Amount Display */}
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex justify-between items-center text-sm">
              <span className="font-medium">Total Amount:</span>
              <span className={`font-bold ${totalAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatSEK(totalAmount)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <div>
              {payment && onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : payment ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}