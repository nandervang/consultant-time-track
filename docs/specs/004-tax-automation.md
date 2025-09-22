# Tax Automation Feature Specification

**Spec ID:** 004-A  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The Tax Automation feature provides automatic calculation and generation of Swedish business taxes, including employer tax (arbetsgivaravgift) and VAT/MOMS. The system automatically creates tax entries based on business transactions and regulatory requirements.

## Feature Requirements

### Functional Requirements

#### Swedish Tax Regulations Compliance

**Employer Tax (Arbetsgivaravgift)**
- **Rate**: 31.42% of gross salary
- **Payment Due**: Month following salary payment
- **Automatic Generation**: Triggered when salary entries are created
- **Account Code**: Employer tax account in chart of accounts

**VAT/MOMS Tax**
- **Rate**: 25% standard rate
- **Payment Due**: January 11th for previous year
- **Calculation Base**: Total income minus deductible expenses
- **Account Code**: VAT payable account

#### Automatic Triggers
- **Settings Changes**: Tax generation triggered when VAT settings enabled
- **Data Validation**: Fresh settings fetched to prevent race conditions
- **Recurring Calculations**: Proper handling of recurring expenses

### Technical Specifications

#### Tax Calculation Hook
```typescript
// useVatCalculations.ts
interface VatCalculation {
  year: number;
  totalIncome: number;
  totalExpenses: number;
  vatAmount: number;
  dueDate: string;
}

export const useVatCalculations = () => {
  const calculateYearlyVat = async (year: number) => {
    // Fetch fresh settings to avoid race conditions
    const { data: settings } = await supabase
      .from('user_profiles')
      .select('auto_generate_yearly_vat')
      .single();
    
    if (!settings?.auto_generate_yearly_vat) return;
    
    // Calculate VAT based on income and expenses
    const vatCalculation = await performVatCalculation(year);
    
    // Generate VAT entry for January 11th
    await createVatEntry(vatCalculation);
  };
};
```

#### Settings Integration
```typescript
// Settings component trigger
const handleSettingsSave = async () => {
  await updateSettings(formData);
  
  // Trigger tax calculations if VAT enabled
  if (formData.auto_generate_yearly_vat) {
    await calculateYearlyVat(currentYear);
  }
  
  // Trigger employer tax if enabled
  if (formData.auto_generate_employer_tax) {
    await generateEmployerTax();
  }
};
```

### Data Models

#### Tax Entry Structure
```typescript
interface TaxEntry {
  id: string;
  user_id: string;
  amount: number;
  tax_type: 'employer_tax' | 'vat' | 'income_tax';
  due_date: string;
  description: string;
  year: number;
  created_at: string;
  updated_at: string;
}
```

#### User Profile Tax Settings
```typescript
interface UserTaxSettings {
  auto_generate_employer_tax: boolean;
  auto_generate_yearly_vat: boolean;
  employer_tax_rate: number; // Default: 31.42
  vat_rate: number; // Default: 25
  vat_payment_month: number; // Default: 1 (January)
  vat_payment_day: number; // Default: 11
}
```

### Calculation Logic

#### VAT Calculation
```typescript
const calculateVatAmount = (income: number, expenses: number, rate: number = 25) => {
  const taxableIncome = income - expenses;
  return Math.max(0, taxableIncome * (rate / 100));
};

// Recurring expense handling
const calculateRecurringExpenseImpact = (expense: RecurringExpense, year: number) => {
  const startDate = new Date(expense.start_date);
  const endDate = expense.end_date ? new Date(expense.end_date) : new Date(year, 11, 31);
  
  const monthsInYear = getMonthsInYear(startDate, endDate, year);
  return expense.amount * monthsInYear;
};
```

#### Employer Tax Calculation
```typescript
const calculateEmployerTax = (grossSalary: number, rate: number = 31.42) => {
  return grossSalary * (rate / 100);
};

const getEmployerTaxDueDate = (salaryDate: string) => {
  const salary = new Date(salaryDate);
  const dueDate = new Date(salary.getFullYear(), salary.getMonth() + 1, salary.getDate());
  return dueDate.toISOString().split('T')[0];
};
```

### Database Schema

#### Tax Entries Table
```sql
CREATE TABLE tax_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  tax_type TEXT NOT NULL CHECK (tax_type IN ('employer_tax', 'vat', 'income_tax')),
  due_date DATE NOT NULL,
  description TEXT,
  year INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Row Level Security
```sql
-- Enable RLS
ALTER TABLE tax_entries ENABLE ROW LEVEL SECURITY;

-- Policy for user access
CREATE POLICY "Users can access own tax entries" 
ON tax_entries FOR ALL 
USING (auth.uid() = user_id);
```

### Error Handling

#### Calculation Errors
```typescript
const handleTaxCalculationError = (error: Error, context: string) => {
  console.error(`Tax calculation error in ${context}:`, error);
  
  // User feedback
  toast.error(`Tax calculation failed: ${error.message}`);
  
  // Optional: Send to error tracking service
  // errorTracking.capture(error, { context, userId });
};
```

#### Data Validation
```typescript
const validateTaxData = (taxEntry: Partial<TaxEntry>) => {
  const errors: string[] = [];
  
  if (!taxEntry.amount || taxEntry.amount <= 0) {
    errors.push('Tax amount must be positive');
  }
  
  if (!taxEntry.due_date) {
    errors.push('Due date is required');
  }
  
  if (!['employer_tax', 'vat', 'income_tax'].includes(taxEntry.tax_type!)) {
    errors.push('Invalid tax type');
  }
  
  return errors;
};
```

### Integration Points

#### Settings Page Integration
```typescript
// Tax settings section in Settings component
<Card>
  <CardHeader>
    <CardTitle>Tax Automation</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Auto-generate employer tax</Label>
        <Switch 
          checked={settings.auto_generate_employer_tax}
          onCheckedChange={(checked) => 
            updateSetting('auto_generate_employer_tax', checked)
          }
        />
      </div>
      
      <div className="flex items-center justify-between">
        <Label>Auto-generate yearly VAT</Label>
        <Switch 
          checked={settings.auto_generate_yearly_vat}
          onCheckedChange={(checked) => 
            updateSetting('auto_generate_yearly_vat', checked)
          }
        />
      </div>
    </div>
  </CardContent>
</Card>
```

#### Dashboard Integration
```typescript
// Tax overview widget on dashboard
<Card>
  <CardHeader>
    <CardTitle>Upcoming Tax Payments</CardTitle>
  </CardHeader>
  <CardContent>
    {taxEntries.map(entry => (
      <div key={entry.id} className="flex justify-between items-center">
        <span>{entry.description}</span>
        <span className="font-mono">{formatCurrency(entry.amount)} SEK</span>
        <span className="text-sm text-muted-foreground">
          Due: {formatDate(entry.due_date)}
        </span>
      </div>
    ))}
  </CardContent>
</Card>
```

### Performance Considerations

#### Race Condition Prevention
```typescript
// Fresh settings fetch in calculation
const fetchFreshSettings = async () => {
  const { data } = await supabase
    .from('user_profiles')
    .select('auto_generate_yearly_vat, auto_generate_employer_tax')
    .single();
  
  return data;
};
```

#### Batch Operations
```typescript
// Efficient tax entry creation
const createMultipleTaxEntries = async (entries: TaxEntry[]) => {
  const { data, error } = await supabase
    .from('tax_entries')
    .insert(entries)
    .select();
  
  if (error) throw error;
  return data;
};
```

### Testing Requirements

#### Unit Tests
```typescript
describe('Tax Calculations', () => {
  it('calculates VAT correctly for given income/expenses');
  it('handles recurring expenses properly');
  it('calculates employer tax with correct rate');
  it('sets correct due dates');
  it('validates tax entry data');
});
```

#### Integration Tests
```typescript
describe('Tax Automation Integration', () => {
  it('generates tax entries when settings enabled');
  it('prevents duplicate tax entries');
  it('updates existing entries when recalculated');
  it('handles database errors gracefully');
});
```

### Regulatory Compliance

#### Swedish Tax Authority Requirements
- **Accurate Calculations**: Exact compliance with Skatteverket rates
- **Proper Timing**: Correct due dates per regulations
- **Record Keeping**: Audit trail for all calculations
- **Data Integrity**: Consistent and reliable calculations

#### Future Regulatory Updates
- **Rate Changes**: Configurable tax rates for updates
- **Rule Changes**: Flexible calculation logic
- **Reporting**: Export capabilities for tax filing
- **Documentation**: Clear calculation methodology

### Security Considerations

#### Data Protection
- **User Isolation**: RLS ensures user data separation
- **Audit Logging**: Track all tax calculation operations
- **Input Validation**: Prevent malicious data injection
- **Access Control**: Proper permission management

#### Financial Data Security
- **Encryption**: Sensitive tax data encryption
- **Backup**: Regular data backups
- **Recovery**: Disaster recovery procedures
- **Compliance**: GDPR and financial regulations

---

This specification ensures accurate, compliant, and reliable tax automation for Swedish business requirements while maintaining system integrity and user trust.