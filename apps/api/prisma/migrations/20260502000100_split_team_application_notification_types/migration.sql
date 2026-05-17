-- Split TEAM_APPLICATION notification type into granular team action types.
-- This migration is written manually because `prisma migrate dev` is interactive.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'NotificationType_new') THEN
    CREATE TYPE "NotificationType_new" AS ENUM (
      'TEAM_JOIN_REQUEST',
      'TEAM_JOIN_REQUEST_APPROVED',
      'TEAM_JOIN_REQUEST_REJECTED',
      'TEAM_MEMBER_LEFT',
      'TEAM_MEMBER_REMOVED',
      'TEAM_DELETED',
      'TEAM_INVITATION',
      'TEAM_MODERATION',
      'TRANSFER_OWNERSHIP',
      'EVENT_REGISTRATION',
      'EVENT_REMINDER',
      'SYSTEM'
    );
  END IF;
END $$;

ALTER TABLE "Notifications"
ALTER COLUMN "type" TYPE "NotificationType_new"
USING (
  CASE
    WHEN "type"::text = 'TEAM_APPLICATION' AND "title" = 'До Вашої команди бажають вступити' THEN 'TEAM_JOIN_REQUEST'
    WHEN "type"::text = 'TEAM_APPLICATION' AND "title" = 'Підтвердження на вступ до команди' THEN 'TEAM_JOIN_REQUEST_APPROVED'
    WHEN "type"::text = 'TEAM_APPLICATION' AND "title" = 'Вашу заявку відхилено' THEN 'TEAM_JOIN_REQUEST_REJECTED'
    WHEN "type"::text = 'TEAM_APPLICATION' AND "title" = 'Учасник покинув команду' THEN 'TEAM_MEMBER_LEFT'
    WHEN "type"::text = 'TEAM_APPLICATION' AND "title" = 'Вас видалено з команди' THEN 'TEAM_MEMBER_REMOVED'
    WHEN "type"::text = 'TEAM_APPLICATION' AND "title" = 'Команду видалено' THEN 'TEAM_DELETED'
    WHEN "type"::text = 'TEAM_APPLICATION' THEN 'TEAM_JOIN_REQUEST'
    ELSE "type"::text
  END
)::"NotificationType_new";

DROP TYPE "NotificationType";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
