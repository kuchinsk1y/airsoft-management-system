import z from 'zod';

export const updateUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { message: "Це поле є обов'язковим для заповнення" })
    .regex(/^\S+$/, { message: "Пробіл заборонений" }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Це поле є обов'язковим для заповнення" })
    .regex(/^\S+$/, { message: "Пробіл заборонений" }),
  nickName: z
    .string()
    .min(1, { message: "Це поле є обов'язковим для заповнення" }),
  dateOfBirth: z.string().optional(),
  phoneNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^\+?380\d{9}$/.test(val), {
      message:
        'Неправильний формат номеру. Використовуйте (Зразок: +380123456789)',
    }),
  country: z
    .string()
    .trim()
    .min(1, { message: "Це поле є обов'язковим для заповнення" }),
  region: z
    .string()
    .trim()
    .min(1, { message: "Це поле є обов'язковим для заповнення" }),
  city: z.string().trim().min(1, { message: "Це поле є обов'язковим для заповнення" }),
});
export type UpdateUserData = z.infer<typeof updateUserSchema>;
