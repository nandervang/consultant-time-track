# Deployment & Infrastructure Guide

**Spec ID:** 018-A  
**Status:** Comprehensive  
**Version:** 1.0  
**Last Updated:** September 22, 2025

## Overview

This document provides comprehensive deployment and infrastructure guidelines for the Consultant Time Tracking application. The system is designed for modern cloud deployment with Supabase as the backend service, supporting development, staging, and production environments.

## Infrastructure Architecture

### System Architecture Overview

```text
Production Infrastructure
├── Frontend (Static Hosting)
│   ├── Vercel/Netlify/CloudFlare Pages
│   ├── React + TypeScript Build
│   ├── Static Assets & Bundles
│   └── CDN Distribution
│
├── Backend Services
│   ├── Supabase (Primary Backend)
│   │   ├── PostgreSQL Database
│   │   ├── Authentication Service
│   │   ├── Real-time Subscriptions
│   │   └── Row Level Security
│   │
│   ├── External API Integrations
│   │   ├── Fortnox Accounting API
│   │   └── MongoDB Monitoring Service
│   │
│   └── Edge Functions (Optional)
│       ├── Scheduled Tasks
│       ├── Webhook Handlers
│       └── Data Processing
│
└── Monitoring & Observability
    ├── Application Monitoring
    ├── Database Performance
    ├── Security Event Tracking
    └── Business Metrics
```

## Environment Configuration

### Environment Types

**Development Environment:**

- Local development server (Vite)
- Local Supabase instance (optional)
- Hot module replacement
- Debug logging enabled
- Development database

**Staging Environment:**

- Production-like configuration
- Staging Supabase project
- Production build with source maps
- Integration testing
- User acceptance testing

**Production Environment:**

- Optimized production build
- Production Supabase project
- CDN distribution
- Performance monitoring
- Error tracking

### Environment Variables

**Required Environment Variables:**

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Environment Identification
VITE_ENVIRONMENT=production
VITE_APP_VERSION=1.0.0

# Optional External API Configuration
VITE_FORTNOX_BASE_URL=https://api.fortnox.se/3
VITE_MONGODB_API_ENDPOINT=https://your-mongodb-api.com/api

# Monitoring and Analytics (Optional)
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

**Environment-Specific Configuration:**

```typescript
// src/config/environment.ts
interface EnvironmentConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    fortnoxBaseUrl?: string;
    mongodbEndpoint?: string;
  };
  monitoring: {
    sentryDsn?: string;
    googleAnalyticsId?: string;
  };
  features: {
    enableDebugMode: boolean;
    enableBetaFeatures: boolean;
    enableAnalytics: boolean;
  };
  performance: {
    enableSourceMaps: boolean;
    enableLazyLoading: boolean;
    enableCaching: boolean;
  };
}

const developmentConfig: EnvironmentConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'dev-anon-key',
  },
  api: {
    fortnoxBaseUrl: import.meta.env.VITE_FORTNOX_BASE_URL,
    mongodbEndpoint: import.meta.env.VITE_MONGODB_API_ENDPOINT,
  },
  monitoring: {
    sentryDsn: undefined, // Disabled in development
    googleAnalyticsId: undefined, // Disabled in development
  },
  features: {
    enableDebugMode: true,
    enableBetaFeatures: true,
    enableAnalytics: false,
  },
  performance: {
    enableSourceMaps: true,
    enableLazyLoading: false, // Disabled for faster development
    enableCaching: false, // Disabled for fresh data
  },
};

const stagingConfig: EnvironmentConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  api: {
    fortnoxBaseUrl: import.meta.env.VITE_FORTNOX_BASE_URL,
    mongodbEndpoint: import.meta.env.VITE_MONGODB_API_ENDPOINT,
  },
  monitoring: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    googleAnalyticsId: undefined, // Optional in staging
  },
  features: {
    enableDebugMode: true,
    enableBetaFeatures: true,
    enableAnalytics: false,
  },
  performance: {
    enableSourceMaps: true,
    enableLazyLoading: true,
    enableCaching: true,
  },
};

const productionConfig: EnvironmentConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  api: {
    fortnoxBaseUrl: import.meta.env.VITE_FORTNOX_BASE_URL,
    mongodbEndpoint: import.meta.env.VITE_MONGODB_API_ENDPOINT,
  },
  monitoring: {
    sentryDsn: import.meta.env.VITE_SENTRY_DSN,
    googleAnalyticsId: import.meta.env.VITE_GOOGLE_ANALYTICS_ID,
  },
  features: {
    enableDebugMode: false,
    enableBetaFeatures: false,
    enableAnalytics: true,
  },
  performance: {
    enableSourceMaps: false,
    enableLazyLoading: true,
    enableCaching: true,
  },
};

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';
  
  switch (environment) {
    case 'production':
      return productionConfig;
    case 'staging':
      return stagingConfig;
    case 'development':
    default:
      return developmentConfig;
  }
};

// Validate configuration at startup
export const validateEnvironmentConfig = (config: EnvironmentConfig): void => {
  if (!config.supabase.url) {
    throw new Error('Supabase URL is required');
  }
  
  if (!config.supabase.anonKey) {
    throw new Error('Supabase anonymous key is required');
  }
  
  try {
    new URL(config.supabase.url);
  } catch {
    throw new Error('Invalid Supabase URL format');
  }
  
  // Production-specific validations
  if (import.meta.env.VITE_ENVIRONMENT === 'production') {
    if (config.supabase.url.includes('localhost')) {
      throw new Error('Production cannot use localhost URLs');
    }
    
    if (!config.monitoring.sentryDsn) {
      console.warn('Production deployment without error monitoring');
    }
  }
};
```

## Database Setup and Migrations

### Initial Database Setup

**Database Schema Creation:**

```sql
-- Run these scripts in order for initial setup

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Create enums for type safety
CREATE TYPE user_role AS ENUM ('user', 'admin', 'manager');
CREATE TYPE project_status AS ENUM ('active', 'inactive', 'completed', 'archived');
CREATE TYPE entry_type AS ENUM ('work', 'break', 'meeting', 'travel');
CREATE TYPE cash_flow_type AS ENUM ('income', 'expense');

-- 3. Create core tables (in dependency order)
\i create_user_profiles_table.sql
\i create_clients_table.sql
\i create_projects_table.sql
\i create_time_entries_table.sql
\i create_cash_flow_entries_table.sql
\i create_invoice_items_table.sql
\i create_client_documents_table.sql

-- 4. Set up Row Level Security
\i setup_rls_policies.sql

-- 5. Create indexes for performance
\i create_indexes.sql

-- 6. Set up audit logging
\i setup_audit_triggers.sql
```

**Migration Script Structure:**

```bash
# Database migration files structure
migrations/
├── 001_initial_schema.sql
├── 002_add_client_management.sql
├── 003_add_project_tracking.sql
├── 004_add_time_entries.sql
├── 005_add_cash_flow.sql
├── 006_add_invoicing.sql
├── 007_add_document_storage.sql
├── 008_add_audit_logging.sql
├── 009_add_user_preferences.sql
└── 010_add_monthly_settings.sql
```

**Migration Runner Script:**

```typescript
// scripts/migrate-database.ts
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

interface Migration {
  id: number;
  name: string;
  filename: string;
  executed_at?: string;
}

class DatabaseMigrator {
  private supabase;
  private migrationsPath: string;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.migrationsPath = join(process.cwd(), 'migrations');
  }

  async initializeMigrationTable(): Promise<void> {
    const { error } = await this.supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL UNIQUE,
          filename VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });

    if (error) {
      throw new Error(`Failed to initialize migration table: ${error.message}`);
    }
  }

  async getExecutedMigrations(): Promise<Migration[]> {
    const { data, error } = await this.supabase
      .from('schema_migrations')
      .select('*')
      .order('id');

    if (error) {
      throw new Error(`Failed to fetch migrations: ${error.message}`);
    }

    return data || [];
  }

  async executeMigration(filename: string): Promise<void> {
    const migrationPath = join(this.migrationsPath, filename);
    const migrationSql = readFileSync(migrationPath, 'utf-8');
    
    console.log(`Executing migration: ${filename}`);
    
    const { error } = await this.supabase.rpc('exec_sql', {
      sql: migrationSql
    });

    if (error) {
      throw new Error(`Migration ${filename} failed: ${error.message}`);
    }

    // Record migration execution
    await this.supabase
      .from('schema_migrations')
      .insert({
        name: filename.replace('.sql', ''),
        filename: filename
      });

    console.log(`✅ Migration ${filename} completed successfully`);
  }

  async runMigrations(): Promise<void> {
    try {
      await this.initializeMigrationTable();
      
      const executedMigrations = await this.getExecutedMigrations();
      const executedFilenames = new Set(executedMigrations.map(m => m.filename));

      // Get all migration files
      const { readdirSync } = await import('fs');
      const migrationFiles = readdirSync(this.migrationsPath)
        .filter(file => file.endsWith('.sql'))
        .sort();

      console.log(`Found ${migrationFiles.length} migration files`);
      console.log(`${executedMigrations.length} migrations already executed`);

      const pendingMigrations = migrationFiles.filter(
        file => !executedFilenames.has(file)
      );

      if (pendingMigrations.length === 0) {
        console.log('✅ Database is up to date');
        return;
      }

      console.log(`Running ${pendingMigrations.length} pending migrations...`);

      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }

      console.log('🎉 All migrations completed successfully');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }
  }
}

// CLI usage
if (require.main === module) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const migrator = new DatabaseMigrator(supabaseUrl, supabaseKey);
  migrator.runMigrations();
}
```

### Backup and Recovery

**Automated Backup Strategy:**

```bash
#!/bin/bash
# scripts/backup-database.sh

# Configuration
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_ACCESS_TOKEN="your-access-token"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Ensure backup directory exists
mkdir -p $BACKUP_DIR

# Create database backup
echo "Creating database backup..."
supabase db dump --project-id $SUPABASE_PROJECT_ID > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: $BACKUP_FILE"
    
    # Compress backup
    gzip $BACKUP_FILE
    echo "✅ Backup compressed: $BACKUP_FILE.gz"
    
    # Upload to cloud storage (optional)
    # aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/database-backups/
    
    # Clean up old backups (keep last 30 days)
    find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
    echo "✅ Old backups cleaned up"
else
    echo "❌ Backup failed"
    exit 1
fi
```

**Recovery Procedure:**

```bash
#!/bin/bash
# scripts/restore-database.sh

BACKUP_FILE=$1
SUPABASE_PROJECT_ID="your-project-id"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  This will restore the database from backup: $BACKUP_FILE"
echo "⚠️  This action will overwrite existing data!"
read -p "Are you sure you want to continue? (yes/no): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Decompress if needed
if [[ $BACKUP_FILE == *.gz ]]; then
    echo "Decompressing backup..."
    gunzip -c $BACKUP_FILE > temp_restore.sql
    RESTORE_FILE="temp_restore.sql"
else
    RESTORE_FILE=$BACKUP_FILE
fi

# Restore database
echo "Restoring database..."
supabase db reset --project-id $SUPABASE_PROJECT_ID
psql -h db.your-project.supabase.co -U postgres -f $RESTORE_FILE

if [ $? -eq 0 ]; then
    echo "✅ Database restored successfully"
    
    # Clean up temporary file
    if [ "$RESTORE_FILE" = "temp_restore.sql" ]; then
        rm temp_restore.sql
    fi
else
    echo "❌ Restore failed"
    exit 1
fi
```

## Frontend Deployment

### Build Configuration

**Vite Production Build:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  
  // Build configuration
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.VITE_ENVIRONMENT !== 'production',
    
    // Optimization
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@headlessui/react', '@heroicons/react'],
          utils: ['date-fns', 'lodash'],
        },
      },
    },
    
    // Bundle analysis
    reportCompressedSize: true,
    
    // Asset optimization
    chunkSizeWarningLimit: 1000,
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
    },
  },
  
  // Development server
  server: {
    port: 3000,
    host: true,
    open: true,
  },
  
  // Preview server
  preview: {
    port: 4173,
    host: true,
  },
  
  // Environment variables
  envPrefix: 'VITE_',
});
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:staging": "VITE_ENVIRONMENT=staging vite build",
    "build:production": "VITE_ENVIRONMENT=production vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "lint:fix": "eslint . --ext ts,tsx --fix",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "analyze": "npx vite-bundle-analyzer dist",
    "deploy:staging": "npm run build:staging && npm run deploy:vercel:staging",
    "deploy:production": "npm run build:production && npm run deploy:vercel:production"
  }
}
```

### Static Hosting Deployment

**Vercel Deployment:**

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "handle": "filesystem"
    },
    {
      "src": "/.*",
      "dest": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    },
    {
      "source": "/static/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "VITE_SUPABASE_URL": "@supabase_url",
    "VITE_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "VITE_ENVIRONMENT": "production"
  }
}
```

**Netlify Deployment:**

```toml
# netlify.toml
[build]
  publish = "dist"
  command = "npm run build:production"

[build.environment]
  NODE_VERSION = "18"
  NPM_VERSION = "8"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    X-Content-Type-Options = "nosniff"
    Strict-Transport-Security = "max-age=31536000; includeSubDomains"
    Referrer-Policy = "strict-origin-when-cross-origin"

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[context.staging]
  environment = { VITE_ENVIRONMENT = "staging" }

[context.production]
  environment = { VITE_ENVIRONMENT = "production" }
```

**CloudFlare Pages Deployment:**

```yaml
# .github/workflows/cloudflare-pages.yml
name: Deploy to CloudFlare Pages

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Build for staging
        if: github.ref == 'refs/heads/staging'
        run: npm run build:staging
        env:
          VITE_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
      
      - name: Build for production
        if: github.ref == 'refs/heads/main'
        run: npm run build:production
        env:
          VITE_SUPABASE_URL: ${{ secrets.PRODUCTION_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.PRODUCTION_SUPABASE_ANON_KEY }}
      
      - name: Deploy to CloudFlare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: consultant-time-tracker
          directory: dist
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging, develop]
  pull_request:
    branches: [main, staging]

env:
  NODE_VERSION: '18'

jobs:
  test:
    name: Run Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint code
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
  
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run dependency check
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
  
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [test, security]
    
    strategy:
      matrix:
        environment: [staging, production]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for ${{ matrix.environment }}
        run: npm run build:${{ matrix.environment }}
        env:
          VITE_SUPABASE_URL: ${{ secrets[format('{0}_SUPABASE_URL', matrix.environment)] }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets[format('{0}_SUPABASE_ANON_KEY', matrix.environment)] }}
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-${{ matrix.environment }}
          path: dist/
          retention-days: 7
  
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/staging'
    environment: staging
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-staging
          path: dist/
      
      - name: Deploy to Vercel Staging
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
          scope: ${{ secrets.VERCEL_ORG_ID }}
  
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: production
    
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-production
          path: dist/
      
      - name: Deploy to Vercel Production
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
          scope: ${{ secrets.VERCEL_ORG_ID }}
          vercel-args: '--prod'
      
      - name: Update database migrations
        run: |
          npm install
          npm run migrate:production
        env:
          SUPABASE_URL: ${{ secrets.PRODUCTION_SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.PRODUCTION_SUPABASE_SERVICE_KEY }}
  
  notify:
    name: Notify Deployment
    runs-on: ubuntu-latest
    needs: [deploy-staging, deploy-production]
    if: always()
    
    steps:
      - name: Notify Slack
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Monitoring and Observability

### Application Performance Monitoring

**Sentry Integration:**

```typescript
// src/utils/monitoring.ts
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

export const initializeMonitoring = () => {
  const environment = import.meta.env.VITE_ENVIRONMENT;
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!sentryDsn || environment === 'development') {
    console.log('Monitoring disabled for development environment');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      new BrowserTracing({
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      // Filter out development-specific errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.value?.includes('Script error')) {
          return null; // Ignore generic script errors
        }
      }
      
      return event;
    },
    beforeSendTransaction(event) {
      // Filter out noisy transactions
      if (event.transaction?.includes('health-check')) {
        return null;
      }
      
      return event;
    },
  });

  // Set user context
  Sentry.setUser({
    id: 'user-id', // Set from authentication
    email: 'user-email', // Set from user profile
  });

  // Set additional context
  Sentry.setTag('component', 'frontend');
  Sentry.setContext('build', {
    version: import.meta.env.VITE_APP_VERSION,
    environment,
    timestamp: new Date().toISOString(),
  });
};

// Performance monitoring
export const trackPerformance = (metricName: string, value: number) => {
  Sentry.addBreadcrumb({
    message: `Performance metric: ${metricName}`,
    data: { value },
    level: 'info',
  });

  // Send to analytics if enabled
  if (window.gtag) {
    window.gtag('event', 'timing_complete', {
      name: metricName,
      value: Math.round(value),
    });
  }
};

// Error boundary with Sentry
export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => children,
  {
    fallback: ({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.662-.833-2.464 0L4.732 8.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="mt-4 text-center">
            <h3 className="text-lg font-medium text-gray-900">Something went wrong</h3>
            <p className="mt-2 text-sm text-gray-500">
              We've been notified about this error and will fix it soon.
            </p>
            <button
              onClick={resetError}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    ),
    beforeCapture: (scope, error, errorInfo) => {
      scope.setTag('errorBoundary', true);
      scope.setContext('errorInfo', errorInfo);
    },
  }
);
```

### Database Monitoring

**Supabase Monitoring Setup:**

```sql
-- Create monitoring views and functions
CREATE OR REPLACE VIEW performance_metrics AS
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation,
  most_common_vals,
  most_common_freqs
FROM pg_stats
WHERE schemaname = 'public';

-- Monitor slow queries
CREATE OR REPLACE FUNCTION get_slow_queries(duration_threshold interval DEFAULT '1 second')
RETURNS TABLE (
  query text,
  calls bigint,
  total_time double precision,
  mean_time double precision,
  rows bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pg_stat_statements.query,
    pg_stat_statements.calls,
    pg_stat_statements.total_time,
    pg_stat_statements.mean_time,
    pg_stat_statements.rows
  FROM pg_stat_statements
  WHERE pg_stat_statements.mean_time > extract(epoch from duration_threshold) * 1000
  ORDER BY pg_stat_statements.mean_time DESC;
END;
$$ LANGUAGE plpgsql;

-- Monitor table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
  table_name text,
  size_bytes bigint,
  size_pretty text,
  row_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    pg_total_relation_size(quote_ident(t.table_name)::regclass) as size_bytes,
    pg_size_pretty(pg_total_relation_size(quote_ident(t.table_name)::regclass)) as size_pretty,
    c.reltuples::bigint as row_count
  FROM information_schema.tables t
  JOIN pg_class c ON c.relname = t.table_name
  WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  ORDER BY pg_total_relation_size(quote_ident(t.table_name)::regclass) DESC;
END;
$$ LANGUAGE plpgsql;

-- Create monitoring dashboard queries
CREATE OR REPLACE FUNCTION system_health_check()
RETURNS json AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'timestamp', now(),
    'database_size', pg_size_pretty(pg_database_size(current_database())),
    'active_connections', (SELECT count(*) FROM pg_stat_activity WHERE state = 'active'),
    'slow_queries_count', (SELECT count(*) FROM get_slow_queries('5 seconds')),
    'largest_tables', (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM get_table_sizes() LIMIT 5) t)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Health Check Endpoints

```typescript
// src/utils/health-check.ts
export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: ServiceHealth;
    authentication: ServiceHealth;
    external_apis?: ServiceHealth;
  };
  metrics: {
    response_time: number;
    memory_usage?: number;
    error_rate?: number;
  };
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  response_time?: number;
  last_check: string;
  error?: string;
}

class HealthChecker {
  async checkDatabase(): Promise<ServiceHealth> {
    const start = performance.now();
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('count')
        .limit(1);
      
      const response_time = performance.now() - start;
      
      if (error) {
        return {
          status: 'down',
          response_time,
          last_check: new Date().toISOString(),
          error: error.message,
        };
      }
      
      return {
        status: response_time < 1000 ? 'up' : 'degraded',
        response_time,
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        response_time: performance.now() - start,
        last_check: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkAuthentication(): Promise<ServiceHealth> {
    const start = performance.now();
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      const response_time = performance.now() - start;
      
      if (error) {
        return {
          status: 'down',
          response_time,
          last_check: new Date().toISOString(),
          error: error.message,
        };
      }
      
      return {
        status: response_time < 500 ? 'up' : 'degraded',
        response_time,
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'down',
        response_time: performance.now() - start,
        last_check: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async checkExternalAPIs(): Promise<ServiceHealth> {
    const start = performance.now();
    
    try {
      // Check if external APIs are configured
      const fortnoxBaseUrl = import.meta.env.VITE_FORTNOX_BASE_URL;
      const mongodbEndpoint = import.meta.env.VITE_MONGODB_API_ENDPOINT;
      
      if (!fortnoxBaseUrl && !mongodbEndpoint) {
        return {
          status: 'up',
          response_time: performance.now() - start,
          last_check: new Date().toISOString(),
        };
      }
      
      // Simplified check - in production, implement actual API health checks
      const response_time = performance.now() - start;
      
      return {
        status: 'up',
        response_time,
        last_check: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'degraded',
        response_time: performance.now() - start,
        last_check: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const start = performance.now();
    
    const [database, authentication, external_apis] = await Promise.all([
      this.checkDatabase(),
      this.checkAuthentication(),
      this.checkExternalAPIs(),
    ]);
    
    const total_response_time = performance.now() - start;
    
    // Determine overall status
    const services = { database, authentication, external_apis };
    const serviceStatuses = Object.values(services).map(s => s.status);
    
    let overall_status: HealthCheckResult['status'];
    if (serviceStatuses.includes('down')) {
      overall_status = 'unhealthy';
    } else if (serviceStatuses.includes('degraded')) {
      overall_status = 'degraded';
    } else {
      overall_status = 'healthy';
    }
    
    return {
      status: overall_status,
      timestamp: new Date().toISOString(),
      services,
      metrics: {
        response_time: total_response_time,
      },
    };
  }
}

export const healthChecker = new HealthChecker();

// Hook for components to use health check
export const useHealthCheck = (interval: number = 60000) => {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const result = await healthChecker.performHealthCheck();
        setHealth(result);
      } catch (error) {
        console.error('Health check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Initial check
    checkHealth();
    
    // Periodic checks
    const intervalId = setInterval(checkHealth, interval);
    
    return () => clearInterval(intervalId);
  }, [interval]);
  
  return { health, loading };
};
```

## Security and Compliance

### SSL/TLS Configuration

**Custom Domain SSL Setup:**

```bash
# SSL certificate management for custom domains

# Using Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Renewal automation
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -

# SSL configuration verification
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com
```

**Security Headers Verification:**

```bash
#!/bin/bash
# scripts/verify-security-headers.sh

DOMAIN="https://yourdomain.com"

echo "Checking security headers for: $DOMAIN"
echo "========================================="

# Check headers
curl -I -s $DOMAIN | grep -E "(Strict-Transport-Security|X-Content-Type-Options|X-Frame-Options|X-XSS-Protection|Content-Security-Policy)"

# Security score check
echo ""
echo "Running security scan..."
# You can integrate with services like SecurityHeaders.com API
curl -s "https://securityheaders.com/?q=$DOMAIN&followRedirects=on" | grep -o "Grade: [A-F][+-]*"
```

### Compliance Monitoring

```typescript
// src/utils/compliance.ts
export interface ComplianceCheck {
  gdpr: boolean;
  dataRetention: boolean;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  accessLogging: boolean;
  userConsent: boolean;
}

export const performComplianceCheck = async (): Promise<ComplianceCheck> => {
  return {
    gdpr: checkGDPRCompliance(),
    dataRetention: checkDataRetentionPolicies(),
    encryptionAtRest: checkEncryptionAtRest(),
    encryptionInTransit: checkEncryptionInTransit(),
    accessLogging: checkAccessLogging(),
    userConsent: checkUserConsent(),
  };
};

const checkGDPRCompliance = (): boolean => {
  // Check if privacy policy is accessible
  // Check if data processing consent is implemented
  // Check if right to deletion is implemented
  return true; // Implement actual checks
};

const checkDataRetentionPolicies = (): boolean => {
  // Check if data retention policies are configured
  // Check if automatic data deletion is set up
  return true; // Implement actual checks
};
```

---

This comprehensive deployment and infrastructure guide provides everything needed to successfully deploy and maintain the consultant time tracking application in production environments with proper monitoring, security, and compliance measures.
