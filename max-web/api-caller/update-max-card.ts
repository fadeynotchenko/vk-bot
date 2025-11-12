import type { MaxCard, MaxCardInput } from "../../api/shared/max-card.ts";

const API = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8788';

type UpdateMaxCardResponse =
  | { ok: true; data: MaxCard }
  | { ok: false; error: string };

export type UpdateMaxCardPayload = Partial<Omit<MaxCardInput, 'image' | 'user_id'>> & {
  card_id: string;
  image?: File | null;
  user_id?: number;
};

/**
 * Обновляет существующую карточку инициативы через публичный API бота.
 * 
 * @param payload - данные карточки для обновления:
 *   - card_id: ID карточки для обновления (обязательное)
 *   - category: категория карточки (опциональное)
 *   - title: заголовок карточки (опциональное)
 *   - subtitle: краткое описание (опциональное)
 *   - text: полное описание (опциональное)
 *   - status: статус карточки (опциональное)
 *   - link: ссылка на мероприятие (опциональное)
 *   - user_id: ID пользователя MAX (опциональное)
 *   - image: файл изображения (опциональное, PNG/JPG до 5MB)
 * 
 * @returns Обновлённая карточка
 * 
 * Успех: возвращает объект MaxCard.
 * Ошибка HTTP или ответа `ok: false` — выбрасывает исключение с текстом ошибки.
 */
export async function updateMaxCardFromUI(payload: UpdateMaxCardPayload): Promise<MaxCard> {
  const formData = new FormData();
  
  // Обязательное поле
  formData.append('card_id', payload.card_id);
  
  // Добавляем только те поля, которые были переданы
  if (payload.category !== undefined) {
    formData.append('category', payload.category);
  }
  if (payload.title !== undefined) {
    formData.append('title', payload.title);
  }
  if (payload.subtitle !== undefined) {
    formData.append('subtitle', payload.subtitle);
  }
  if (payload.text !== undefined) {
    formData.append('text', payload.text);
  }
  if (payload.status !== undefined) {
    formData.append('status', payload.status);
  }
  if (payload.link !== undefined) {
    formData.append('link', payload.link);
  }
  
  // Добавляем ID пользователя, если он передан
  if (payload.user_id !== undefined) {
    formData.append('user_id', payload.user_id.toString());
  }
  
  // Добавляем файл изображения, если он есть
  if (payload.image) {
    formData.append('image', payload.image);
  }

  const response = await fetch(`${API}/update-card`, {
    method: 'PUT',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const body = (await response.json()) as UpdateMaxCardResponse;
  if (!body.ok) {
    throw new Error(body.error || 'Failed to update card');
  }

  return body.data;
}

