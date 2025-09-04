-- Migration: Set all existing invoice items to draft status
-- Date: 2025-09-04
-- Description: Update all existing invoice items to have 'draft' status since 
--              they should not default to 'sent' status

-- Update all existing invoice items to draft status
UPDATE invoice_items 
SET status = 'draft', 
    updated_at = NOW()
WHERE status = 'sent' 
   OR status IS NULL;

-- Ensure future invoice items default to draft if not specified
-- (This should already be handled in the application logic)
