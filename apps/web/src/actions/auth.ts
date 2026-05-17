'use server';

import {
  LoginFormData,
  RegisterFormData,
  ResetPasswordFormData,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/components/content/auth/schemas/authSchemas';
import { processAccessToken, removeAuthToken } from '@/utils/auth';
import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_WEB_URL } from '@/utils/config';

export const login = async (data: LoginFormData) => {
  try {
    const validatedData = loginSchema.parse(data);

    const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(validatedData),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || error.error || 'API error',
      };
    }

    const { access_token } = await response.json();
    await processAccessToken(access_token);
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Internal server error' };
  }
};

export const sendResetPasswordEmail = async (email: string) => {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL}/auth/send-reset-password-email`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          frontendUrl: `${NEXT_PUBLIC_WEB_URL}/reset-password`,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset link');
    }

    return { success: true };
  } catch {
    return { success: true };
  }
};

export const register = async (data: RegisterFormData) => {
  try {
    const validatedData = registerSchema.parse(data);

    const payload = {
      email: validatedData.email,
      fullName: validatedData.fullName,
      nickName: validatedData.nickName,
      phoneNumber: validatedData.phoneNumber,
      password: validatedData.password,
      confirmPassword: validatedData.confirmPassword,
      dateOfBirth: validatedData.dateOfBirth,
      country: validatedData.country,
      region: validatedData.region,
      city: validatedData.city,
      userAgreement: validatedData.userAgreement,
      ageConfirmation: validatedData.ageConfirmation,
      frontendUrl: `${NEXT_PUBLIC_WEB_URL}/verify`,
    };

    const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/register-web`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.message === 'USER_ALREADY_EXISTS') {
        return {
          success: false,
          error: 'Користувач з таким email або позивним вже існує',
        };
      }
      throw new Error(error.message || 'Registration failed');
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Internal server error' };
  }
};

export const verifyEmail = async (token: string) => {
  try {
    const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send reset link');
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Internal server error' };
  }
};

export const resetPassword = async (
  data: ResetPasswordFormData & { token: string },
) => {
  try {
    const validatedData = resetPasswordSchema.parse(data);

    const response = await fetch(`${NEXT_PUBLIC_API_URL}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({
        token: data.token,
        password: validatedData.password,
      }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || error.error || 'API error',
      };
    }

    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Internal server error' };
  }
};

export const resendVerificationEmail = async (email: string) => {
  try {
    const response = await fetch(
      `${NEXT_PUBLIC_API_URL}/auth/resend-verification-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          frontendUrl: `${NEXT_PUBLIC_WEB_URL}/verify`,
        }),
      },
    );

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.message };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'ERROR_SENDING_VERIFICATION_EMAIL' };
  }
};

export const logout = async (): Promise<void> => {
  try {
    await removeAuthToken();
  } catch {
    throw new Error('ERROR_LOGOUT');
  }
};

export async function redirectToOAuth(
  provider: 'google' | 'facebook',
): Promise<string> {
  const apiUrl = NEXT_PUBLIC_API_URL;
  return `${apiUrl}/auth/${provider}`;
}

export async function processOAuthToken(token: string) {
  await processAccessToken(token);
}
