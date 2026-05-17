-- CreateTable
CREATE TABLE "UserEquipment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "slotKey" VARCHAR(50) NOT NULL,
    "value" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserEquipment_userId_idx" ON "UserEquipment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEquipment_userId_slotKey_key" ON "UserEquipment"("userId", "slotKey");

-- AddForeignKey
ALTER TABLE "UserEquipment" ADD CONSTRAINT "UserEquipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
