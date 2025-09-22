# Database Structure Documentation

**Document ID:** DB-SCHEMA-001  
**Status:** Current  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

This document provides comprehensive documentation of the database schema for the Consultant Time Tracking application. The database is built on Supabase (PostgreSQL) with Row Level Security (RLS) for multi-tenant data isolation.

## Database Architecture

### Technology Stack

- **Database Engine:** PostgreSQL 14+ (via Supabase)
- **Authentication:** Supabase Auth with UUID user identifiers
- **Security:** Row Level Security (RLS) for multi-tenant isolation
- **Data Types:** JSONB for flexible configuration storage
- **Constraints:** Check constraints for data validation
- **Indexing:** Strategic indexes for query performance

### Security Model

All tables implement Row Level Security with user-based policies:

```sql
-- Standard RLS pattern for all user data
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own data" ON table_name
  FOR ALL USING (auth.uid() = user_id);
```

## Core Tables

### 1. User Profiles (`user_profiles`)

**Purpose:** Store user account information, company settings, and global preferences

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Company & Branding
  company_name TEXT,
  company_motto TEXT DEFAULT 'Building the future, one project at a time.',
  avatar_url TEXT,
  
  -- Localization
  timezone TEXT DEFAULT 'Europe/Stockholm',
  currency TEXT DEFAULT 'SEK',
  
  -- Financial Configuration
  hourly_rate DECIMAL(10,2),
  debit_rate_monthly DECIMAL(5,2) DEFAULT 94.0 
    CHECK (debit_rate_monthly >= 0 AND debit_rate_monthly <= 100),
  absence_percentage DECIMAL(5,2) DEFAULT 15.0 
    CHECK (absence_percentage >= 0 AND absence_percentage <= 100),
  
  -- Work Schedule
  work_hours_per_day INTEGER DEFAULT 8 
    CHECK (work_hours_per_day >= 1 AND work_hours_per_day <= 24),
  work_days_per_week INTEGER DEFAULT 5 
    CHECK (work_days_per_week >= 1 AND work_days_per_week <= 7),
  
  -- Tax Settings
  auto_generate_employer_tax BOOLEAN DEFAULT false,
  employer_tax_payment_date INTEGER DEFAULT 12 
    CHECK (employer_tax_payment_date >= 1 AND employer_tax_payment_date <= 31),
  auto_generate_yearly_vat BOOLEAN DEFAULT false,
  vat_rate_income DECIMAL(5,2) DEFAULT 25.0 
    CHECK (vat_rate_income >= 0 AND vat_rate_income <= 100),
  vat_rate_expenses DECIMAL(5,2) DEFAULT 25.0 
    CHECK (vat_rate_expenses >= 0 AND vat_rate_expenses <= 100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- Primary key links to Supabase Auth users
- Referenced by all other user-scoped tables

**Indexes:**
- Primary key index (automatic)
- No additional indexes needed (single user lookups)

### 2. Projects (`projects`)

**Purpose:** Project management and time tracking categorization

```sql
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Basic Information
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  
  -- Project Management
  status TEXT CHECK (status IN ('planning', 'active', 'on-hold', 'completed', 'cancelled')) 
    DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  
  -- Financial
  budget DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, name)
);
```

**Key Relationships:**
- `user_id` → `auth.users(id)`
- `client_id` → `clients(id)` (optional)
- Referenced by `time_entries`, `invoice_items`

**Indexes:**
```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_client_id ON projects(client_id);
CREATE INDEX idx_projects_status ON projects(user_id, status);
```

### 3. Clients (`clients`)

**Purpose:** Client information for invoicing and project association

```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Contact Information
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  
  -- Company Information
  company TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Sweden',
  
  -- Financial Settings
  hourly_rate DECIMAL(10,2),
  currency TEXT DEFAULT 'SEK',
  payment_terms INTEGER DEFAULT 30,
  
  -- Status
  status TEXT CHECK (status IN ('active', 'inactive', 'archived')) DEFAULT 'active',
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, name)
);
```

**Key Relationships:**
- `user_id` → `auth.users(id)`
- Referenced by `projects`, `invoice_items`

**Indexes:**
```sql
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_status ON clients(user_id, status);
CREATE INDEX idx_clients_name ON clients(user_id, name);
```

### 4. Time Entries (`time_entries`)

**Purpose:** Daily time tracking with project association

```sql
CREATE TABLE time_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Time Information
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  
  -- Description
  comment TEXT,
  
  -- Billing Status
  is_billable BOOLEAN DEFAULT true,
  hourly_rate DECIMAL(10,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- `user_id` → `auth.users(id)`
- `project_id` → `projects(id)`

**Indexes:**
```sql
CREATE INDEX idx_time_entries_user_date ON time_entries(user_id, date);
CREATE INDEX idx_time_entries_project ON time_entries(project_id);
CREATE INDEX idx_time_entries_user_created ON time_entries(user_id, created_at);
```

### 5. Cash Flow Entries (`cash_flow_entries`)

**Purpose:** Financial transaction tracking for income and expenses

```sql
CREATE TABLE cash_flow_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Transaction Details
  type TEXT CHECK (type IN ('income', 'expense')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- VAT Information
  vat_amount DECIMAL(10,2) DEFAULT 0,
  amount_excluding_vat DECIMAL(10,2),
  vat_rate DECIMAL(5,2) DEFAULT 0,
  
  -- Payment Information
  payment_source TEXT,
  
  -- Recurring Transactions
  is_recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT CHECK (recurring_interval IN ('weekly', 'monthly', 'yearly')),
  next_due_date DATE,
  is_recurring_instance BOOLEAN DEFAULT false,
  
  -- Budget Integration
  is_budget_entry BOOLEAN DEFAULT false,
  
  -- Project Association
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- `user_id` → `auth.users(id)`
- `project_id` → `projects(id)` (optional)
- `client_id` → `clients(id)` (optional)

**Indexes:**
```sql
CREATE INDEX idx_cash_flow_entries_user_date ON cash_flow_entries(user_id, date);
CREATE INDEX idx_cash_flow_entries_type ON cash_flow_entries(user_id, type);
CREATE INDEX idx_cash_flow_entries_category ON cash_flow_entries(user_id, category);
CREATE INDEX idx_cash_flow_entries_recurring ON cash_flow_entries(user_id, is_recurring);
```

### 6. Invoice Items (`invoice_items`)

**Purpose:** Billable items for client invoicing

```sql
CREATE TABLE invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Invoice Details
  description TEXT NOT NULL,
  hours DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  fixed_amount DECIMAL(10,2),
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SEK',
  
  -- Dates
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  
  -- Status
  status TEXT CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')) 
    DEFAULT 'draft',
  
  -- Additional Information
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- `user_id` → `auth.users(id)`
- `client_id` → `clients(id)`
- `project_id` → `projects(id)`

**Indexes:**
```sql
CREATE INDEX idx_invoice_items_user_id ON invoice_items(user_id);
CREATE INDEX idx_invoice_items_client_id ON invoice_items(client_id);
CREATE INDEX idx_invoice_items_project_id ON invoice_items(project_id);
CREATE INDEX idx_invoice_items_status ON invoice_items(user_id, status);
CREATE INDEX idx_invoice_items_date ON invoice_items(invoice_date);
```

## Configuration Tables

### 7. Monthly Settings (`monthly_settings`)

**Purpose:** Month-specific overrides for billing and absence percentages

```sql
CREATE TABLE monthly_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Monthly Overrides
  billing_percentage DECIMAL(5,2) DEFAULT 94.0 
    CHECK (billing_percentage >= 0 AND billing_percentage <= 100),
  absence_percentage DECIMAL(5,2) DEFAULT 15.0 
    CHECK (absence_percentage >= 0 AND absence_percentage <= 100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(user_id, year, month)
);
```

**Key Relationships:**
- `user_id` → `auth.users(id)`

**Indexes:**
```sql
CREATE INDEX idx_monthly_settings_user_date ON monthly_settings(user_id, year, month);
```

### 8. Dashboard Widgets (`dashboard_widgets`)

**Purpose:** User-specific dashboard widget configurations

```sql
CREATE TABLE dashboard_widgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Widget Configuration
  widget_type TEXT NOT NULL,
  title TEXT NOT NULL,
  
  -- Layout
  position_x INTEGER NOT NULL DEFAULT 0,
  position_y INTEGER NOT NULL DEFAULT 0,
  width INTEGER NOT NULL DEFAULT 1 CHECK (width IN (1, 2, 3)),
  height INTEGER NOT NULL DEFAULT 1,
  
  -- Settings
  config JSONB DEFAULT '{}',
  is_visible BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- `user_id` → `auth.users(id)`

**Indexes:**
```sql
CREATE INDEX idx_dashboard_widgets_user_visible ON dashboard_widgets(user_id, is_visible);
CREATE INDEX idx_dashboard_widgets_position ON dashboard_widgets(user_id, position_y, position_x);
CREATE INDEX idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
```

### 9. Budgets (`budgets`)

**Purpose:** Budget categories and spending limits

```sql
CREATE TABLE budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Budget Definition
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_limit DECIMAL(10,2) NOT NULL CHECK (budget_limit > 0),
  
  -- Time Period
  period TEXT CHECK (period IN ('weekly', 'monthly', 'quarterly', 'yearly')) 
    DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  
  -- Status and Appearance
  is_active BOOLEAN DEFAULT true,
  color TEXT DEFAULT '#2563eb',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Relationships:**
- `user_id` → `auth.users(id)`

**Indexes:**
```sql
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_user_active ON budgets(user_id, is_active);
CREATE INDEX idx_budgets_category ON budgets(user_id, category);
```

## Extended Tables (Salary Management)

### 10. Salary Employees (`salary_employees`)

**Purpose:** Employee information for salary calculations

```sql
CREATE TABLE salary_employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Employee Information
  name TEXT NOT NULL,
  email TEXT,
  employee_id TEXT,
  
  -- Employment Details
  start_date DATE NOT NULL,
  end_date DATE,
  employment_type TEXT CHECK (employment_type IN ('full-time', 'part-time', 'contractor')) 
    DEFAULT 'full-time',
  
  -- Salary Information
  base_salary DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'SEK',
  
  -- Tax Information
  tax_table TEXT,
  employer_tax_rate DECIMAL(5,2) DEFAULT 31.42,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 11. Salary Payments (`salary_payments`)

**Purpose:** Track salary payments and tax calculations

```sql
CREATE TABLE salary_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES salary_employees(id) ON DELETE CASCADE,
  
  -- Payment Period
  payment_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Salary Calculation
  gross_salary DECIMAL(10,2) NOT NULL,
  tax_deduction DECIMAL(10,2) DEFAULT 0,
  net_salary DECIMAL(10,2) NOT NULL,
  
  -- Employer Costs
  employer_tax DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  
  -- Payment Information
  payment_method TEXT DEFAULT 'bank_transfer',
  payment_reference TEXT,
  is_paid BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Database Functions and Triggers

### Automatic Timestamp Updates

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at column
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (similar triggers for other tables)
```

### Automatic Calculations

```sql
-- Function to calculate invoice item total
CREATE OR REPLACE FUNCTION calculate_invoice_item_total()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.hours IS NOT NULL AND NEW.hourly_rate IS NOT NULL THEN
    NEW.total_amount = NEW.hours * NEW.hourly_rate;
  ELSIF NEW.fixed_amount IS NOT NULL THEN
    NEW.total_amount = NEW.fixed_amount;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_invoice_item_total_trigger
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW EXECUTE FUNCTION calculate_invoice_item_total();
```

## Data Relationships Diagram

```
auth.users (Supabase Auth)
    │
    ├─ user_profiles (1:1) ──── Settings & Company Info
    │
    ├─ clients (1:N) ─────────── Client Management
    │   │
    │   └─ projects (N:1) ───── Project Organization
    │       │
    │       ├─ time_entries (1:N) ── Time Tracking
    │       ├─ invoice_items (1:N) ─ Billing
    │       └─ cash_flow_entries (1:N) ─ Financial Tracking
    │
    ├─ monthly_settings (1:N) ── Monthly Overrides
    ├─ dashboard_widgets (1:N) ─ Dashboard Config
    ├─ budgets (1:N) ──────────── Budget Management
    │
    └─ salary_employees (1:N) ─── HR Management
        │
        └─ salary_payments (1:N) ─ Payroll Tracking
```

## Performance Considerations

### Query Optimization

**Common Query Patterns:**
```sql
-- Dashboard widgets for user
SELECT * FROM dashboard_widgets 
WHERE user_id = $1 AND is_visible = true 
ORDER BY position_y, position_x;

-- Monthly time entries
SELECT te.*, p.name as project_name, p.color 
FROM time_entries te
JOIN projects p ON te.project_id = p.id
WHERE te.user_id = $1 
  AND te.date >= $2 
  AND te.date <= $3
ORDER BY te.date DESC;

-- Cash flow by category
SELECT category, SUM(amount) as total
FROM cash_flow_entries
WHERE user_id = $1 
  AND date >= $2 
  AND date <= $3
  AND type = 'expense'
GROUP BY category
ORDER BY total DESC;
```

### Index Strategy

**High-frequency queries are optimized with indexes:**
- User-scoped queries: `idx_table_user_id`
- Date range queries: `idx_table_user_date`
- Status filtering: `idx_table_user_status`
- Category grouping: `idx_table_user_category`

### Database Maintenance

**Regular maintenance tasks:**
```sql
-- Analyze table statistics
ANALYZE user_profiles, projects, time_entries, cash_flow_entries;

-- Vacuum to reclaim space
VACUUM ANALYZE;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Data Migration and Backup

### Migration Scripts

Database evolution is managed through versioned SQL migration files:

- `create_tables_manual.sql` - Initial schema creation
- `add_vat_settings.sql` - VAT configuration additions
- `add_employer_tax_settings.sql` - Tax automation features
- `setup_complete_invoicing.sql` - Invoicing system setup

### Backup Strategy

**Supabase handles automatic backups with:**
- Point-in-time recovery
- Daily automated backups
- Manual backup triggers for major changes

### Data Export

```sql
-- Export user data for GDPR compliance
SELECT 
  'user_profiles' as table_name, 
  row_to_json(up.*) as data
FROM user_profiles up 
WHERE id = $1

UNION ALL

SELECT 
  'projects' as table_name,
  row_to_json(p.*) as data
FROM projects p 
WHERE user_id = $1;

-- ... (similar queries for all user tables)
```

## Security and Compliance

### Row Level Security

All tables implement comprehensive RLS policies:

```sql
-- Standard policy pattern
CREATE POLICY "policy_name" ON table_name
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "policy_name_insert" ON table_name
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "policy_name_update" ON table_name
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "policy_name_delete" ON table_name
  FOR DELETE USING (auth.uid() = user_id);
```

### Data Validation

**Database-level constraints ensure data integrity:**
- Check constraints for percentage values (0-100)
- Check constraints for status enums
- Unique constraints for business rules
- Foreign key constraints for referential integrity

### Audit Trail

**All tables include timestamps for audit purposes:**
- `created_at` - Record creation timestamp
- `updated_at` - Last modification timestamp (auto-updated via triggers)

---

This database schema supports a comprehensive consultant time tracking and business management system with strong security, performance optimization, and data integrity features.