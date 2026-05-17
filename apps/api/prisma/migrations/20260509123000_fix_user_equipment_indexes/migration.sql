CREATE INDEX IF NOT EXISTS "UserEquipment_userId_idx"
ON public."UserEquipment" ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "UserEquipment_userId_slotKey_key"
ON public."UserEquipment" ("userId", "slotKey");