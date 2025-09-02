-- Create invoice_items table for tracking unbilled work and invoice items
CREATE TABLE invoice_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 0, -- hours or units
  rate DECIMAL(10,2) NOT NULL DEFAULT 0, -- hourly rate or fixed price
  amount DECIMAL(10,2) NOT NULL DEFAULT 0, -- quantity * rate
  type VARCHAR(10) NOT NULL DEFAULT 'hourly' CHECK (type IN ('hourly', 'fixed')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid')),
  invoice_number VARCHAR(100), -- reference to invoice number when invoiced
  time_entry_ids UUID[], -- array of time entry IDs if created from time tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_invoice_items_user_id ON invoice_items(user_id);
CREATE INDEX idx_invoice_items_client_id ON invoice_items(client_id);
CREATE INDEX idx_invoice_items_project_id ON invoice_items(project_id);
CREATE INDEX idx_invoice_items_status ON invoice_items(status);
CREATE INDEX idx_invoice_items_date ON invoice_items(date);
CREATE INDEX idx_invoice_items_created_at ON invoice_items(created_at);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_invoice_items_updated_at
  BEFORE UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own invoice items
CREATE POLICY "Users can view their own invoice items" ON invoice_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice items" ON invoice_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoice items" ON invoice_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoice items" ON invoice_items
  FOR DELETE USING (auth.uid() = user_id);

-- Add function to automatically calculate amount
CREATE OR REPLACE FUNCTION calculate_invoice_item_amount()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount = NEW.quantity * NEW.rate;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER calculate_invoice_item_amount_trigger
  BEFORE INSERT OR UPDATE ON invoice_items
  FOR EACH ROW
  EXECUTE FUNCTION calculate_invoice_item_amount();
