import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  EQUIPMENT_SLOTS,
  EQUIPMENT_SLOT_KEYS,
  EquipmentSlotKey,
} from './equipment.constants';
import { UpdateMyEquipmentDto } from './dto/update-my-equipment.dto';
import { EquipmentItemResponseDto } from './dto/equipment-item-response.dto';

@Injectable()
export class EquipmentService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyEquipment(userId: number): Promise<EquipmentItemResponseDto[]> {
    const rows = await this.prisma.userEquipment.findMany({
      where: { userId },
    });
    const byKey = new Map(rows.map((r) => [r.slotKey, r.value]));

    return EQUIPMENT_SLOT_KEYS.map(
      (slotKey) =>
        new EquipmentItemResponseDto(
          slotKey,
          EQUIPMENT_SLOTS[slotKey],
          byKey.get(slotKey) ?? '',
        ),
    );
  }

  async updateMyEquipment(
    userId: number,
    dto: UpdateMyEquipmentDto,
  ): Promise<EquipmentItemResponseDto[]> {
    const entries = EQUIPMENT_SLOT_KEYS.map((key) => [key, dto[key]] as const);

    for (const [slotKey, raw] of entries) {
      if (raw === undefined) {
        continue;
      }
      const value = raw.trim();

      if (value === '') {
        await this.prisma.userEquipment.deleteMany({
          where: { userId, slotKey },
        });
        continue;
      }

      await this.prisma.userEquipment.upsert({
        where: {
          userId_slotKey: { userId, slotKey },
        },
        create: { userId, slotKey, value },
        update: { value },
      });
    }

    return this.getMyEquipment(userId);
  }
}
