export const EQUIPMENT_SLOTS = {
  primaryWeapon: 'Основна зброя',
  secondaryWeapon: 'Додаткова зброя',
  protection: 'Захист',
  communication: 'Комунікація',
} as const;

export type EquipmentSlotKey = keyof typeof EQUIPMENT_SLOTS;

export const EQUIPMENT_SLOT_KEYS = Object.keys(
  EQUIPMENT_SLOTS,
) as EquipmentSlotKey[];
