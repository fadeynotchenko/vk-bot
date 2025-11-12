import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { getMaxCards, getUserMaxCards, createMaxCard } from '../../db/db-card-utils.ts';
import { db } from '../../db/db-client.ts';

// Мокаем модуль базы данных
vi.mock('../../db/db-client.ts', () => ({
  db: {
    collection: vi.fn(),
  },
}));

describe('db-card-utils', () => {
  let mockCollection: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockCollection = {
      aggregate: vi.fn().mockReturnThis(),
      insertOne: vi.fn(),
      toArray: vi.fn(),
    };
    vi.mocked(db.collection).mockReturnValue(mockCollection as any);
  });

  describe('getMaxCards', () => {
    it('должен вернуть список карточек со статусом accepted', async () => {
      const mockDocs = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          category: 'благотворительность',
          title: 'Карточка 1',
          subtitle: 'Описание 1',
          text: 'Полное описание 1',
          status: 'accepted',
          date: new Date('2024-01-01'),
          view_count: 10,
        },
      ];

      mockCollection.toArray.mockResolvedValue(mockDocs);

      const result = await getMaxCards();

      expect(db.collection).toHaveBeenCalledWith('max_cards');
      expect(mockCollection.aggregate).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '507f1f77bcf86cd799439011',
        category: 'благотворительность',
        title: 'Карточка 1',
        status: 'accepted',
        view_count: 10,
      });
    });

    it('должен вернуть пустой массив, если карточек нет', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      const result = await getMaxCards();

      expect(result).toEqual([]);
    });
  });

  describe('getUserMaxCards', () => {
    it('должен вернуть карточки пользователя', async () => {
      const userId = 12345;
      const mockDocs = [
        {
          _id: new ObjectId('507f1f77bcf86cd799439011'),
          category: 'благотворительность',
          title: 'Моя карточка',
          subtitle: 'Описание',
          text: 'Полное описание',
          status: 'moderate',
          date: new Date('2024-01-01'),
          user_id: userId,
          view_count: 5,
        },
      ];

      mockCollection.toArray.mockResolvedValue(mockDocs);

      const result = await getUserMaxCards(userId);

      expect(db.collection).toHaveBeenCalledWith('max_cards');
      expect(mockCollection.aggregate).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: '507f1f77bcf86cd799439011',
        user_id: userId,
        status: 'moderate',
      });
    });
  });

  describe('createMaxCard', () => {
    it('должен создать новую карточку', async () => {
      const cardInput = {
        category: 'благотворительность',
        title: 'Новая карточка',
        subtitle: 'Описание',
        text: 'Полное описание',
        status: 'moderate',
      };

      const insertedId = new ObjectId('507f1f77bcf86cd799439012');
      mockCollection.insertOne.mockResolvedValue({
        insertedId,
      });

      const result = await createMaxCard(cardInput);

      expect(db.collection).toHaveBeenCalledWith('max_cards');
      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          category: cardInput.category,
          title: cardInput.title,
          subtitle: cardInput.subtitle,
          text: cardInput.text,
          status: cardInput.status,
          date: expect.any(Date),
        })
      );
      expect(result).toMatchObject({
        id: insertedId.toString(),
        ...cardInput,
        date: expect.any(String),
      });
    });

    it('должен создать карточку с дополнительными полями', async () => {
      const cardInput = {
        category: 'благотворительность',
        title: 'Новая карточка',
        subtitle: 'Описание',
        text: 'Полное описание',
        status: 'accepted',
        link: 'https://example.com',
        user_id: 12345,
        image: 'data:image/png;base64,test',
      };

      const insertedId = new ObjectId('507f1f77bcf86cd799439013');
      mockCollection.insertOne.mockResolvedValue({
        insertedId,
      });

      const result = await createMaxCard(cardInput);

      expect(mockCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          link: cardInput.link,
          user_id: cardInput.user_id,
          image: cardInput.image,
        })
      );
      expect(result).toMatchObject({
        id: insertedId.toString(),
        link: cardInput.link,
        user_id: cardInput.user_id,
        image: cardInput.image,
      });
    });
  });
});

