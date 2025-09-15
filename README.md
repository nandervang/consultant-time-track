# 🚀 Consultant Time Track & Dashboard Platform

A comprehensive consultant dashboard platform for time tracking, budget management, cash flow analysis, client management, and business analytics. Built with React, TypeScript, and Supabase.

## 📋 Table of Contents

- [System Overview](#-system-overview)
- [Technology Stack](#-technology-stack)
- [Database Architecture](#-database-architecture)
- [Core Features](#-core-features)
- [Hooks & State Management](#-hooks--state-management)
- [Components Architecture](#-components-architecture)
- [Calculations & Logic](#-calculations--logic)
- [Common Components](#-common-components)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [API References](#-api-references)

## 🏗️ System Overview

This platform serves as a complete business management solution for consultants, offering:

- **Dashboard**: Customizable widget-based dashboard with drag-and-drop functionality
- **Time Tracking**: Comprehensive time logging with project association and analytics
- **Budget Management**: Budget planning, tracking, and automated cash flow integration
- **Cash Flow Analysis**: Income/expense tracking with recurring entries and projections
- **Project Management**: Project lifecycle management with client association
- **Client Management**: Complete CRM functionality for consultant relationships
- **CV Management**: Dynamic CV generation with AI-powered content optimization
- **Invoicing**: Invoice generation, tracking, and payment management
- **Analytics**: Business intelligence with charts, reports, and insights

## 🛠️ Technology Stack

### Frontend Framework
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Full type safety throughout the application
- **Vite** - Lightning-fast build tool and dev server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible component library built on Radix UI
- **Lucide React** - Beautiful, customizable SVG icons
- **Framer Motion** - Smooth animations and transitions

### Backend & Database
- **Supabase** - PostgreSQL database with real-time subscriptions
- **Row Level Security (RLS)** - Secure multi-tenant data access
- **Real-time subscriptions** - Live data updates across clients

### Charts & Visualization
- **Recharts** - Composable charting library for React
- **Custom chart components** - Tailored visualizations for business metrics

### Additional Libraries
- **React Router** - Client-side routing
- **React Beautiful DnD** - Drag and drop functionality
- **date-fns** - Modern date utility library
- **crypto-js** - Encryption utilities for sensitive data
- **TipTap** - Rich text editor for CV and document management

## 🗄️ Database Architecture

### Core Tables

#### User Management

```sql
-- User profiles with business settings
user_profiles (
  id: string (FK to auth.users)
  company_name: string?
  company_motto: string?
  avatar_url: string?
  timezone: string?
  currency: string? (default: 'SEK')
  hourly_rate: number?
  debit_rate_monthly: number?
  absence_percentage: number?
  work_hours_per_day: number? (default: 8)
  work_days_per_week: number? (default: 5)
)
```

#### Project & Client Management

```sql
-- Projects with enhanced metadata
projects (
  id: string (PK)
  name: string
  color: string (hex color for UI)
  user_id: string (FK)
  client_id: string? (FK to clients)
  description: string?
  status: enum ('planning', 'active', 'on-hold', 'completed', 'cancelled')
  start_date: date?
  end_date: date?
  budget: number?
  hourly_rate: number? (overrides client rate)
)

-- Client information and rates
clients (
  id: string (PK)
  user_id: string (FK)
  name: string
  email: string?
  phone: string?
  company: string?
  address: string?
  hourly_rate: number?
  currency: string?
  status: enum ('active', 'inactive', 'archived')
  notes: string?
)
```

#### Time Tracking

```sql
-- Time entries with project association
time_entries (
  id: string (PK)
  user_id: string (FK)
  project_id: string (FK)
  date: date
  hours: number (decimal precision)
  comment: string?
)
```

#### Financial Management

```sql
-- Cash flow entries (manual + auto-generated)
cash_flow_entries (
  id: string (PK)
  user_id: string (FK)
  type: enum ('income', 'expense')
  amount: number (decimal)
  description: string
  category: string
  date: date
  is_recurring: boolean
  recurring_interval: enum ('weekly', 'monthly', 'yearly')?
  next_due_date: date?
  is_budget_entry: boolean? -- Marks entries generated from budgets
  is_recurring_instance: boolean? -- Marks auto-generated recurring entries
  project_id: string? (FK) -- For project-related transactions
  client_id: string? (FK) -- For client-related transactions
  payment_source: string? -- Payment method tracking
)

-- Budget definitions and limits
budgets (
  id: string (PK)
  user_id: string (FK)
  name: string
  category: string (matches cash_flow_entries.category)
  budget_limit: number
  period: enum ('weekly', 'monthly', 'quarterly', 'yearly')
  start_date: date
  end_date: date?
  is_active: boolean
  color: string? -- UI customization
)
```

## 🎯 Core Features

### 1. **Dashboard System**

- **Widget-Based Layout**: Customizable masonry grid with 10+ widget types
- **Drag & Drop**: Rearrange widgets with React Beautiful DnD
- **Responsive Design**: Adaptive layouts for mobile, tablet, and desktop
- **Real-time Updates**: Live data synchronization via Supabase subscriptions

**Key Widgets:**

- Monthly Expenses Card
- Time Logged Card  
- Revenue Chart Card
- Cash Flow Card
- Projects Overview Card
- Budget Status Card
- Company Motto Card
- Quick Stats Card
- Recent Activities Card

### 2. **Time Tracking Module**

- **Project Association**: Link time entries to specific projects and clients
- **Daily Logging**: Quick time entry with project selection
- **Bulk Operations**: Edit multiple entries simultaneously
- **Time Analytics**: Charts showing productivity patterns and project distribution
- **Export Capabilities**: CSV export for external reporting

### 3. **Budget Management**

- **Multi-Period Budgets**: Weekly, monthly, quarterly, and yearly budget cycles
- **Category-Based Tracking**: Organize expenses by business categories
- **Automated Cash Flow Integration**: Budget entries automatically create cash flow records
- **Budget Alerts**: Visual indicators when approaching or exceeding limits
- **Historical Analysis**: Track budget performance over time

### 4. **Cash Flow Analysis**

- **Multi-Source Entries**: Manual entries, budget-generated entries, and invoice projections
- **Recurring Transactions**: Automated handling of recurring income/expenses
- **Payment Source Tracking**: Track payment methods and sources
- **Project/Client Attribution**: Link transactions to specific business relationships
- **Cash Flow Projections**: Future cash flow predictions based on recurring items and invoices

## 🔧 Hooks & State Management

The application uses a comprehensive set of custom hooks for state management and business logic:

### Authentication & User Management

- **`useAuth`**: Authentication state, login/logout, user session management
- **`useUserProfile`**: User profile data, company settings, and preferences

### Financial Management

- **`useCashFlow`**: 
  - Manages cash flow entries from multiple sources (manual, budget, invoices)
  - Handles CRUD operations with proper source attribution
  - Implements business rules (budget entries are read-only from cash flow page)
  - Provides entry classification and filtering

- **`useBudgets`**:
  - Budget creation, modification, and deletion
  - Period-based budget calculations
  - Integration with cash flow entry generation
  - Budget status and utilization tracking

- **`useBudgetLogic`**:
  - Core budget calculation engine
  - Spending aggregation by category and period
  - Budget vs. actual variance analysis
  - Automated budget entry creation for cash flow

### Project & Client Management

- **`useProjects`**:
  - Project CRUD operations
  - Client-project relationships
  - Project status management and lifecycle tracking
  - Default project creation for new users

- **`useClients`**:
  - Client information management
  - Rate and currency handling
  - Client status tracking
  - Project association queries

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account and project
- Environment variables configured

### Installation

1. **Clone the repository**

```bash
git clone [repository-url]
cd consultant-time-track
```

2. **Install dependencies**

```bash
npm install
```

3. **Environment Setup**

```bash
# Copy environment template
cp .env.example .env.local

# Configure Supabase variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database Setup**

```bash
# Run database migrations (SQL files in root directory)
# Execute these in your Supabase SQL editor:
# - create_tables_manual.sql
# - setup_rls_policies.sql
# - create_views.sql
```

5. **Start Development Server**

```bash
npm run dev
```

---

**Built with ❤️ for the modern consultant**

*Last updated: September 2025*
