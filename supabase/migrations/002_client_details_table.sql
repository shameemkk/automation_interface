-- Client details table (create if not exists; adjust if your existing table differs)
CREATE TABLE IF NOT EXISTS client_details (
  id BIGSERIAL PRIMARY KEY,
  client_tag TEXT NOT NULL,
  locations TEXT,
  zip_codes TEXT,
  drive_url TEXT,
  automation_mode TEXT NOT NULL CHECK (automation_mode IN ('fully_auto', 'semi_auto')),
  process_automations BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS; server uses service_role which bypasses RLS
ALTER TABLE client_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Block anon access" ON client_details
  FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_client_details_client_tag ON client_details(client_tag);
