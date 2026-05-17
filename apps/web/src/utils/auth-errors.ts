export const getAuthErrorMessage = (error: string): string => {
  const errorMessages: Record<string, string> = {
    INVALID_CREDENTIALS: 'НЕВІРНИЙ EMAIL АБО ПАРОЛЬ. СПРОБУЙТЕ ЩЕ РАЗ',
    EMAIL_NOT_VERIFIED: 'EMAIL НЕ ПІДТВЕРДЖЕНИЙ. ПЕРЕВІРТЕ ПОШТУ',
    EMAIL_REQUIRED:
      'Провайдер не надав email адресу. Будь ласка, надайте доступ до email в налаштуваннях акаунту або спробуйте інший спосіб входу.',
    EMAIL_REQUIRED_FROM_GOOGLE:
      'Google не надав email адресу. Будь ласка, надайте доступ до email в налаштуваннях Google або спробуйте інший спосіб входу.',
    EMAIL_REQUIRED_FROM_FACEBOOK:
      'Facebook не надав email адресу. Будь ласка, переконайтеся, що ваш акаунт Facebook має email, або спробуйте інший спосіб входу.',
    OAUTH_ACCESS_DENIED:
      'Ви скасували авторизацію. Будь ласка, надайте доступ для входу через соціальну мережу.',
    USER_ALREADY_EXISTS:
      'Користувач з таким даними вже існує. Будь ласка, увійдіть через стандартну форму входу з паролем.',
    USER_NOT_FOUND: 'Користувача з таким email не знайдено',
    OAUTH_FAILED:
      'Помилка при вході через соціальну мережу. Спробуйте ще раз або використайте стандартну реєстрацію.',
  };

  const normalizedError = error.toUpperCase();

  return errorMessages[normalizedError] || error;
};
