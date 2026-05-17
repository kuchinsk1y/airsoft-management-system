import { EquipmentSlotKey } from '../equipment.constants';

export class EquipmentItemResponseDto {
  slotKey: EquipmentSlotKey;
  label: string;
  value: string;

  constructor(slotKey: EquipmentSlotKey, label: string, value: string) {
    this.slotKey = slotKey;
    this.label = label;
    this.value = value;
  }
}
