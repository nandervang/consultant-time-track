# Consultant Time Tracker

A comprehensive consultant platform for time tracking, project management, and business analytics.

## Features

### 📊 Dashboard
- Real-time widgets with actual data
- Drag-and-drop widget management
- Customizable layout with grid system
- Remove/resize widgets functionality

### ⏰ Time Tracking
- Daily time logging with automatic updates
- Overview and quarterly views
- Date range filters
- Monthly and weekly summaries
- Table view with detailed entries

### 👥 Client & Project Management
- Full CRUD operations for clients and projects
- Swedish localization (sv-SE)
- Project-client relationships
- Budget and status tracking

### ⚙️ Settings
- **Time Tracking Settings**: Configure debit rate per month, absence percentage, work hours per day, and work days per week
- **Profile Settings**: Company information and personal preferences
- **Billing Settings**: Hourly rates and currency settings
- **General Preferences**: Timezone and interface settings

### 💰 Financial Management
- Cash flow tracking
- Budget management
- Revenue analytics
- Swedish currency formatting (SEK)

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Framework**: Tailwind CSS with custom components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Drag & Drop**: react-beautiful-dnd
- **Routing**: React Router DOM

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure Supabase connection in `.env`
4. Run the development server: `npm run dev`
5. Open [http://localhost:5173](http://localhost:5173)

## Database Setup

Apply the latest migrations to add time tracking settings:

```sql
-- See update_user_profiles.sql for latest schema changes
```

## Key Features

### Settings Configuration
The Settings page provides comprehensive configuration options:

- **Billing Percentage**: Set your expected billing rate percentage (e.g., 94% of work hours are billable)
- **Absence Percentage**: Configure expected absence for realistic planning
- **Work Schedule**: Define work hours per day and work days per week
- **Real-time Calculations**: See immediate impact of changes on monthly/yearly projections
