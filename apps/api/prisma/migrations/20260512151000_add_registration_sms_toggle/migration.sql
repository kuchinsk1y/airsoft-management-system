-- Add organization-level toggle for registration SMS notifications.
ALTER TABLE "Organizations"
ADD COLUMN IF NOT EXISTS "registrationSmsEnabled" BOOLEAN NOT NULL DEFAULT true;
