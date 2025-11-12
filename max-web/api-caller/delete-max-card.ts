const API = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8788';

type DeleteMaxCardResponse =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Удаляет карточку инициативы через публичный API бота.
 * 
 * @param cardId - ID карточки для удаления
 * 
 * Успех: возвращает void.
 * Ошибка HTTP или ответа `ok: false` — выбрасывает исключение с текстом ошибки.
 */
export async function deleteMaxCardFromUI(cardId: string): Promise<void> {
  const response = await fetch(`${API}/delete-card?card_id=${encodeURIComponent(cardId)}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as DeleteMaxCardResponse;
  if (!payload.ok) {
    throw new Error(payload.error || 'Failed to delete card');
  }
}

