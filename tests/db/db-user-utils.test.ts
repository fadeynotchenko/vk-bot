import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  upsertUser,
  getLastViewCount,
  saveLastViewCount,
  getLastMotivationalMessageId,
  saveLastMotivationalMessageId,
  getLastMotivationalMessageDate,
  clearLastMotivationalMessage,
} from '../../db/db-user-utils.ts';
import { db } from '../../db/db-client.ts';

// Мокаем модуль базы данных
vi.mock('../../db/db-client.ts', () => ({
  db: {
    collection: vi.fn(),
  },
}));

describe('db-user-utils', () => {
  let mockCollection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection = {
      updateOne: vi.fn(),
      findOne: vi.fn(),
    };
    vi.mocked(db.collection).mockReturnValue(mockCollection as any);
  });

  describe('upsertUser', () => {
    it('должен создать нового пользователя', async () => {
      const userId = 12345;
      const name = 'Test User';

      await upsertUser(userId, name);

      expect(db.collection).toHaveBeenCalledWith('max_users');
      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { user_id: userId },
        {
          $setOnInsert: {
            name: name,
            addedAt: expect.any(Date),
          },
        },
        { upsert: true }
      );
    });
  });

  describe('getLastViewCount', () => {
    it('должен вернуть последнее количество просмотров', async () => {
      const userId = 12345;
      const viewCount = 10;

      mockCollection.findOne.mockResolvedValue({
        lastViewCount: viewCount,
      });

      const result = await getLastViewCount(userId);

      expect(mockCollection.findOne).toHaveBeenCalledWith(
        { user_id: userId },
        { projection: { lastViewCount: 1 } }
      );
      expect(result).toBe(viewCount);
    });

    it('должен вернуть 0, если данных нет', async () => {
      const userId = 12345;

      mockCollection.findOne.mockResolvedValue(null);

      const result = await getLastViewCount(userId);

      expect(result).toBe(0);
    });
  });

  describe('saveLastViewCount', () => {
    it('должен сохранить количество просмотров', async () => {
      const userId = 12345;
      const viewCount = 15;

      await saveLastViewCount(userId, viewCount);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { user_id: userId },
        {
          $set: {
            lastViewCount: viewCount,
          },
        },
        { upsert: true }
      );
    });
  });

  describe('getLastMotivationalMessageId', () => {
    it('должен вернуть ID последнего сообщения', async () => {
      const userId = 12345;
      const messageId = 'msg-123';

      mockCollection.findOne.mockResolvedValue({
        lastMotivationalMessageId: messageId,
      });

      const result = await getLastMotivationalMessageId(userId);

      expect(result).toBe(messageId);
    });

    it('должен вернуть null, если сообщения нет', async () => {
      const userId = 12345;

      mockCollection.findOne.mockResolvedValue(null);

      const result = await getLastMotivationalMessageId(userId);

      expect(result).toBeNull();
    });
  });

  describe('saveLastMotivationalMessageId', () => {
    it('должен сохранить ID сообщения', async () => {
      const userId = 12345;
      const messageId = 'msg-456';

      await saveLastMotivationalMessageId(userId, messageId);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { user_id: userId },
        {
          $set: {
            lastMotivationalMessageId: messageId,
            lastMotivationalMessageDate: expect.any(Date),
          },
        },
        { upsert: true }
      );
    });
  });

  describe('getLastMotivationalMessageDate', () => {
    it('должен вернуть дату последнего сообщения', async () => {
      const userId = 12345;
      const date = new Date('2024-01-01');

      mockCollection.findOne.mockResolvedValue({
        lastMotivationalMessageDate: date,
      });

      const result = await getLastMotivationalMessageDate(userId);

      expect(result).toEqual(date);
    });

    it('должен вернуть null, если даты нет', async () => {
      const userId = 12345;

      mockCollection.findOne.mockResolvedValue(null);

      const result = await getLastMotivationalMessageDate(userId);

      expect(result).toBeNull();
    });
  });

  describe('clearLastMotivationalMessage', () => {
    it('должен очистить данные о сообщении', async () => {
      const userId = 12345;

      await clearLastMotivationalMessage(userId);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { user_id: userId },
        {
          $unset: {
            lastMotivationalMessageId: '',
            lastMotivationalMessageDate: '',
          },
        },
        { upsert: false }
      );
    });
  });
});

