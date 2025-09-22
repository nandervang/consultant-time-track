# Base Specification - Consultant Time Tracking System

**Spec ID:** 001  
**Status:** Implemented  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

A comprehensive time tracking and business management system for consultants, built with React/TypeScript and modern web standards. The system provides intelligent tax automation for Swedish business regulations, advanced time tracking, client/project management, and financial oversight.

## Technology Stack

### Core Framework
- **React 18** - Component-based UI framework
- **TypeScript** - Type-safe development
- **Vite** - Build tool and development server
- **React Router** - Client-side routing

### UI Framework
- **ShadCN/UI** - Component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Dark/Light Mode** - Full theme support

### Backend & Database
- **Supabase** - PostgreSQL database with real-time features
- **Row Level Security (RLS)** - Data protection
- **Real-time subscriptions** - Live data updates

### State Management
- **React Hooks** - Local component state
- **Custom Hooks** - Shared business logic
- **Context API** - Global state (Modals, Theme)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # ShadCN components
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   └── [feature]/      # Feature-specific components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── contexts/           # React contexts for global state
├── lib/                # Utilities and configurations
├── types/              # TypeScript type definitions
└── styles/             # Global styles and Tailwind config
```

## Core Features

### 1. Smart Search & Navigation
- **Command Palette Style** - ⌘K keyboard shortcut
- **Smart Abbreviations** - Single letter navigation (d=dashboard, inv=invoicing)
- **Quick Actions** - Create new items with shortcuts (+i=invoice, +c=client)
- **Intelligent Filtering** - Context-aware suggestions

### 2. Tax Automation (Swedish Regulations)
- **Employer Tax** - Automatic 31.42% calculation
- **VAT/MOMS** - Yearly 25% calculation with January payment
- **Automatic Generation** - Triggered by settings changes
- **Fresh Data Fetching** - Race condition prevention

### 3. Time Tracking
- **Project-based Tracking** - Organize time by client/project
- **Manual Entry** - Flexible time logging
- **Real-time Updates** - Instant synchronization

### 4. Financial Management
- **Budget Tracking** - Income vs expenses
- **Cash Flow** - Financial forecasting
- **Invoicing** - Client billing system
- **Expense Management** - Business cost tracking

### 5. Client & Project Management
- **Client Profiles** - Contact and billing information
- **Project Organization** - Hierarchical project structure
- **Relationship Management** - Client-project associations

## Design Principles

### 1. Consistency
- **Component Reuse** - Single source of truth for UI patterns
- **Design Tokens** - Consistent spacing, colors, typography
- **Interaction Patterns** - Standardized user workflows

### 2. Accessibility
- **Keyboard Navigation** - Full keyboard support
- **Screen Reader** - Semantic HTML and ARIA labels
- **Color Contrast** - WCAG compliance
- **Focus Management** - Clear focus indicators

### 3. Performance
- **Code Splitting** - Route-based code splitting
- **Optimistic Updates** - Immediate UI feedback
- **Efficient Queries** - Minimized database calls
- **Lazy Loading** - Progressive content loading

### 4. Developer Experience
- **Type Safety** - Full TypeScript coverage
- **Component Documentation** - Clear props and usage
- **Consistent Patterns** - Predictable code structure
- **Error Boundaries** - Graceful error handling

## User Experience Patterns

### Navigation
- **Smart Search** - Primary navigation method
- **Sidebar** - Secondary navigation with visual hierarchy
- **Breadcrumbs** - Context awareness (where applicable)

### Data Entry
- **Form Validation** - Real-time feedback
- **Auto-save** - Prevent data loss
- **Progressive Disclosure** - Show complexity gradually

### Feedback
- **Toast Notifications** - Action confirmations
- **Loading States** - Operation progress
- **Error Messages** - Clear, actionable error text

## Quality Standards

### Code Quality
- **ESLint** - Code linting and style enforcement
- **TypeScript Strict Mode** - Maximum type safety
- **Component Testing** - Unit test coverage
- **Integration Testing** - Feature workflow testing

### Security
- **Row Level Security** - Database-level access control
- **Input Validation** - Client and server-side validation
- **Authentication** - Secure user management
- **Data Encryption** - Sensitive data protection

### Monitoring
- **Error Tracking** - Production error monitoring
- **Performance Metrics** - Application performance tracking
- **User Analytics** - Usage pattern analysis

## Browser Support

- **Modern Browsers** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile Responsive** - Touch-friendly interface
- **Progressive Web App** - Offline capability (future enhancement)

## Deployment

- **Production Environment** - Optimized build with Vite
- **Environment Variables** - Configuration management
- **Database Migrations** - Version-controlled schema changes
- **CI/CD Pipeline** - Automated testing and deployment

## Future Considerations

- **API Integration** - External service connections
- **Mobile App** - React Native companion
- **Offline Support** - Progressive Web App features
- **Advanced Reporting** - Business intelligence features
- **Multi-language** - Internationalization support

---

This specification serves as the foundation for all development decisions and feature implementations. All changes should align with these principles and patterns to maintain system coherence and quality.