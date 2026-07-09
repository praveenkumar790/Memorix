-- Migration: Add 'github' to the integrations_provider_check constraint
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- The integrations table has a CHECK constraint that only allows specific provider values.
-- This migration drops the old constraint and recreates it with 'github' included.

-- Step 1: Drop the existing constraint (name may vary — check yours in Table Editor > integrations > constraints)
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;

-- Step 2: Recreate with github included
ALTER TABLE integrations
  ADD CONSTRAINT integrations_provider_check
  CHECK (provider IN ('notion', 'slack', 'confluence', 'github'));
