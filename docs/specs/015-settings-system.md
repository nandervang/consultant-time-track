# Settings System Specification

**Spec ID:** 015-A  
**Status:** Fully Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

The Settings System provides comprehensive configuration management for consultant businesses, allowing users to customize their workspace, define business parameters, and configure system behavior. The system is organized into logical categories with both global defaults and month-specific overrides for precise business planning.

## Implementation Status

### ✅ Fully Implemented Features

#### Core Settings Architecture
- **Multi-Tab Interface** - Organized settings into logical categories
- **Real-time Validation** - Input validation with immediate feedback
- **Supabase Integration** - Persistent settings with user isolation
- **Monthly Overrides** - Month-specific settings for seasonal variations
- **Fallback Mechanism** - Graceful degradation to system defaults

#### Settings Categories

**1. Profile Settings** ✅
- Company information and branding
- Personal preferences and localization
- Contact information management

**2. Time Tracking Settings** ✅
- Work schedule configuration
- Billing and absence percentages
- Monthly-specific adjustments

**3. Financial Settings** ✅
- Currency and tax configurations
- Automated tax generation
- VAT rate management

**4. Integration Settings** ✅
- Fortnox accounting integration
- External service configurations
- API credentials management

**5. System Settings** ✅
- Application preferences
- Display and notification settings
- Data management options

## Technical Architecture

### Data Models

```typescript
interface UserSettings {
  // Identity & Branding
  id: string;
  company_name: string;
  company_motto: string;
  
  // Financial Configuration
  hourly_rate: number;
  currency: string;
  
  // Localization
  timezone: string;
  
  // Time Tracking Defaults
  debit_rate_monthly: number;      // Default billing percentage
  absence_percentage: number;       // Default absence percentage
  work_hours_per_day: number;      // Standard working hours
  work_days_per_week: number;      // Standard working days
  
  // Tax Automation Settings
  auto_generate_employer_tax?: boolean;
  employer_tax_payment_date?: number;  // Day of month (1-31)
  auto_generate_yearly_vat?: boolean;
  vat_rate_income?: number;           // VAT rate for income (25%)
  vat_rate_expenses?: number;         // VAT rate for expenses (25%)
}

interface MonthlySettings {
  id?: string;
  user_id: string;
  year: number;
  month: number;
  billing_percentage: number;      // Month-specific override
  absence_percentage: number;      // Month-specific override
  created_at?: string;
  updated_at?: string;
}
```

### Database Schema

```sql
-- User profiles table (global settings)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Company & Branding
  company_name TEXT,
  company_motto TEXT DEFAULT 'Building the future, one project at a time.',
  avatar_url TEXT,
  
  -- Localization
  timezone TEXT DEFAULT 'Europe/Stockholm',
  currency TEXT DEFAULT 'SEK',
  
  -- Financial Defaults
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
  
  -- Tax Automation
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

-- Monthly settings table (month-specific overrides)
CREATE TABLE monthly_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Time Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  
  -- Month-specific Overrides
  billing_percentage DECIMAL(5,2) DEFAULT 94.0 
    CHECK (billing_percentage >= 0 AND billing_percentage <= 100),
  absence_percentage DECIMAL(5,2) DEFAULT 15.0 
    CHECK (absence_percentage >= 0 AND absence_percentage <= 100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one row per user per month
  UNIQUE(user_id, year, month)
);

-- Indexes for performance
CREATE INDEX idx_monthly_settings_user_date 
  ON monthly_settings(user_id, year, month);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access own profile" 
  ON user_profiles FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can access own monthly settings" 
  ON monthly_settings FOR ALL USING (auth.uid() = user_id);
```

## Settings Categories Deep Dive

### 1. Profile Settings

**Purpose:** Company branding and personal information  
**Storage:** `user_profiles` table  
**Access Pattern:** Single record per user

#### Fields and Validation

```typescript
// Company Information
company_name: string;           // Free text, required for invoicing
company_motto: string;          // Displayed on dashboard, optional

// Localization
timezone: string;               // Timezone identifier (Europe/Stockholm)
currency: string;               // ISO currency code (SEK, EUR, USD)

// Business Configuration
hourly_rate: number;           // Base hourly rate for calculations
```

#### UI Components
- **Company Info Card** - Name and motto editing with live preview
- **Localization Card** - Timezone and currency selection
- **Rate Configuration** - Hourly rate with currency formatting

#### Integration Points
- **Dashboard** - Company motto displayed on Company Motto Card
- **Invoicing** - Company name used in invoice generation
- **Time Tracking** - Hourly rate used for revenue calculations

### 2. Time Tracking Settings

**Purpose:** Work schedule and billing configuration  
**Storage:** `user_profiles` (defaults) + `monthly_settings` (overrides)  
**Access Pattern:** Global defaults with monthly specificity

#### Fields and Validation

```typescript
// Work Schedule (Global)
work_hours_per_day: number;     // 1-24 hours, default 8
work_days_per_week: number;     // 1-7 days, default 5

// Billing Configuration (Global Defaults)
debit_rate_monthly: number;     // 0-100%, default 94% (billing efficiency)
absence_percentage: number;     // 0-100%, default 15% (vacation/sick time)

// Monthly Overrides
monthly_settings: {
  billing_percentage: number;   // Month-specific billing efficiency
  absence_percentage: number;   // Month-specific absence rate
}
```

#### Calculation Logic

```typescript
// Monthly work capacity calculation
const workDaysPerMonth = getWorkDaysInMonth(year, month, work_days_per_week);
const potentialHours = workDaysPerMonth * work_hours_per_day;

// Apply absence reduction
const effectiveHours = potentialHours * (1 - absence_percentage / 100);

// Apply billing efficiency
const billableHours = effectiveHours * (billing_percentage / 100);

// Revenue projection
const projectedRevenue = billableHours * hourly_rate;
```

#### UI Components
- **Work Schedule Card** - Hours per day and days per week
- **Monthly Settings Card** - Month-specific overrides with navigation
- **Capacity Calculator** - Real-time calculation display

### 3. Financial Settings

**Purpose:** Tax automation and financial calculations  
**Storage:** `user_profiles` table  
**Access Pattern:** Global configuration affecting all financial operations

#### Fields and Validation

```typescript
// VAT Configuration
vat_rate_income: number;        // 0-100%, default 25% (Swedish standard)
vat_rate_expenses: number;      // 0-100%, default 25% (Swedish standard)
auto_generate_yearly_vat: boolean;  // Automatic VAT entry generation

// Employer Tax Configuration
auto_generate_employer_tax: boolean;     // Automatic tax calculation
employer_tax_payment_date: number;       // 1-31, day of month for payments
```

#### Tax Automation Features

**Employer Tax Generation:**
- Automatic calculation based on salary entries
- Configurable payment date (default: 12th of month)
- Integration with cash flow projections

**VAT Management:**
- Yearly VAT summary generation
- Separate rates for income and expenses
- Integration with expense tracking

#### UI Components
- **Tax Settings Card** - VAT rates and automation toggles
- **Employer Tax Card** - Payment date and automation settings
- **Tax Summary Display** - Current year calculations

### 4. Integration Settings

**Purpose:** External service configurations  
**Storage:** Encrypted local storage + user preferences  
**Access Pattern:** Service-specific authentication flows

#### Supported Integrations

**Fortnox Accounting:**
- Client ID and secret configuration
- OAuth flow management
- Automatic invoice sync

**Future Integrations:**
- Slack notifications
- Google Calendar sync
- Banking API connections

#### UI Components
- **Fortnox Config Dialog** - Credential management
- **Integration Status Cards** - Connection health monitoring
- **Sync Settings** - Automatic sync preferences

### 5. System Settings

**Purpose:** Application behavior and preferences  
**Storage:** Local storage + user preferences  
**Access Pattern:** Client-side configuration

#### Available Settings
- Dark/light mode preferences
- Notification settings
- Data export preferences
- Debug mode toggles

## Settings Hierarchy and Precedence

### 1. Monthly Settings Override System

```typescript
// Settings resolution logic
const getEffectiveSettings = (year: number, month: number) => {
  // Try monthly-specific settings first
  const monthlySettings = getMonthSettings(year, month);
  if (monthlySettings) {
    return {
      billing_percentage: monthlySettings.billing_percentage,
      absence_percentage: monthlySettings.absence_percentage
    };
  }
  
  // Fall back to user profile defaults
  const userProfile = getUserProfile();
  return {
    billing_percentage: userProfile.debit_rate_monthly || 94,
    absence_percentage: userProfile.absence_percentage || 15
  };
};
```

### 2. Validation Hierarchy

```typescript
// Multi-level validation
const validateSettings = (settings: UserSettings) => {
  // Database constraints (enforced by schema)
  if (settings.debit_rate_monthly < 0 || settings.debit_rate_monthly > 100) {
    throw new Error('Billing percentage must be between 0-100%');
  }
  
  // Business logic validation
  if (settings.work_hours_per_day * settings.work_days_per_week > 60) {
    throw new Warning('Work schedule exceeds recommended limits');
  }
  
  // Integration validation
  if (settings.auto_generate_yearly_vat && !settings.vat_rate_income) {
    throw new Error('VAT rate required for automatic VAT generation');
  }
};
```

## Component Architecture

### Settings Page Structure

```typescript
// Main settings page with tab navigation
const SettingsPage = () => {
  return (
    <div className="p-6 space-y-6">
      <SettingsHeader />
      
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="tracking">Tidrapportering</TabsTrigger>
          <TabsTrigger value="financial">Ekonomi</TabsTrigger>
          <TabsTrigger value="integrations">Integrationer</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <ProfileSettingsCard />
        </TabsContent>
        
        <TabsContent value="tracking">
          <WorkScheduleCard />
          <SimpleMonthlySettingsCard />
        </TabsContent>
        
        <TabsContent value="financial">
          <TaxSettingsCard />
          <VATConfigurationCard />
        </TabsContent>
        
        <TabsContent value="integrations">
          <FortnoxIntegrationCard />
          <ExternalServicesCard />
        </TabsContent>
        
        <TabsContent value="system">
          <SystemPreferencesCard />
          <DataManagementCard />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### Monthly Settings Component

```typescript
// Specialized component for month-specific overrides
const SimpleMonthlySettingsCard = () => {
  const [currentDate, setCurrentDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  });
  
  const [settings, setSettings] = useState({
    billing_percentage: 94,
    absence_percentage: 15
  });

  // Load settings hierarchy: monthly → profile → defaults
  const loadMonthlySettings = async () => {
    // Try monthly-specific first
    const monthlyData = await getMonthlySettings(
      currentDate.year, 
      currentDate.month
    );
    
    if (monthlyData) {
      setSettings(monthlyData);
    } else {
      // Fall back to profile defaults
      const profileData = await getUserProfile();
      setSettings({
        billing_percentage: profileData.debit_rate_monthly || 94,
        absence_percentage: profileData.absence_percentage || 15
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Månadsspecifika inställningar</CardTitle>
        <CardDescription>
          Konfigurera debiteringsgrad och frånvaro per månad
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <MonthNavigation 
          currentDate={currentDate}
          onNavigate={setCurrentDate}
        />
        
        <SettingsForm 
          settings={settings}
          onChange={setSettings}
          onSave={handleSave}
        />
        
        <CapacityCalculator settings={settings} />
      </CardContent>
    </Card>
  );
};
```

### Settings Hooks

```typescript
// Custom hook for settings management
const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>();
  const [loading, setLoading] = useState(true);
  
  const fetchSettings = async () => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
      
    if (data) {
      setSettings(data);
    }
  };
  
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        ...newSettings,
        updated_at: new Date().toISOString()
      });
      
    if (!error) {
      setSettings(prev => ({ ...prev, ...newSettings }));
    }
  };
  
  return {
    settings,
    loading,
    updateSettings,
    refetchSettings: fetchSettings
  };
};

// Hook for monthly settings
const useMonthlySettings = () => {
  const [monthlySettings, setMonthlySettings] = useState<MonthlySettings[]>([]);
  
  const getMonthSettings = (year: number, month: number) => {
    return monthlySettings.find(s => s.year === year && s.month === month);
  };
  
  const upsertMonthSettings = async (settings: MonthlySettings) => {
    const { data, error } = await supabase
      .from('monthly_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,year,month'
      });
      
    if (!error) {
      // Update local state
      setMonthlySettings(prev => {
        const filtered = prev.filter(s => 
          !(s.year === settings.year && s.month === settings.month)
        );
        return [...filtered, data].sort((a, b) => a.month - b.month);
      });
    }
  };
  
  return {
    monthlySettings,
    getMonthSettings,
    upsertMonthSettings
  };
};
```

## Integration with Other Systems

### Dashboard Widgets
- **Time Logged Card** uses monthly settings for capacity calculations
- **Company Motto Card** displays profile settings
- **Quick Stats Card** uses work schedule for projections

### Financial Systems
- **Cash Flow** uses tax settings for automated entries
- **Budgeting** uses work schedule for capacity planning
- **Invoicing** uses profile information and rates

### Time Tracking
- **Time Entry** validation uses work schedule limits
- **Monthly Reports** use billing percentages for calculations
- **Capacity Planning** uses absence percentages

## Performance Considerations

### Caching Strategy
```typescript
// Settings caching for performance
const SettingsCache = {
  userProfile: null,
  monthlySettings: new Map(),
  lastFetch: null,
  
  async getUserProfile(userId: string) {
    if (!this.userProfile || this.isStale()) {
      this.userProfile = await fetchUserProfile(userId);
      this.lastFetch = Date.now();
    }
    return this.userProfile;
  },
  
  async getMonthlySettings(userId: string, year: number, month: number) {
    const key = `${year}-${month}`;
    if (!this.monthlySettings.has(key)) {
      const settings = await fetchMonthlySettings(userId, year, month);
      this.monthlySettings.set(key, settings);
    }
    return this.monthlySettings.get(key);
  },
  
  isStale() {
    return Date.now() - this.lastFetch > 5 * 60 * 1000; // 5 minutes
  }
};
```

### Optimistic Updates
```typescript
// Immediate UI updates with background sync
const updateSettingsOptimistic = async (newSettings: Partial<UserSettings>) => {
  // Update UI immediately
  setSettings(prev => ({ ...prev, ...newSettings }));
  
  try {
    // Sync to database
    await updateSettings(newSettings);
  } catch (error) {
    // Revert on failure
    setSettings(prev => ({ ...prev, ...originalSettings }));
    showError('Settings update failed');
  }
};
```

## Security and Validation

### Input Validation
- **Client-side** - Immediate feedback with TypeScript types
- **Database-side** - Check constraints for data integrity
- **Business Logic** - Custom validation rules

### Data Protection
- **Row Level Security** - Users can only access own settings
- **Encryption** - Sensitive integration credentials encrypted
- **Audit Trail** - Updated timestamps for change tracking

## Accessibility and Usability

### Keyboard Navigation
- Tab-based navigation between settings categories
- Form controls accessible via keyboard
- Screen reader compatible labels

### Mobile Optimization
- Responsive design for mobile settings management
- Touch-friendly controls for mobile users
- Simplified navigation on small screens

### User Experience Patterns
- **Progressive Disclosure** - Advanced settings hidden by default
- **Contextual Help** - Tooltips and descriptions for complex settings
- **Validation Feedback** - Real-time validation with helpful error messages

---

This specification provides a comprehensive overview of the Settings System, covering both the technical implementation and user experience considerations. The hierarchical settings approach allows for both global defaults and monthly specificity, making it suitable for consultant businesses with seasonal variations.