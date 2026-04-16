-- Migration 011: Drop discovery_sessions table
-- Discovery is now button-based single-page flow, no session tracking needed

-- Drop the table and all related objects
DROP TABLE IF EXISTS discovery_sessions CASCADE;