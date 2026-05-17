-- Rename legacy website field to phone number for applications
ALTER TABLE "Applications"
RENAME COLUMN "website" TO "phoneNumber";
