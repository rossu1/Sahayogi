-- Emergency Contacts Migration
-- Adds emergency_contacts jsonb field to users table
-- Run this in the Supabase SQL editor

alter table users
  add column if not exists emergency_contacts jsonb not null default '[]'::jsonb;

-- Example structure stored in emergency_contacts:
-- [
--   { "name": "Ram Sharma", "phone": "9841234567", "relationship": "family" },
--   { "name": "Sita Devi", "phone": "9812345678", "relationship": "friend" }
-- ]
