import type { MaxCard, MaxCardCreatePayload } from "../../api/shared/max-card.ts";

const API = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8788';

type CreateMaxCardResponse =
  | { ok: true; data: MaxCard }
  | { ok: false; error: string };

export type CreateMaxCardPayload = Omit<MaxCardCreatePayload, 'image'> & {
  image?: File | null;
};

export async function createMaxCardFromUI(payload: CreateMaxCardPayload): Promise<MaxCard> {
  const formData = new FormData();
  
  // Добавляем текстовые поля
  formData.append('category', payload.category);
  formData.append('title', payload.title);
  formData.append('subtitle', payload.subtitle);
  formData.append('text', payload.text);
  formData.append('status', payload.status);
  
  if (payload.link) {
    formData.append('link', payload.link);
  }
  
  // Добавляем файл изображения, если он есть
  if (payload.image) {
    formData.append('image', payload.image);
  }

  const response = await fetch(`${API}/create-card`, {
    method: 'POST',
    body: formData,
    // Не устанавливаем Content-Type вручную - браузер сам установит с boundary
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const body = (await response.json()) as CreateMaxCardResponse;
  if (!body.ok) {
    throw new Error(body.error || 'Failed to create card');
  }

  return body.data;
}
