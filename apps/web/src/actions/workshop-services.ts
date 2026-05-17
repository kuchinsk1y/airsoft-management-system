"use server";

import { DataForm } from "@/components/workshop/OrderForm";
import { NEXT_PUBLIC_API_URL, STATIC_API_KEY } from "@/utils/config";


export async function submitWorkshopForm(data: DataForm) {

  try {
    const result = await fetch(`${NEXT_PUBLIC_API_URL}/services`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': STATIC_API_KEY,
      },
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      console.error('Failed to submit form:', result.statusText);
      return { success: false, error: 'Сталася помилка при надсиланні форми' };
    }

    return { success: true, message: 'Форма успішно надіслана' };
  } catch (error) {
    console.error('Error submitting form:', error);
    return { success: false, error: 'Сталася помилка при надсиланні форми' };
  }

}


  