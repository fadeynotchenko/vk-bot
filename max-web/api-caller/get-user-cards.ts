import type { MaxCard } from "../../api/shared/max-card.ts";
export type { MaxCard } from "../../api/shared/max-card.ts";

const API = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8788';

type GetUserCardsResponse =
  | { ok: true; data: MaxCard[] }
  | { ok: false; error: string };

/**
 * Загружает карточки пользователя через публичный API бота.
 *
 * @param userId - ID пользователя MAX
 * 
 * Успех: возвращает массив DTO.
 * Ошибка HTTP или ответа `ok: false` — выбрасывает исключение с текстом ошибки.
 */
export async function fetchUserCardsFromUI(userId: number): Promise<MaxCard[]> {
  const response = await fetch(`${API}/user-cards?user_id=${encodeURIComponent(userId)}`);
  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as GetUserCardsResponse;
  if (!payload.ok) {
    throw new Error(payload.error || 'Failed to load user cards');
  }

  return payload.data;
}

