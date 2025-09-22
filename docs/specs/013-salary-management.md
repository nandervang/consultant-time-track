# Salary Management Specification

**Spec ID:** 013-A  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The Salary Management system provides comprehensive payroll processing and compensation management for consultant businesses, including automated salary calculations, Swedish tax compliance, payment scheduling, and integration with financial planning. It ensures accurate and timely compensation while maintaining full regulatory compliance.

## Feature Requirements

### Functional Requirements

#### Core Salary Management Capabilities

##### Salary Configuration and Structure

- Flexible salary structure definitions (monthly, hourly, project-based, commission)
- Multi-tier compensation models with base salary, bonuses, and incentives
- Automatic cost-of-living adjustments and performance-based increases
- Contract-based salary management for different engagement types
- Currency support for international consulting arrangements
- Salary band definitions and market rate comparisons

##### Payment Processing and Scheduling

- Automated payment scheduling with configurable frequencies
- Direct bank transfer integration with Swedish banking systems
- Payment confirmation and reconciliation workflows
- Split payment support for multiple accounts or savings allocations
- Holiday and weekend payment date adjustments
- Emergency payment processing for urgent situations

##### Swedish Tax and Compliance Integration

- Full integration with Swedish tax regulations (Skatteverket compliance)
- Automatic calculation of employer contributions (31.42% sociala avgifter)
- Personal income tax calculation and withholding
- Pension contribution management (tjänstepension)
- VAT handling for consultant services (25% MOMS)
- Annual tax reporting and documentation generation

### Technical Specifications

#### Data Models

```typescript
interface SalaryStructure {
  id: string;
  user_id: string;
  
  // Structure information
  name: string;
  description: string;
  structure_type: 'monthly_salary' | 'hourly_rate' | 'project_based' | 'commission' | 'mixed';
  
  // Base compensation
  base_amount: number;
  currency: string;
  payment_frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  
  // Additional compensation components
  components: SalaryComponent[];
  
  // Employment details
  employment_type: 'employee' | 'contractor' | 'consultant' | 'freelancer';
  contract_start_date: string;
  contract_end_date?: string;
  
  // Tax and legal information
  tax_jurisdiction: 'sweden' | 'other';
  tax_category: string; // Swedish tax category
  pension_scheme_id?: string;
  
  // Working time
  standard_hours_per_week: number;
  standard_weeks_per_year: number;
  vacation_days_per_year: number;
  
  // Status and validity
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
  
  created_at: string;
  updated_at: string;
}

interface SalaryComponent {
  id: string;
  name: string;
  component_type: 'bonus' | 'commission' | 'allowance' | 'benefit' | 'deduction' | 'tax' | 'pension';
  
  // Calculation details
  calculation_method: 'fixed_amount' | 'percentage_of_base' | 'percentage_of_revenue' | 'hourly_rate' | 'performance_based';
  amount?: number;
  percentage?: number;
  
  // Conditions and triggers
  conditions: ComponentCondition[];
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'annual';
  
  // Tax treatment
  is_taxable: boolean;
  is_pensionable: boolean;
  tax_category?: string;
  
  // Validity
  is_active: boolean;
  effective_from: string;
  effective_until?: string;
}

interface ComponentCondition {
  type: 'revenue_threshold' | 'time_worked' | 'performance_metric' | 'date_range' | 'project_completion';
  operator: 'equals' | 'greater_than' | 'less_than' | 'between';
  value: number | string;
  secondary_value?: number | string; // For 'between' operator
}

interface PayrollPeriod {
  id: string;
  user_id: string;
  
  // Period information
  period_start: string;
  period_end: string;
  payment_date: string;
  payroll_frequency: SalaryStructure['payment_frequency'];
  
  // Calculation basis
  salary_structure_id: string;
  hours_worked: number;
  overtime_hours: number;
  vacation_days_taken: number;
  sick_days_taken: number;
  
  // Revenue and performance data
  revenue_generated: number;
  billable_hours: number;
  performance_score?: number;
  
  // Calculated amounts
  gross_salary: number;
  net_salary: number;
  total_deductions: number;
  total_employer_costs: number;
  
  // Tax calculations
  income_tax: number;
  employer_social_contributions: number;
  employee_social_contributions: number;
  pension_contributions: number;
  
  // Component breakdown
  salary_components: PayrollComponent[];
  
  // Status
  status: 'draft' | 'calculated' | 'approved' | 'paid' | 'cancelled';
  calculated_at?: string;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  
  // Payment details
  payment_method: 'bank_transfer' | 'check' | 'cash' | 'digital_wallet';
  payment_reference?: string;
  bank_account_id?: string;
  
  created_at: string;
  updated_at: string;
}

interface PayrollComponent {
  component_id: string;
  component_name: string;
  component_type: SalaryComponent['component_type'];
  
  // Calculation details
  basis_amount: number; // Amount this component is calculated from
  calculation_rate: number; // Rate or percentage applied
  calculated_amount: number; // Final calculated amount
  
  // Tax impact
  affects_gross_salary: boolean;
  affects_taxable_income: boolean;
  affects_pension_basis: boolean;
  
  notes?: string;
}

interface SwedishTaxConfiguration {
  id: string;
  user_id: string;
  
  // Personal tax information
  personal_number: string; // Personnummer (encrypted)
  tax_residence: 'sweden' | 'other';
  tax_status: 'single' | 'married' | 'registered_partnership';
  
  // Income tax settings
  municipal_tax_rate: number; // Kommunalskatt
  county_tax_rate: number; // Landstingsskatt
  church_tax_rate?: number; // Kyrkoavgift (optional)
  burial_fee_rate: number; // Begravningsavgift
  
  // Social security settings
  pension_base_amount: number; // Prisbasbelopp for current year
  income_base_amount: number; // Inkomstbasbelopp for current year
  
  // Employer contribution rates (sociala avgifter)
  pension_contribution_rate: number; // Ålderspension: 10.21%
  survivor_pension_rate: number; // Efterlevandepension: 0.60%
  disability_pension_rate: number; // Sjukersättning: 2.42%
  health_insurance_rate: number; // Sjukförsäkring: 3.55%
  parental_insurance_rate: number; // Föräldraförsäkring: 2.60%
  work_injury_rate: number; // Arbetsskadeförsäkring: 0.20%
  unemployment_rate: number; // Arbetslöshetsförsäkring: 2.64%
  wage_guarantee_rate: number; // Lönegaranti: 0.20%
  general_payroll_tax_rate: number; // Allmän löneavgift: 9.00%
  
  // Pension scheme settings
  occupational_pension_rate: number; // Tjänstepension rate
  pension_provider_id?: string;
  
  // VAT settings for consulting
  vat_registration_number?: string;
  vat_rate: number; // 25% for most services
  reverse_charge_applicable: boolean; // For B2B services
  
  // Validity and updates
  valid_from: string;
  valid_until?: string;
  last_updated_from_skatteverket?: string;
  
  created_at: string;
  updated_at: string;
}

interface PaymentSchedule {
  id: string;
  user_id: string;
  
  // Schedule configuration
  name: string;
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
  
  // Timing settings
  payment_day_of_week?: number; // 1-7 for weekly/biweekly
  payment_day_of_month?: number; // 1-31 for monthly
  payment_month_of_quarter?: number; // 1-3 for quarterly
  
  // Holiday and weekend handling
  holiday_adjustment: 'before' | 'after' | 'exact';
  weekend_adjustment: 'before' | 'after' | 'exact';
  
  // Bank processing settings
  processing_lead_days: number; // Days before payment date to initiate
  notification_lead_days: number; // Days before payment to notify
  
  // Automatic processing
  auto_calculate: boolean;
  auto_approve: boolean;
  auto_process_payment: boolean;
  
  // Approval workflow
  requires_approval: boolean;
  approval_threshold?: number; // Amount requiring approval
  approver_ids: string[];
  
  // Status
  is_active: boolean;
  next_payment_date?: string;
  
  created_at: string;
  updated_at: string;
}

interface TaxReport {
  id: string;
  user_id: string;
  
  // Report information
  report_type: 'monthly_declaration' | 'annual_declaration' | 'quarterly_vat' | 'year_end_certificate' | 'ku_report';
  tax_year: number;
  reporting_period: string; // YYYY-MM or YYYY-Q1, etc.
  
  // Report data
  total_gross_income: number;
  total_tax_withheld: number;
  total_social_contributions: number;
  total_pension_contributions: number;
  total_vat_collected?: number;
  total_vat_paid?: number;
  
  // Detailed breakdowns
  income_breakdown: IncomeBreakdown[];
  deduction_breakdown: DeductionBreakdown[];
  tax_calculation_details: TaxCalculationDetails;
  
  // Swedish specific reports
  arbetsgivardeklaration_data?: ArbetsgivardeklarationData; // Monthly employer declaration
  kontrolluppgift_data?: KontrolluppgiftData; // Annual control statement
  
  // Status and submission
  status: 'draft' | 'generated' | 'reviewed' | 'submitted' | 'accepted' | 'rejected';
  generated_at: string;
  submitted_at?: string;
  submission_reference?: string;
  skatteverket_response?: string;
  
  // Files and documentation
  report_file_url?: string;
  supporting_documents: string[];
  
  created_at: string;
  updated_at: string;
}

interface IncomeBreakdown {
  income_type: 'base_salary' | 'bonus' | 'commission' | 'consulting_fees' | 'other';
  description: string;
  gross_amount: number;
  taxable_amount: number;
  tax_category: string;
  period_covered: string;
}

interface DeductionBreakdown {
  deduction_type: 'business_expenses' | 'professional_equipment' | 'travel' | 'training' | 'other';
  description: string;
  amount: number;
  supporting_document_url?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
}

interface TaxCalculationDetails {
  taxable_income: number;
  municipal_tax: number;
  county_tax: number;
  church_tax?: number;
  burial_fee: number;
  total_income_tax: number;
  
  social_contributions: {
    employee_contributions: number;
    employer_contributions: number;
    total_contributions: number;
  };
  
  effective_tax_rate: number;
  marginal_tax_rate: number;
}
```

#### Salary Management Hook

```typescript
export const useSalaryManagement = () => {
  const [salaryStructure, setSalaryStructure] = useState<SalaryStructure | null>(null);
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [taxConfig, setTaxConfig] = useState<SwedishTaxConfiguration | null>(null);
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule | null>(null);
  const [loading, setLoading] = useState(false);

  const createSalaryStructure = useCallback(async (
    structureData: Omit<SalaryStructure, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('salary_structures')
        .insert([{
          ...structureData,
          user_id: getCurrentUserId(),
          currency: structureData.currency || 'SEK'
        }])
        .select()
        .single();

      if (error) throw error;

      setSalaryStructure(data);

      // Create default payment schedule
      await createDefaultPaymentSchedule(data.id, data.payment_frequency);

      return data;
    } catch (error) {
      console.error('Failed to create salary structure:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const calculatePayroll = useCallback(async (
    periodData: {
      period_start: string;
      period_end: string;
      hours_worked?: number;
      overtime_hours?: number;
      revenue_generated?: number;
      performance_score?: number;
    }
  ) => {
    if (!salaryStructure || !taxConfig) {
      throw new Error('Salary structure and tax configuration required');
    }

    setLoading(true);
    try {
      // Calculate base salary
      const baseSalary = await calculateBaseSalary(
        salaryStructure,
        periodData.hours_worked || salaryStructure.standard_hours_per_week * 4.33
      );

      // Calculate overtime
      const overtimePay = await calculateOvertimePay(
        salaryStructure,
        periodData.overtime_hours || 0
      );

      // Calculate variable components (bonuses, commissions, etc.)
      const variableComponents = await calculateVariableComponents(
        salaryStructure.components,
        {
          base_salary: baseSalary,
          revenue_generated: periodData.revenue_generated || 0,
          performance_score: periodData.performance_score,
          period_start: periodData.period_start,
          period_end: periodData.period_end
        }
      );

      // Calculate gross salary
      const grossSalary = baseSalary + overtimePay + 
        variableComponents.reduce((sum, comp) => sum + comp.calculated_amount, 0);

      // Calculate Swedish taxes and contributions
      const taxCalculation = await calculateSwedishTaxes(grossSalary, taxConfig);

      // Calculate net salary
      const netSalary = grossSalary - taxCalculation.total_deductions;

      // Create payroll period
      const payrollPeriod: Omit<PayrollPeriod, 'id' | 'created_at' | 'updated_at'> = {
        user_id: getCurrentUserId(),
        period_start: periodData.period_start,
        period_end: periodData.period_end,
        payment_date: calculatePaymentDate(periodData.period_end, paymentSchedule),
        payroll_frequency: salaryStructure.payment_frequency,
        salary_structure_id: salaryStructure.id,
        hours_worked: periodData.hours_worked || 0,
        overtime_hours: periodData.overtime_hours || 0,
        vacation_days_taken: 0, // Would be calculated from time tracking
        sick_days_taken: 0,
        revenue_generated: periodData.revenue_generated || 0,
        billable_hours: await getBillableHours(periodData.period_start, periodData.period_end),
        performance_score: periodData.performance_score,
        gross_salary: grossSalary,
        net_salary: netSalary,
        total_deductions: taxCalculation.total_deductions,
        total_employer_costs: grossSalary + taxCalculation.employer_contributions,
        income_tax: taxCalculation.income_tax,
        employer_social_contributions: taxCalculation.employer_contributions,
        employee_social_contributions: taxCalculation.employee_contributions,
        pension_contributions: taxCalculation.pension_contributions,
        salary_components: [
          {
            component_id: 'base_salary',
            component_name: 'Base Salary',
            component_type: 'bonus',
            basis_amount: baseSalary,
            calculation_rate: 1,
            calculated_amount: baseSalary,
            affects_gross_salary: true,
            affects_taxable_income: true,
            affects_pension_basis: true
          },
          ...(periodData.overtime_hours ? [{
            component_id: 'overtime',
            component_name: 'Overtime Pay',
            component_type: 'bonus' as const,
            basis_amount: periodData.overtime_hours,
            calculation_rate: salaryStructure.base_amount * 1.5, // 150% for overtime
            calculated_amount: overtimePay,
            affects_gross_salary: true,
            affects_taxable_income: true,
            affects_pension_basis: true
          }] : []),
          ...variableComponents
        ],
        status: 'calculated',
        calculated_at: new Date().toISOString(),
        payment_method: 'bank_transfer'
      };

      const { data, error } = await supabase
        .from('payroll_periods')
        .insert([payrollPeriod])
        .select()
        .single();

      if (error) throw error;

      setPayrollPeriods(prev => [...prev, data]);

      // Create cash flow impact
      await createCashFlowImpact({
        type: 'expense',
        amount: data.total_employer_costs,
        date: data.payment_date,
        source: 'payroll',
        reference_id: data.id,
        description: `Payroll for ${data.period_start} to ${data.period_end}`
      });

      return data;
    } catch (error) {
      console.error('Failed to calculate payroll:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [salaryStructure, taxConfig, paymentSchedule]);

  const processPayment = useCallback(async (
    payrollPeriodId: string,
    paymentDetails?: {
      payment_method?: PayrollPeriod['payment_method'];
      bank_account_id?: string;
      payment_reference?: string;
    }
  ) => {
    const payrollPeriod = payrollPeriods.find(p => p.id === payrollPeriodId);
    if (!payrollPeriod) {
      throw new Error('Payroll period not found');
    }

    if (payrollPeriod.status !== 'approved') {
      throw new Error('Payroll period must be approved before payment');
    }

    setLoading(true);
    try {
      // Process bank transfer (would integrate with Swedish banking API)
      const paymentResult = await processBankTransfer({
        amount: payrollPeriod.net_salary,
        recipient_account: paymentDetails?.bank_account_id,
        reference: `Salary ${payrollPeriod.period_start} - ${payrollPeriod.period_end}`,
        payment_date: payrollPeriod.payment_date
      });

      // Update payroll period with payment details
      const { error } = await supabase
        .from('payroll_periods')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: paymentResult.reference,
          ...paymentDetails
        })
        .eq('id', payrollPeriodId);

      if (error) throw error;

      setPayrollPeriods(prev => prev.map(period =>
        period.id === payrollPeriodId
          ? { ...period, status: 'paid', paid_at: new Date().toISOString() }
          : period
      ));

      // Record actual cash flow
      await updateCashFlowActual(payrollPeriod.id, {
        actual_amount: payrollPeriod.total_employer_costs,
        actual_date: new Date().toISOString().split('T')[0]
      });

      // Generate payment confirmation
      await generatePaymentConfirmation(payrollPeriodId);

      return paymentResult;
    } catch (error) {
      console.error('Failed to process payment:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [payrollPeriods]);

  const generateTaxReport = useCallback(async (
    reportConfig: {
      report_type: TaxReport['report_type'];
      tax_year: number;
      reporting_period: string;
    }
  ) => {
    setLoading(true);
    try {
      // Fetch payroll data for the period
      const { data: periodData } = await supabase
        .from('payroll_periods')
        .select('*')
        .eq('user_id', getCurrentUserId())
        .gte('period_start', `${reportConfig.tax_year}-01-01`)
        .lte('period_end', `${reportConfig.tax_year}-12-31`)
        .eq('status', 'paid');

      if (!periodData?.length) {
        throw new Error('No payroll data found for the specified period');
      }

      // Calculate report totals
      const totals = periodData.reduce(
        (acc, period) => ({
          gross_income: acc.gross_income + period.gross_salary,
          tax_withheld: acc.tax_withheld + period.income_tax,
          social_contributions: acc.social_contributions + period.employee_social_contributions + period.employer_social_contributions,
          pension_contributions: acc.pension_contributions + period.pension_contributions
        }),
        { gross_income: 0, tax_withheld: 0, social_contributions: 0, pension_contributions: 0 }
      );

      // Generate income and deduction breakdowns
      const income_breakdown = generateIncomeBreakdown(periodData);
      const deduction_breakdown = await getDeductionBreakdown(reportConfig.tax_year);

      // Calculate detailed tax information
      const tax_calculation_details = calculateDetailedTaxInfo(totals, taxConfig);

      // Create tax report
      const taxReport: Omit<TaxReport, 'id' | 'created_at' | 'updated_at'> = {
        user_id: getCurrentUserId(),
        report_type: reportConfig.report_type,
        tax_year: reportConfig.tax_year,
        reporting_period: reportConfig.reporting_period,
        total_gross_income: totals.gross_income,
        total_tax_withheld: totals.tax_withheld,
        total_social_contributions: totals.social_contributions,
        total_pension_contributions: totals.pension_contributions,
        income_breakdown,
        deduction_breakdown,
        tax_calculation_details,
        status: 'generated',
        generated_at: new Date().toISOString()
      };

      // Add Swedish-specific data based on report type
      if (reportConfig.report_type === 'monthly_declaration') {
        taxReport.arbetsgivardeklaration_data = generateArbetsgivardeklaration(periodData);
      } else if (reportConfig.report_type === 'annual_declaration') {
        taxReport.kontrolluppgift_data = generateKontrolluppgift(periodData);
      }

      const { data, error } = await supabase
        .from('tax_reports')
        .insert([taxReport])
        .select()
        .single();

      if (error) throw error;

      // Generate report file
      const reportFileUrl = await generateTaxReportFile(data);
      
      await supabase
        .from('tax_reports')
        .update({ report_file_url: reportFileUrl })
        .eq('id', data.id);

      return { ...data, report_file_url: reportFileUrl };
    } catch (error) {
      console.error('Failed to generate tax report:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [taxConfig]);

  const updateTaxConfiguration = useCallback(async (
    updates: Partial<SwedishTaxConfiguration>
  ) => {
    if (!taxConfig) {
      throw new Error('Tax configuration not found');
    }

    const { error } = await supabase
      .from('swedish_tax_configurations')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', taxConfig.id);

    if (error) throw error;

    setTaxConfig(prev => prev ? { ...prev, ...updates } : null);

    // Recalculate current payroll if active
    const currentPayroll = payrollPeriods.find(p => p.status === 'calculated');
    if (currentPayroll) {
      await recalculatePayroll(currentPayroll.id);
    }
  }, [taxConfig, payrollPeriods]);

  return {
    salaryStructure,
    payrollPeriods,
    taxConfig,
    paymentSchedule,
    loading,
    createSalaryStructure,
    calculatePayroll,
    processPayment,
    generateTaxReport,
    updateTaxConfiguration,
    refreshData: () => Promise.all([
      fetchSalaryStructure(),
      fetchPayrollPeriods(),
      fetchTaxConfiguration(),
      fetchPaymentSchedule()
    ])
  };
};
```

### User Interface Specifications

#### Salary Dashboard

```typescript
const SalaryDashboard = () => {
  const { 
    salaryStructure, 
    payrollPeriods, 
    taxConfig, 
    calculatePayroll, 
    processPayment 
  } = useSalaryManagement();

  const currentYear = new Date().getFullYear();
  const yearToDate = useMemo(() => {
    const ytdPeriods = payrollPeriods.filter(p => 
      new Date(p.period_start).getFullYear() === currentYear &&
      p.status === 'paid'
    );

    return {
      gross_income: ytdPeriods.reduce((sum, p) => sum + p.gross_salary, 0),
      net_income: ytdPeriods.reduce((sum, p) => sum + p.net_salary, 0),
      taxes_paid: ytdPeriods.reduce((sum, p) => sum + p.income_tax, 0),
      employer_costs: ytdPeriods.reduce((sum, p) => sum + p.total_employer_costs, 0)
    };
  }, [payrollPeriods, currentYear]);

  const nextPayment = useMemo(() => {
    return payrollPeriods
      .filter(p => p.status === 'approved' && new Date(p.payment_date) > new Date())
      .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())[0];
  }, [payrollPeriods]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Salary Management</h1>
          <p className="text-muted-foreground">
            Manage compensation and payroll processing
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Tax Reports
          </Button>
          <Button>
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Payroll
          </Button>
        </div>
      </div>

      {/* Year-to-date summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Income YTD</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(yearToDate.gross_income)}
            </div>
            <p className="text-xs text-muted-foreground">
              Before taxes and deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income YTD</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(yearToDate.net_income)}
            </div>
            <p className="text-xs text-muted-foreground">
              After taxes and deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxes Paid YTD</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(yearToDate.taxes_paid)}
            </div>
            <p className="text-xs text-muted-foreground">
              {yearToDate.gross_income > 0 ? 
                Math.round((yearToDate.taxes_paid / yearToDate.gross_income) * 100) : 0}% effective rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employer Cost</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(yearToDate.employer_costs)}
            </div>
            <p className="text-xs text-muted-foreground">
              Including social contributions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next payment and recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next payment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Next Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {nextPayment ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Payment Date</span>
                  <span className="font-medium">
                    {format(new Date(nextPayment.payment_date), 'MMM dd, yyyy')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gross Amount</span>
                  <span className="font-medium">
                    {formatCurrency(nextPayment.gross_salary)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Net Amount</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(nextPayment.net_salary)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <PayrollStatusBadge status={nextPayment.status} />
                </div>

                <div className="pt-2">
                  <Button 
                    className="w-full"
                    onClick={() => processPayment(nextPayment.id)}
                    disabled={nextPayment.status !== 'approved'}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Process Payment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pending payments</h3>
                <p className="text-muted-foreground mb-4">
                  All scheduled payments are up to date.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Salary structure overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Current Salary Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salaryStructure ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Structure Type</span>
                  <Badge variant="outline">
                    {salaryStructure.structure_type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Base Amount</span>
                  <span className="font-medium">
                    {formatCurrency(salaryStructure.base_amount)} / {salaryStructure.payment_frequency}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Employment Type</span>
                  <span className="font-medium capitalize">
                    {salaryStructure.employment_type}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tax Jurisdiction</span>
                  <span className="font-medium capitalize">
                    {salaryStructure.tax_jurisdiction}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Components</span>
                  <span className="font-medium">
                    {salaryStructure.components.length} active
                  </span>
                </div>

                <div className="pt-2">
                  <Button variant="outline" className="w-full" asChild>
                    <Link to="/salary/structure/edit">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Structure
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No salary structure</h3>
                <p className="text-muted-foreground mb-4">
                  Set up your compensation structure to get started.
                </p>
                <Button asChild>
                  <Link to="/salary/structure/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Structure
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent payroll periods */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payroll Periods</CardTitle>
        </CardHeader>
        <CardContent>
          {payrollPeriods.length === 0 ? (
            <div className="text-center py-8">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payroll history</h3>
              <p className="text-muted-foreground mb-4">
                Start by calculating your first payroll period.
              </p>
              <Button>
                <Calculator className="h-4 w-4 mr-2" />
                Calculate Payroll
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {payrollPeriods
                .sort((a, b) => new Date(b.period_end).getTime() - new Date(a.period_end).getTime())
                .slice(0, 5)
                .map((period) => (
                  <PayrollPeriodRow
                    key={period.id}
                    period={period}
                    onProcess={() => processPayment(period.id)}
                  />
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tax configuration status */}
      {taxConfig && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Swedish Tax Configuration</AlertTitle>
          <AlertDescription>
            Last updated: {format(new Date(taxConfig.updated_at), 'MMM dd, yyyy')}
            {taxConfig.last_updated_from_skatteverket && (
              <span className="block text-xs mt-1">
                Skatteverket sync: {format(new Date(taxConfig.last_updated_from_skatteverket), 'MMM dd, yyyy')}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
```

### Database Schema

#### Salary Management Tables

```sql
-- Salary structures table
CREATE TABLE salary_structures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Structure information
  name TEXT NOT NULL,
  description TEXT,
  structure_type TEXT NOT NULL CHECK (structure_type IN ('monthly_salary', 'hourly_rate', 'project_based', 'commission', 'mixed')),
  
  -- Base compensation
  base_amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'SEK',
  payment_frequency TEXT NOT NULL CHECK (payment_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  
  -- Additional compensation components
  components JSONB DEFAULT '[]',
  
  -- Employment details
  employment_type TEXT NOT NULL CHECK (employment_type IN ('employee', 'contractor', 'consultant', 'freelancer')),
  contract_start_date DATE NOT NULL,
  contract_end_date DATE,
  
  -- Tax and legal information
  tax_jurisdiction TEXT DEFAULT 'sweden' CHECK (tax_jurisdiction IN ('sweden', 'other')),
  tax_category TEXT,
  pension_scheme_id UUID,
  
  -- Working time
  standard_hours_per_week DECIMAL(4,2) DEFAULT 40,
  standard_weeks_per_year INTEGER DEFAULT 52,
  vacation_days_per_year INTEGER DEFAULT 25,
  
  -- Status and validity
  is_active BOOLEAN DEFAULT TRUE,
  effective_from DATE NOT NULL,
  effective_until DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payroll periods table
CREATE TABLE payroll_periods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Period information
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  payment_date DATE NOT NULL,
  payroll_frequency TEXT NOT NULL CHECK (payroll_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  
  -- Calculation basis
  salary_structure_id UUID REFERENCES salary_structures(id) ON DELETE RESTRICT,
  hours_worked DECIMAL(8,2) DEFAULT 0,
  overtime_hours DECIMAL(8,2) DEFAULT 0,
  vacation_days_taken DECIMAL(4,2) DEFAULT 0,
  sick_days_taken DECIMAL(4,2) DEFAULT 0,
  
  -- Revenue and performance data
  revenue_generated DECIMAL(12,2) DEFAULT 0,
  billable_hours DECIMAL(8,2) DEFAULT 0,
  performance_score DECIMAL(3,2), -- 0.00 to 1.00
  
  -- Calculated amounts
  gross_salary DECIMAL(12,2) NOT NULL,
  net_salary DECIMAL(12,2) NOT NULL,
  total_deductions DECIMAL(12,2) NOT NULL,
  total_employer_costs DECIMAL(12,2) NOT NULL,
  
  -- Tax calculations
  income_tax DECIMAL(12,2) DEFAULT 0,
  employer_social_contributions DECIMAL(12,2) DEFAULT 0,
  employee_social_contributions DECIMAL(12,2) DEFAULT 0,
  pension_contributions DECIMAL(12,2) DEFAULT 0,
  
  -- Component breakdown
  salary_components JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid', 'cancelled')),
  calculated_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  
  -- Payment details
  payment_method TEXT DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'check', 'cash', 'digital_wallet')),
  payment_reference TEXT,
  bank_account_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Swedish tax configuration table
CREATE TABLE swedish_tax_configurations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Personal tax information (encrypted)
  personal_number_encrypted TEXT, -- Personnummer (encrypted)
  tax_residence TEXT DEFAULT 'sweden' CHECK (tax_residence IN ('sweden', 'other')),
  tax_status TEXT DEFAULT 'single' CHECK (tax_status IN ('single', 'married', 'registered_partnership')),
  
  -- Income tax rates
  municipal_tax_rate DECIMAL(5,4) NOT NULL, -- Kommunalskatt
  county_tax_rate DECIMAL(5,4) NOT NULL, -- Landstingsskatt
  church_tax_rate DECIMAL(5,4) DEFAULT 0, -- Kyrkoavgift (optional)
  burial_fee_rate DECIMAL(5,4) NOT NULL, -- Begravningsavgift
  
  -- Social security settings
  pension_base_amount DECIMAL(10,2) NOT NULL, -- Prisbasbelopp
  income_base_amount DECIMAL(10,2) NOT NULL, -- Inkomstbasbelopp
  
  -- Employer contribution rates (sociala avgifter) - current rates as of 2025
  pension_contribution_rate DECIMAL(5,4) DEFAULT 0.1021, -- Ålderspension: 10.21%
  survivor_pension_rate DECIMAL(5,4) DEFAULT 0.0060, -- Efterlevandepension: 0.60%
  disability_pension_rate DECIMAL(5,4) DEFAULT 0.0242, -- Sjukersättning: 2.42%
  health_insurance_rate DECIMAL(5,4) DEFAULT 0.0355, -- Sjukförsäkring: 3.55%
  parental_insurance_rate DECIMAL(5,4) DEFAULT 0.0260, -- Föräldraförsäkring: 2.60%
  work_injury_rate DECIMAL(5,4) DEFAULT 0.0020, -- Arbetsskadeförsäkring: 0.20%
  unemployment_rate DECIMAL(5,4) DEFAULT 0.0264, -- Arbetslöshetsförsäkring: 2.64%
  wage_guarantee_rate DECIMAL(5,4) DEFAULT 0.0020, -- Lönegaranti: 0.20%
  general_payroll_tax_rate DECIMAL(5,4) DEFAULT 0.0900, -- Allmän löneavgift: 9.00%
  
  -- Pension scheme settings
  occupational_pension_rate DECIMAL(5,4) DEFAULT 0.045, -- Tjänstepension: 4.5%
  pension_provider_id UUID,
  
  -- VAT settings for consulting
  vat_registration_number TEXT,
  vat_rate DECIMAL(5,4) DEFAULT 0.25, -- 25% for most services
  reverse_charge_applicable BOOLEAN DEFAULT FALSE, -- For B2B services
  
  -- Validity and updates
  valid_from DATE NOT NULL,
  valid_until DATE,
  last_updated_from_skatteverket TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment schedules table
CREATE TABLE payment_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Schedule configuration
  name TEXT NOT NULL,
  description TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
  
  -- Timing settings
  payment_day_of_week INTEGER CHECK (payment_day_of_week BETWEEN 1 AND 7), -- 1-7 for weekly/biweekly
  payment_day_of_month INTEGER CHECK (payment_day_of_month BETWEEN 1 AND 31), -- 1-31 for monthly
  payment_month_of_quarter INTEGER CHECK (payment_month_of_quarter BETWEEN 1 AND 3), -- 1-3 for quarterly
  
  -- Holiday and weekend handling
  holiday_adjustment TEXT DEFAULT 'before' CHECK (holiday_adjustment IN ('before', 'after', 'exact')),
  weekend_adjustment TEXT DEFAULT 'before' CHECK (weekend_adjustment IN ('before', 'after', 'exact')),
  
  -- Bank processing settings
  processing_lead_days INTEGER DEFAULT 2, -- Days before payment date to initiate
  notification_lead_days INTEGER DEFAULT 5, -- Days before payment to notify
  
  -- Automatic processing
  auto_calculate BOOLEAN DEFAULT FALSE,
  auto_approve BOOLEAN DEFAULT FALSE,
  auto_process_payment BOOLEAN DEFAULT FALSE,
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT TRUE,
  approval_threshold DECIMAL(12,2), -- Amount requiring approval
  approver_ids UUID[],
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  next_payment_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax reports table
CREATE TABLE tax_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Report information
  report_type TEXT NOT NULL CHECK (report_type IN ('monthly_declaration', 'annual_declaration', 'quarterly_vat', 'year_end_certificate', 'ku_report')),
  tax_year INTEGER NOT NULL,
  reporting_period TEXT NOT NULL, -- YYYY-MM or YYYY-Q1, etc.
  
  -- Report data
  total_gross_income DECIMAL(12,2) NOT NULL,
  total_tax_withheld DECIMAL(12,2) NOT NULL,
  total_social_contributions DECIMAL(12,2) NOT NULL,
  total_pension_contributions DECIMAL(12,2) NOT NULL,
  total_vat_collected DECIMAL(12,2),
  total_vat_paid DECIMAL(12,2),
  
  -- Detailed breakdowns
  income_breakdown JSONB DEFAULT '[]',
  deduction_breakdown JSONB DEFAULT '[]',
  tax_calculation_details JSONB NOT NULL,
  
  -- Swedish specific reports
  arbetsgivardeklaration_data JSONB, -- Monthly employer declaration
  kontrolluppgift_data JSONB, -- Annual control statement
  
  -- Status and submission
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'reviewed', 'submitted', 'accepted', 'rejected')),
  generated_at TIMESTAMPTZ NOT NULL,
  submitted_at TIMESTAMPTZ,
  submission_reference TEXT,
  skatteverket_response TEXT,
  
  -- Files and documentation
  report_file_url TEXT,
  supporting_documents TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Indexes and Constraints

```sql
-- Performance indexes
CREATE INDEX idx_salary_structures_user_active ON salary_structures(user_id, is_active);
CREATE INDEX idx_payroll_periods_user_date ON payroll_periods(user_id, period_end DESC);
CREATE INDEX idx_payroll_periods_payment_date ON payroll_periods(payment_date) WHERE status IN ('approved', 'paid');
CREATE INDEX idx_payroll_periods_status ON payroll_periods(status, payment_date);

-- Tax configuration indexes
CREATE UNIQUE INDEX idx_swedish_tax_config_user ON swedish_tax_configurations(user_id);
CREATE INDEX idx_tax_reports_user_year ON tax_reports(user_id, tax_year);
CREATE INDEX idx_tax_reports_type_period ON tax_reports(report_type, reporting_period);

-- Payment schedules
CREATE INDEX idx_payment_schedules_user_active ON payment_schedules(user_id, is_active);
CREATE INDEX idx_payment_schedules_next_payment ON payment_schedules(next_payment_date) WHERE is_active = TRUE;

-- GIN indexes for JSONB columns
CREATE INDEX idx_salary_structures_components ON salary_structures USING GIN(components);
CREATE INDEX idx_payroll_periods_components ON payroll_periods USING GIN(salary_components);
CREATE INDEX idx_tax_reports_breakdown ON tax_reports USING GIN(income_breakdown, deduction_breakdown);

-- Unique constraints
CREATE UNIQUE INDEX idx_salary_structures_user_active_period ON salary_structures(user_id, effective_from) 
WHERE is_active = TRUE;

-- Check constraints
ALTER TABLE payroll_periods ADD CONSTRAINT check_period_dates 
  CHECK (period_end > period_start);

ALTER TABLE payroll_periods ADD CONSTRAINT check_payment_date 
  CHECK (payment_date >= period_end);

ALTER TABLE payroll_periods ADD CONSTRAINT check_salary_amounts 
  CHECK (gross_salary >= 0 AND net_salary >= 0 AND total_deductions >= 0);

ALTER TABLE salary_structures ADD CONSTRAINT check_effective_dates 
  CHECK (effective_until IS NULL OR effective_until > effective_from);
```

#### Row Level Security

```sql
-- Enable RLS
ALTER TABLE salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE swedish_tax_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_reports ENABLE ROW LEVEL SECURITY;

-- Salary structures policies
CREATE POLICY "Users can access own salary structures" 
ON salary_structures FOR ALL 
USING (auth.uid() = user_id);

-- Payroll periods policies
CREATE POLICY "Users can access own payroll periods" 
ON payroll_periods FOR ALL 
USING (auth.uid() = user_id);

-- Tax configuration policies
CREATE POLICY "Users can access own tax configuration" 
ON swedish_tax_configurations FOR ALL 
USING (auth.uid() = user_id);

-- Payment schedules policies
CREATE POLICY "Users can access own payment schedules" 
ON payment_schedules FOR ALL 
USING (auth.uid() = user_id);

-- Tax reports policies
CREATE POLICY "Users can access own tax reports" 
ON tax_reports FOR ALL 
USING (auth.uid() = user_id);
```

### Business Logic Functions

#### Swedish Tax Calculation

```sql
-- Function to calculate Swedish income tax
CREATE OR REPLACE FUNCTION calculate_swedish_income_tax(
  gross_income DECIMAL,
  municipal_rate DECIMAL,
  county_rate DECIMAL,
  church_rate DECIMAL DEFAULT 0,
  burial_rate DECIMAL DEFAULT 0.0022
) RETURNS TABLE(
  taxable_income DECIMAL,
  municipal_tax DECIMAL,
  county_tax DECIMAL,
  church_tax DECIMAL,
  burial_fee DECIMAL,
  total_tax DECIMAL
) AS $$
BEGIN
  -- Basic calculation - more complex rules would be implemented for real use
  taxable_income := gross_income;
  municipal_tax := taxable_income * municipal_rate;
  county_tax := taxable_income * county_rate;
  church_tax := taxable_income * church_rate;
  burial_fee := taxable_income * burial_rate;
  total_tax := municipal_tax + county_tax + church_tax + burial_fee;
  
  RETURN QUERY SELECT 
    calculate_swedish_income_tax.taxable_income,
    calculate_swedish_income_tax.municipal_tax,
    calculate_swedish_income_tax.county_tax,
    calculate_swedish_income_tax.church_tax,
    calculate_swedish_income_tax.burial_fee,
    calculate_swedish_income_tax.total_tax;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate employer social contributions
CREATE OR REPLACE FUNCTION calculate_employer_contributions(
  gross_salary DECIMAL,
  config_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  total_rate DECIMAL;
BEGIN
  SELECT 
    pension_contribution_rate + survivor_pension_rate + disability_pension_rate +
    health_insurance_rate + parental_insurance_rate + work_injury_rate +
    unemployment_rate + wage_guarantee_rate + general_payroll_tax_rate
  INTO total_rate
  FROM swedish_tax_configurations
  WHERE id = config_id;
  
  RETURN gross_salary * COALESCE(total_rate, 0.3142); -- Default to 31.42%
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update cash flow when payroll is processed
CREATE OR REPLACE FUNCTION update_cash_flow_from_payroll()
RETURNS TRIGGER AS $$
BEGIN
  -- Create cash flow entry for payroll expense
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid') THEN
    INSERT INTO cash_flow_entries (
      user_id,
      type,
      amount,
      date,
      description,
      source,
      reference_id,
      is_actual
    ) VALUES (
      NEW.user_id,
      'expense',
      NEW.total_employer_costs,
      NEW.payment_date,
      'Payroll payment for ' || NEW.period_start || ' to ' || NEW.period_end,
      'payroll',
      NEW.id,
      TRUE
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_cash_flow_from_payroll
  AFTER UPDATE ON payroll_periods
  FOR EACH ROW EXECUTE FUNCTION update_cash_flow_from_payroll();
```

### Integration with Other Systems

#### Cash Flow Integration

```typescript
// Create cash flow projections based on salary schedule
const createSalaryProjections = async (
  salaryStructure: SalaryStructure,
  paymentSchedule: PaymentSchedule,
  months: number = 12
) => {
  const projections = [];
  const startDate = new Date();

  for (let i = 0; i < months; i++) {
    const projectionDate = addMonths(startDate, i);
    const monthlyGross = calculateMonthlyGross(salaryStructure);
    const employerCosts = monthlyGross * 1.3142; // Including social contributions

    projections.push({
      type: 'expense' as const,
      amount: employerCosts,
      date: format(projectionDate, 'yyyy-MM-dd'),
      description: `Projected salary expense - ${format(projectionDate, 'MMM yyyy')}`,
      source: 'salary_projection' as const,
      is_projected: true
    });
  }

  return projections;
};
```

#### Time Tracking Integration

```typescript
// Calculate billable hours for payroll period
const getBillableHoursForPeriod = async (
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<number> => {
  const { data: timeEntries } = await supabase
    .from('time_entries')
    .select('duration_minutes')
    .eq('user_id', userId)
    .eq('is_billable', true)
    .gte('date', periodStart)
    .lte('date', periodEnd);

  return timeEntries?.reduce((total, entry) => 
    total + (entry.duration_minutes / 60), 0) || 0;
};

// Calculate revenue generated for commission calculations
const getRevenueForPeriod = async (
  userId: string,
  periodStart: string,
  periodEnd: string
): Promise<number> => {
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total')
    .eq('user_id', userId)
    .eq('status', 'paid')
    .gte('issued_date', periodStart)
    .lte('issued_date', periodEnd);

  return invoices?.reduce((total, invoice) => total + invoice.total, 0) || 0;
};
```

### Performance Optimizations

#### Calculation Caching

```typescript
// Cache tax calculations to avoid repeated computation
const useTaxCalculationCache = () => {
  const [cache, setCache] = useState<Map<string, TaxCalculation>>(new Map());

  const getCachedTaxCalculation = (
    grossSalary: number,
    configId: string
  ): TaxCalculation | null => {
    const key = `${grossSalary}-${configId}`;
    return cache.get(key) || null;
  };

  const setCachedTaxCalculation = (
    grossSalary: number,
    configId: string,
    calculation: TaxCalculation
  ) => {
    const key = `${grossSalary}-${configId}`;
    setCache(prev => new Map(prev.set(key, calculation)));
  };

  return { getCachedTaxCalculation, setCachedTaxCalculation };
};
```

### Testing Requirements

#### Unit Tests

```typescript
describe('Salary Management', () => {
  it('calculates Swedish taxes correctly');
  it('applies employer contributions properly');
  it('handles different salary structures');
  it('processes payments accurately');
  it('generates tax reports correctly');
});

describe('Swedish Tax Calculations', () => {
  it('calculates municipal and county tax');
  it('applies social contributions correctly');
  it('handles pension calculations');
  it('validates tax configuration updates');
});
```

#### Integration Tests

```typescript
describe('Salary System Integration', () => {
  it('integrates with cash flow projections');
  it('connects with time tracking data');
  it('maintains compliance with regulations');
  it('handles multi-currency scenarios');
});
```

---

This specification ensures the Salary Management system provides comprehensive payroll processing while maintaining full compliance with Swedish tax regulations and seamless integration with other business systems.