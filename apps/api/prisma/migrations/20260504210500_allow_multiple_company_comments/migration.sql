-- Allow multiple company comments per user.
-- Keep event comment uniqueness unchanged.

DROP INDEX IF EXISTS "Comments_company_user_unique";
