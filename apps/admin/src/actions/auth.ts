'use server';

import { cookies } from 'next/headers'
import { NEXT_PUBLIC_API_URL, NEXT_PUBLIC_API_KEY } from '@/app/utils/config'

const API_URL = NEXT_PUBLIC_API_URL.replace(/\/$/, '')

if (!API_URL || !NEXT_PUBLIC_API_KEY) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_KEY')
}

interface RegisterData {
  email: string
  fullName: string
  nickName: string
  phoneNumber: string
  password: string
  confirmPassword: string
  dateOfBirth: string
  country: string
  region: string
  city: string
  userAgreement: boolean
  ageConfirmation: boolean
  frontendUrl: string
}

export async function registerUser(data: RegisterData) {
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NEXT_PUBLIC_API_KEY,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || 'Помилка реєстрації',
      };
    }

    return { success: true, data: responseData };
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: 'Не вдалося виконати реєстрацію. Спробуйте пізніше.',
    };
  }
}

export async function verifyEmail(token: string) {
  try {
    const response = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': NEXT_PUBLIC_API_KEY,
      },
      body: JSON.stringify({ token }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: responseData.message || 'Помилка верифікації',
      };
    }

    return { success: true, data: responseData };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      error: 'Не вдалося верифікувати email. Спробуйте пізніше.',
    };
  }
}

export async function login(email: string, password: string): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      return {
        success: false,
        error: data?.message || 'Невірний email або пароль',
      }
    }

    const data = await response.json()
    const token = data?.access_token

    if (!token) {
      return {
        success: false,
        error: 'Не вдалося отримати токен доступу',
      }
    }

    const cookieStore = await cookies()
    cookieStore.set('access_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return { success: true }
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false,
      error: 'Помилка під час входу. Спробуйте ще раз.',
    }
  }
}

export async function sendResetPasswordEmail(
  email: string,
  frontendUrl: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/send-reset-password-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, frontendUrl }),
    })

    if (!response.ok) {
      // Keep response intentionally generic to avoid leaking whether user exists.
      return { success: true }
    }

    return { success: true }
  } catch {
    return { success: true }
  }
}

export async function resetPassword(data: {
  token: string
  password: string
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: data.token,
        password: data.password,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      return {
        success: false,
        error: payload?.message || 'Не вдалося скинути пароль. Спробуйте ще раз.',
      }
    }

    return { success: true }
  } catch {
    return {
      success: false,
      error: 'Не вдалося скинути пароль. Спробуйте ще раз.',
    }
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('access_token')
    return { success: true }
  } catch (error) {
    console.error('Logout error:', error)
    return { success: false }
  }
}
