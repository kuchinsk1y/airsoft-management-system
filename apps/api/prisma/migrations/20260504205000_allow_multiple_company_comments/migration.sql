-- Restore missing migration file.
-- Allow multiple company comments per user.

DROP INDEX IF EXISTS "Comments_company_user_unique";
