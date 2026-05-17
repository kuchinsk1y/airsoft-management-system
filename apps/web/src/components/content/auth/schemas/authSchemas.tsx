import { z } from 'zod';

const emailSchema = z
  .email('Введіть валідний email')
  .min(1, "Email є обов'язковим");
const MIN_TEXT_LENGTH = 2;

const minTwoCharsSchema = (requiredMessage: string, minLengthMessage: string) =>
  z
    .string()
    .trim()
    .min(1, requiredMessage)
    .min(MIN_TEXT_LENGTH, minLengthMessage);

const PASSWORD_STRENGTH_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S{8,256}$/;

const passwordSchema = z
  .string()
  .min(1, "Пароль є обов'язковим")
  .regex(
    PASSWORD_STRENGTH_REGEX,
    'Пароль: мінімум 8 символів без пробілів; обовʼязково велика й мала латинські літери, цифра та хоча б один символ, що не є літерою чи цифрою',
  );

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Пароль є обов'язковим"),
});

const checkboxSchema = (errorMessage: string) =>
  z
    .union([z.boolean(), z.string(), z.undefined()])
    .transform((val) => {
      if (val === undefined || val === null) return false;
      if (typeof val === 'string') return val === 'true' || val === 'on';
      return val;
    })
    .refine((val) => val === true, errorMessage);

const isAdult = (dateString: string) => {
  const birth = new Date(dateString);
  if (isNaN(birth.getTime())) return false;

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() - 18);

  return birth <= maxDate;
};

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Підтвердження пароля є обов'язковим"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });

export const registerSchema = z
  .object({
    email: emailSchema,
    fullName: minTwoCharsSchema(
      "Повне ім'я є обов'язковим",
      `Повне ім'я має містити щонайменше ${MIN_TEXT_LENGTH} символи`,
    ),
    nickName: minTwoCharsSchema(
      "Позивний є обов'язковим",
      `Позивний має містити щонайменше ${MIN_TEXT_LENGTH} символи`,
    ),
    phoneNumber: z
      .string()
      .trim()
      .min(1, "Номер телефону є обов'язковим")
      .regex(
        /^\+?380[0-9]{9}$/,
        'Номер телефону має бути у форматі +380XXXXXXXXX (наприклад +380501234567)',
      ),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Підтвердження пароля є обов'язковим"),
    dateOfBirth: z
      .string()
      .min(1, "Дата народження є обов'язковою")
      .refine(isAdult, 'Вам повинно бути не менше 18 років'),
    country: minTwoCharsSchema(
      "Країна є обов'язковою",
      `Країна має містити щонайменше ${MIN_TEXT_LENGTH} символи`,
    ),
    region: minTwoCharsSchema(
      "Регіон є обов'язковим",
      `Регіон має містити щонайменше ${MIN_TEXT_LENGTH} символи`,
    ),
    city: minTwoCharsSchema(
      "Місто є обов'язковим",
      `Місто має містити щонайменше ${MIN_TEXT_LENGTH} символи`,
    ),
    userAgreement: checkboxSchema('Необхідно прийняти угоду користувача'),
    ageConfirmation: checkboxSchema('Необхідно підтвердити вік'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Паролі не співпадають',
    path: ['confirmPassword'],
  });

export type LoginFormData = z.infer<typeof loginSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
