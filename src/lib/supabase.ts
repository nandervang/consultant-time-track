import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          company_name: string | null;
          company_motto: string | null;
          avatar_url: string | null;
          timezone: string | null;
          currency: string | null;
          hourly_rate: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          company_name?: string | null;
          company_motto?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          currency?: string | null;
          hourly_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string | null;
          company_motto?: string | null;
          avatar_url?: string | null;
          timezone?: string | null;
          currency?: string | null;
          hourly_rate?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          color: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      time_entries: {
        Row: {
          id: string;
          date: string;
          hours: number;
          project_id: string;
          comment: string | null;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          hours: number;
          project_id: string;
          comment?: string | null;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          hours?: number;
          project_id?: string;
          comment?: string | null;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      dashboard_widgets: {
        Row: {
          id: string;
          user_id: string;
          widget_type: string;
          title: string;
          position_x: number;
          position_y: number;
          width: number;
          height: number;
          config: Record<string, unknown>;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          widget_type: string;
          title: string;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          config?: Record<string, unknown>;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          widget_type?: string;
          title?: string;
          position_x?: number;
          position_y?: number;
          width?: number;
          height?: number;
          config?: Record<string, unknown>;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      cash_flow_entries: {
        Row: {
          id: string;
          user_id: string;
          type: 'income' | 'expense';
          amount: number;
          description: string;
          category: string;
          date: string;
          is_recurring: boolean;
          recurring_interval: 'weekly' | 'monthly' | 'yearly' | null;
          next_due_date: string | null;
          project_id: string | null;
          client_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'income' | 'expense';
          amount: number;
          description: string;
          category: string;
          date?: string;
          is_recurring?: boolean;
          recurring_interval?: 'weekly' | 'monthly' | 'yearly' | null;
          next_due_date?: string | null;
          project_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'income' | 'expense';
          amount?: number;
          description?: string;
          category?: string;
          date?: string;
          is_recurring?: boolean;
          recurring_interval?: 'weekly' | 'monthly' | 'yearly' | null;
          next_due_date?: string | null;
          project_id?: string | null;
          client_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          budget_limit: number;
          period: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
          start_date: string;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          category: string;
          budget_limit: number;
          period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          category?: string;
          budget_limit?: number;
          period?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      budget_entries: {
        Row: {
          id: string;
          budget_id: string;
          user_id: string;
          amount: number;
          description: string;
          date: string;
          cash_flow_entry_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          user_id: string;
          amount: number;
          description: string;
          date?: string;
          cash_flow_entry_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          user_id?: string;
          amount?: number;
          description?: string;
          date?: string;
          cash_flow_entry_id?: string | null;
          created_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          company: string | null;
          address: string | null;
          hourly_rate: number | null;
          currency: string | null;
          status: 'active' | 'inactive' | 'archived';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          address?: string | null;
          hourly_rate?: number | null;
          currency?: string | null;
          status?: 'active' | 'inactive' | 'archived';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          company?: string | null;
          address?: string | null;
          hourly_rate?: number | null;
          currency?: string | null;
          status?: 'active' | 'inactive' | 'archived';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          client_id: string | null;
          invoice_number: string;
          title: string;
          description: string | null;
          amount: number;
          tax_amount: number;
          total_amount: number;
          currency: string | null;
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          issue_date: string;
          due_date: string | null;
          paid_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          client_id?: string | null;
          invoice_number: string;
          title: string;
          description?: string | null;
          amount: number;
          tax_amount?: number;
          total_amount: number;
          currency?: string | null;
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          issue_date?: string;
          due_date?: string | null;
          paid_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          client_id?: string | null;
          invoice_number?: string;
          title?: string;
          description?: string | null;
          amount?: number;
          tax_amount?: number;
          total_amount?: number;
          currency?: string | null;
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          issue_date?: string;
          due_date?: string | null;
          paid_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      cash_flow_summary: {
        Row: {
          user_id: string;
          month: string;
          total_income: number;
          total_expenses: number;
          net_flow: number;
        };
      };
      budget_status: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          category: string;
          budget_limit: number;
          period: string;
          spent_amount: number;
          remaining_amount: number;
          usage_percentage: number;
        };
      };
    };
  };
}