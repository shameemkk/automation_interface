-- Users table for admin-added users
CREATE TABLE IF NOT EXISTS automation_users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE automation_users ENABLE ROW LEVEL SECURITY;

-- Policy: Block anon access. Server uses service_role which bypasses RLS.
CREATE POLICY "Block anon access" ON automation_users
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_automation_users_email ON automation_users(email);
