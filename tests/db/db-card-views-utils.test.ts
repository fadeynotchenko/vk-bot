import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  trackCardView,
  getUserViewedCardIds,
  getCardViewCount,
  getUserTotalViewCount,
} from '../../db/db-card-views-utils.ts';
import { db } from '../../db/db-client.ts';

vi.mock('../../db/db-client.ts', () => ({
  db: {
    collection: vi.fn(),
  },
}));

describe('db-card-views-utils', () => {
  let mockCollection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection = {
      findOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      find: vi.fn().mockReturnThis(),
      aggregate: vi.fn().mockReturnThis(),
      project: vi.fn().mockReturnThis(),
      toArray: vi.fn(),
    };
    vi.mocked(db.collection).mockReturnValue(mockCollection as any);
  });

  describe('trackCardView', () => {
    it('должен создать новую запись о просмотре', async () => {
      const cardId = 'card-123';
      const userId = 456;

      mockCollection.findOne.mockResolvedValue(null);
      mockCollection.findOneAndUpdate.mockResolvedValue({
        view_count: 1,
      });

      const result = await trackCardView(cardId, userId);

      expect(mockCollection.findOne).toHaveBeenCalledWith({
        card_id: cardId,
        user_id: userId,
      });
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { card_id: cardId, user_id: userId },
        {
          $set: {
            viewed_at: expect.any(Date),
            view_count: 1,
          },
        },
        {
          upsert: true,
          returnDocument: 'after',
        }
      );
      expect(result).toBe(1);
    });

    it('должен увеличить счетчик существующего просмотра', async () => {
      const cardId = 'card-123';
      const userId = 456;
      const existingView = {
        card_id: cardId,
        user_id: userId,
        view_count: 5,
      };

      mockCollection.findOne.mockResolvedValue(existingView);
      mockCollection.findOneAndUpdate.mockResolvedValue({
        view_count: 6,
      });

      const result = await trackCardView(cardId, userId);

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { card_id: cardId, user_id: userId },
        {
          $set: {
            viewed_at: expect.any(Date),
          },
          $inc: {
            view_count: 1,
          },
        },
        {
          returnDocument: 'after',
        }
      );
      expect(result).toBe(6);
    });
  });

  describe('getUserViewedCardIds', () => {
    it('должен вернуть массив ID просмотренных карточек', async () => {
      const userId = 456;
      const mockViews = [
        { card_id: 'card-1' },
        { card_id: 'card-2' },
        { card_id: 'card-3' },
      ];

      mockCollection.toArray.mockResolvedValue(mockViews);

      const result = await getUserViewedCardIds(userId);

      expect(mockCollection.find).toHaveBeenCalledWith({ user_id: userId });
      expect(mockCollection.project).toHaveBeenCalledWith({ card_id: 1 });
      expect(result).toEqual(['card-1', 'card-2', 'card-3']);
    });

    it('должен вернуть пустой массив, если просмотров нет', async () => {
      const userId = 456;

      mockCollection.toArray.mockResolvedValue([]);

      const result = await getUserViewedCardIds(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getCardViewCount', () => {
    it('должен вернуть количество просмотров карточки', async () => {
      const cardId = 'card-123';
      const userId = 456;
      const viewCount = 10;

      mockCollection.findOne.mockResolvedValue({
        view_count: viewCount,
      });

      const result = await getCardViewCount(cardId, userId);

      expect(mockCollection.findOne).toHaveBeenCalledWith(
        { card_id: cardId, user_id: userId },
        { projection: { view_count: 1 } }
      );
      expect(result).toBe(viewCount);
    });

    it('должен вернуть 0, если просмотра нет', async () => {
      const cardId = 'card-123';
      const userId = 456;

      mockCollection.findOne.mockResolvedValue(null);

      const result = await getCardViewCount(cardId, userId);

      expect(result).toBe(0);
    });
  });

  describe('getUserTotalViewCount', () => {
    it('должен вернуть общее количество просмотров пользователя', async () => {
      const userId = 456;
      const totalViews = 25;

      mockCollection.toArray.mockResolvedValue([{ total: totalViews }]);

      const result = await getUserTotalViewCount(userId);

      expect(mockCollection.aggregate).toHaveBeenCalled();
      expect(result).toBe(totalViews);
    });

    it('должен вернуть 0, если просмотров нет', async () => {
      const userId = 456;

      mockCollection.toArray.mockResolvedValue([]);

      const result = await getUserTotalViewCount(userId);

      expect(result).toBe(0);
    });
  });
});

