-- Test script to manually create monthly_settings table if needed
-- Run this in your Supabase SQL editor

-- Check if table exists
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'monthly_settings'
);

-- If table doesn't exist, create it
-- CREATE TABLE monthly_settings (
--   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
--   user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
--   year INTEGER NOT NULL,
--   month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
--   billing_percentage DECIMAL(5,2) DEFAULT 94.0,
--   absence_percentage DECIMAL(5,2) DEFAULT 15.0,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
--   updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
--   UNIQUE(user_id, year, month)
-- );

-- Test insert (replace with your user ID)
-- INSERT INTO monthly_settings (user_id, year, month, billing_percentage, absence_percentage)
-- VALUES ('your-user-id-here', 2025, 8, 94.0, 15.0)
-- ON CONFLICT (user_id, year, month) DO UPDATE SET
--   billing_percentage = EXCLUDED.billing_percentage,
--   absence_percentage = EXCLUDED.absence_percentage,
--   updated_at = now();
