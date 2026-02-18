-- Add zip_codes_format as text[] for comma-separated values stored as array
ALTER TABLE client_details
  ADD COLUMN IF NOT EXISTS zip_codes_format TEXT[];
