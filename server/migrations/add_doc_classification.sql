-- Migration: Add doc_type and technologies columns to documents table
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)
--
-- These columns are populated by classificationService.js after document ingestion.
-- Both are nullable so existing rows are unaffected.

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS doc_type TEXT,
  ADD COLUMN IF NOT EXISTS technologies TEXT[];

-- doc_type will be one of: adr, runbook, policy, api_spec, readme, general
-- technologies is a text array of lowercase tech names, e.g. {'postgres', 'redis', 'react'}

-- Optional: Add a comment to document the valid values
COMMENT ON COLUMN documents.doc_type IS 'Classified document type: adr | runbook | policy | api_spec | readme | general';
COMMENT ON COLUMN documents.technologies IS 'Technology stack extracted from document content (lowercase names)';
