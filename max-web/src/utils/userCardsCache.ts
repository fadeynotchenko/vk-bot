import type { MaxCard } from '../../api-caller/get-user-cards.ts';
import { fetchUserCardsFromUI } from '../../api-caller/get-user-cards.ts';

type UserCardsCache = {
  [userId: number]: {
    cards: MaxCard[];
    timestamp: number;
  };
};

type CacheListener = (userId: number, cards: MaxCard[]) => void;

class UserCardsCacheManager {
  private cache: UserCardsCache = {};
  private listeners: Set<CacheListener> = new Set();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 минут

  /**
   * Получает карточки пользователя из кеша или загружает их.
   * 
   * @param userId - ID пользователя MAX
   * @param forceRefresh - принудительно обновить кеш
   * @returns Promise с массивом карточек
   */
  async getUserCards(userId: number, forceRefresh = false): Promise<MaxCard[]> {
    const cached = this.cache[userId];
    const now = Date.now();

    if (!forceRefresh && cached && (now - cached.timestamp) < this.CACHE_TTL) {
      return cached.cards;
    }

    const cards = await fetchUserCardsFromUI(userId);
    
    this.cache[userId] = {
      cards,
      timestamp: now,
    };

    this.notifyListeners(userId, cards);

    return cards;
  }

  /**
   * Инвалидирует кеш для пользователя и загружает свежие данные.
   * 
   * @param userId - ID пользователя MAX
   */
  async invalidateUserCache(userId: number): Promise<void> {
    await this.getUserCards(userId, true);
  }

  /**
   * Добавляет карточку в кеш без запроса к серверу.
   * Используется для оптимистичного обновления UI.
   * 
   * @param userId - ID пользователя MAX
   * @param card - новая карточка
   */
  addCardToCache(userId: number, card: MaxCard): void {
    const cached = this.cache[userId];
    if (cached) {
      if (!cached.cards.some((c) => c.id === card.id)) {
        cached.cards = [card, ...cached.cards];
        cached.timestamp = Date.now();
        this.notifyListeners(userId, cached.cards);
      }
    }
  }

  /**
   * Подписывается на изменения кеша.
   * 
   * @param listener - функция-обработчик изменений
   * @returns функция для отписки
   */
  subscribe(listener: CacheListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Очищает весь кеш.
   */
  clear(): void {
    this.cache = {};
  }

  /**
   * Очищает кеш для конкретного пользователя.
   * 
   * @param userId - ID пользователя MAX
   */
  clearUserCache(userId: number): void {
    delete this.cache[userId];
  }

  private notifyListeners(userId: number, cards: MaxCard[]): void {
    this.listeners.forEach((listener) => {
      try {
        listener(userId, cards);
      } catch (error) {
        console.error('Error in cache listener:', error);
      }
    });
  }
}

export const userCardsCache = new UserCardsCacheManager();

