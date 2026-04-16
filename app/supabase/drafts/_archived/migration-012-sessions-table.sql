-- Create sessions table for duplicate login detection
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  device_id TEXT NOT NULL, -- Browser fingerprint + random ID
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sessions_wallet_active ON sessions(wallet_address, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_device ON sessions(device_id);
CREATE INDEX IF NOT EXISTS idx_sessions_last_active ON sessions(last_active);

-- RLS policies
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (
    wallet_address = (
      SELECT wallet_address 
      FROM profiles 
      WHERE wallet_address = sessions.wallet_address
    )
  );

-- Users can insert their own sessions
CREATE POLICY "Users can create own sessions" ON sessions
  FOR INSERT WITH CHECK (
    wallet_address = (
      SELECT wallet_address 
      FROM profiles 
      WHERE wallet_address = sessions.wallet_address
    )
  );

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (
    wallet_address = (
      SELECT wallet_address 
      FROM profiles 
      WHERE wallet_address = sessions.wallet_address
    )
  );

-- Auto-cleanup old inactive sessions (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM sessions 
  WHERE is_active = FALSE 
    AND last_active < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (can be called via cron or manually)
COMMENT ON FUNCTION cleanup_old_sessions() IS 'Clean up sessions older than 30 days';