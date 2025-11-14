import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  upsertUser,
  getLastViewCount,
  saveLastViewCount,
} from '../../db/db-user-utils.ts';
import { db } from '../../db/db-client.ts';

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

});

