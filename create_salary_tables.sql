-- Salary Management Tables
-- Execute this in your Supabase SQL editor

-- Table for employee information
CREATE TABLE salary_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  employee_number TEXT,
  position TEXT,
  base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'SEK',
  employment_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  employment_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table for monthly salary payments
CREATE TABLE salary_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  employee_id UUID REFERENCES salary_employees(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  salary_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (salary_amount + COALESCE(bonus_amount, 0) - COALESCE(deductions, 0)) STORED,
  payment_date DATE,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'paid', 'cancelled')),
  notes TEXT,
  cash_flow_entry_id UUID REFERENCES cash_flow_entries(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Ensure one payment per employee per month
  UNIQUE(employee_id, year, month)
);

-- Add indexes for performance
CREATE INDEX idx_salary_employees_user_id ON salary_employees(user_id);
CREATE INDEX idx_salary_employees_active ON salary_employees(user_id, is_active);
CREATE INDEX idx_salary_payments_user_id ON salary_payments(user_id);
CREATE INDEX idx_salary_payments_employee_year_month ON salary_payments(employee_id, year, month);
CREATE INDEX idx_salary_payments_status ON salary_payments(user_id, status);

-- Enable RLS (Row Level Security)
ALTER TABLE salary_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own employees" ON salary_employees
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own employees" ON salary_employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees" ON salary_employees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees" ON salary_employees
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own salary payments" ON salary_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own salary payments" ON salary_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own salary payments" ON salary_payments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own salary payments" ON salary_payments
  FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function (reusable)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_salary_employees_updated_at 
  BEFORE UPDATE ON salary_employees 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_salary_payments_updated_at 
  BEFORE UPDATE ON salary_payments 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Add comment
COMMENT ON TABLE salary_employees IS 'Employee information for salary management';
COMMENT ON TABLE salary_payments IS 'Monthly salary payments with override capabilities';