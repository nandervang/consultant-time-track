/*
  # Consultant Dashboard Schema Extension

  1. New Tables
    - `dashboard_widgets` - User dashboard widget configurations
    - `cash_flow_entries` - Income and expense transactions
    - `budgets` - Budget categories and limits
    - `budget_entries` - Budget transactions
    - `clients` - Client information
    - `invoices` - Invoice management
    - `user_profiles` - Extended user information

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text,
  company_motto text DEFAULT 'Building the future, one project at a time.',
  avatar_url text,
  timezone text DEFAULT 'Europe/Stockholm',
  currency text DEFAULT 'SEK',
  hourly_rate decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create dashboard_widgets table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  widget_type text NOT NULL,
  title text NOT NULL,
  position_x integer NOT NULL DEFAULT 0,
  position_y integer NOT NULL DEFAULT 0,
  width integer NOT NULL DEFAULT 1,
  height integer NOT NULL DEFAULT 1,
  config jsonb DEFAULT '{}',
  is_visible boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create cash_flow_entries table
CREATE TABLE IF NOT EXISTS cash_flow_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  category text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  is_recurring boolean DEFAULT false,
  recurring_interval text CHECK (recurring_interval IN ('weekly', 'monthly', 'yearly')),
  next_due_date date,
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  client_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budgets table
CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  budget_limit decimal(10,2) NOT NULL CHECK (budget_limit > 0),
  period text NOT NULL DEFAULT 'monthly' CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create budget_entries table
CREATE TABLE IF NOT EXISTS budget_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid REFERENCES budgets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  cash_flow_entry_id uuid REFERENCES cash_flow_entries(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  address text,
  hourly_rate decimal(10,2),
  currency text DEFAULT 'SEK',
  status text CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  title text NOT NULL,
  description text,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  tax_amount decimal(10,2) DEFAULT 0,
  total_amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'SEK',
  status text CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) DEFAULT 'draft',
  issue_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  paid_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique constraint on invoice number per user
CREATE UNIQUE INDEX IF NOT EXISTS invoices_number_user_id_unique 
ON invoices(invoice_number, user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS dashboard_widgets_user_id_idx ON dashboard_widgets(user_id);
CREATE INDEX IF NOT EXISTS cash_flow_entries_user_id_date_idx ON cash_flow_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS cash_flow_entries_type_idx ON cash_flow_entries(type);
CREATE INDEX IF NOT EXISTS cash_flow_entries_category_idx ON cash_flow_entries(category);
CREATE INDEX IF NOT EXISTS budgets_user_id_idx ON budgets(user_id);
CREATE INDEX IF NOT EXISTS budget_entries_budget_id_idx ON budget_entries(budget_id);
CREATE INDEX IF NOT EXISTS budget_entries_user_id_date_idx ON budget_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS clients_user_id_idx ON clients(user_id);
CREATE INDEX IF NOT EXISTS clients_status_idx ON clients(status);
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_client_id_idx ON invoices(client_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for user_profiles table
CREATE POLICY "Users can read own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for dashboard_widgets table
CREATE POLICY "Users can manage own widgets"
  ON dashboard_widgets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for cash_flow_entries table
CREATE POLICY "Users can manage own cash flow entries"
  ON cash_flow_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for budgets table
CREATE POLICY "Users can manage own budgets"
  ON budgets
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for budget_entries table
CREATE POLICY "Users can manage own budget entries"
  ON budget_entries
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for clients table
CREATE POLICY "Users can manage own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policies for invoices table
CREATE POLICY "Users can manage own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at
  BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_flow_entries_updated_at
  BEFORE UPDATE ON cash_flow_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create views for analytics
CREATE OR REPLACE VIEW cash_flow_summary AS
SELECT 
  user_id,
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
  SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as net_flow
FROM cash_flow_entries
GROUP BY user_id, DATE_TRUNC('month', date)
ORDER BY month DESC;

CREATE OR REPLACE VIEW budget_status AS
SELECT 
  b.id,
  b.user_id,
  b.name,
  b.category,
  b.budget_limit,
  b.period,
  COALESCE(SUM(be.amount), 0) as spent_amount,
  b.budget_limit - COALESCE(SUM(be.amount), 0) as remaining_amount,
  CASE 
    WHEN b.budget_limit > 0 THEN ROUND((COALESCE(SUM(be.amount), 0) / b.budget_limit * 100), 2)
    ELSE 0 
  END as usage_percentage
FROM budgets b
LEFT JOIN budget_entries be ON b.id = be.budget_id 
  AND be.date >= b.start_date 
  AND (b.end_date IS NULL OR be.date <= b.end_date)
WHERE b.is_active = true
GROUP BY b.id, b.user_id, b.name, b.category, b.budget_limit, b.period;

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
