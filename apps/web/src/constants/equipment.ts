/** Must match API `equipment.constants.ts` slot keys */
export const EQUIPMENT_SLOT_KEYS = [
  'primaryWeapon',
  'secondaryWeapon',
  'protection',
  'communication',
] as const;

export type EquipmentSlotKey = (typeof EQUIPMENT_SLOT_KEYS)[number];

export interface UserEquipmentItem {
  slotKey: EquipmentSlotKey;
  label: string;
  value: string;
}

export const EQUIPMENT_LABELS: Record<EquipmentSlotKey, string> = {
  primaryWeapon: 'Основна зброя',
  secondaryWeapon: 'Додаткова зброя',
  protection: 'Захист',
  communication: 'Комунікація',
};

export function defaultEquipmentItems(): UserEquipmentItem[] {
  return EQUIPMENT_SLOT_KEYS.map((slotKey) => ({
    slotKey,
    label: EQUIPMENT_LABELS[slotKey],
    value: '',
  }));
}
