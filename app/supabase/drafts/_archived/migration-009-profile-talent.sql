-- Migration 009: Add talent fields to profiles
-- For storing discovery results when user connects wallet

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_talent text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS talent_category text CHECK (talent_category IN ('Creative', 'Physical', 'Intellectual', 'Social', 'Technical', 'Hybrid'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS discovery_complete boolean DEFAULT false;
