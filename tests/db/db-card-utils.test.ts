import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { getMaxCards, getUserMaxCards, createMaxCard, updateMaxCard, deleteMaxCard } from '../../db/db-card-utils.ts';
import { db } from '../../db/db-client.ts';

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
      findOneAndUpdate: vi.fn(),
      deleteOne: vi.fn(),
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

  describe('updateMaxCard', () => {
    it('должен обновить существующую карточку', async () => {
      const cardId = '507f1f77bcf86cd799439011';
      const updates = {
        title: 'Обновленное название',
        status: 'accepted' as const,
      };

      const updatedDoc = {
        _id: new ObjectId(cardId),
        category: 'благотворительность',
        title: 'Обновленное название',
        subtitle: 'Описание',
        text: 'Полное описание',
        status: 'accepted',
        date: new Date('2024-01-01'),
        view_count: 5,
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(updatedDoc);
      
      const mockViewsCollection = {
        aggregate: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([{ totalViews: 5 }]),
      };
      vi.mocked(db.collection).mockImplementation((name: string) => {
        if (name === 'card_views') {
          return mockViewsCollection as any;
        }
        return mockCollection as any;
      });

      const result = await updateMaxCard(cardId, updates);

      expect(db.collection).toHaveBeenCalledWith('max_cards');
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $set: expect.objectContaining({ title: updates.title, status: updates.status }) },
        { returnDocument: 'after' }
      );
      expect(result).not.toBeNull();
      expect(result).toMatchObject({
        id: cardId,
        title: 'Обновленное название',
        status: 'accepted',
        view_count: 5,
      });
    });

    it('должен вернуть null, если карточка не найдена', async () => {
      const cardId = '507f1f77bcf86cd799439011';
      const updates = { title: 'Новое название' };

      mockCollection.findOneAndUpdate.mockResolvedValue(null);

      const result = await updateMaxCard(cardId, updates);

      expect(result).toBeNull();
    });

    it('должен вернуть null для невалидного ObjectId', async () => {
      const invalidCardId = 'invalid-id';
      const updates = { title: 'Новое название' };

      const result = await updateMaxCard(invalidCardId, updates);

      expect(result).toBeNull();
      expect(mockCollection.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('должен обновить только указанные поля', async () => {
      const cardId = '507f1f77bcf86cd799439011';
      const updates = {
        category: 'волонтерство',
      };

      const updatedDoc = {
        _id: new ObjectId(cardId),
        category: 'волонтерство',
        title: 'Старое название',
        subtitle: 'Описание',
        text: 'Полное описание',
        status: 'moderate',
        date: new Date('2024-01-01'),
      };

      mockCollection.findOneAndUpdate.mockResolvedValue(updatedDoc);
      
      const mockViewsCollection = {
        aggregate: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([{ totalViews: 0 }]),
      };
      vi.mocked(db.collection).mockImplementation((name: string) => {
        if (name === 'card_views') {
          return mockViewsCollection as any;
        }
        return mockCollection as any;
      });

      const result = await updateMaxCard(cardId, updates);

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(cardId) },
        { $set: expect.objectContaining({ category: 'волонтерство' }) },
        { returnDocument: 'after' }
      );
      expect(result).not.toBeNull();
      expect(result?.category).toBe('волонтерство');
    });
  });

  describe('deleteMaxCard', () => {
    it('должен удалить существующую карточку', async () => {
      const cardId = '507f1f77bcf86cd799439011';

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1,
      });

      const result = await deleteMaxCard(cardId);

      expect(db.collection).toHaveBeenCalledWith('max_cards');
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({
        _id: new ObjectId(cardId),
      });
      expect(result).toBe(true);
    });

    it('должен вернуть false, если карточка не найдена', async () => {
      const cardId = '507f1f77bcf86cd799439011';

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 0,
      });

      const result = await deleteMaxCard(cardId);

      expect(result).toBe(false);
    });

    it('должен вернуть false для невалидного ObjectId', async () => {
      const invalidCardId = 'invalid-id';

      const result = await deleteMaxCard(invalidCardId);

      expect(result).toBe(false);
      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    });

    it('не должен удалять связанные просмотры при удалении карточки', async () => {
      const cardId = '507f1f77bcf86cd799439011';

      mockCollection.deleteOne.mockResolvedValue({
        deletedCount: 1,
      });

      const mockViewsCollection = {
        deleteMany: vi.fn(),
      };
      vi.mocked(db.collection).mockImplementation((name: string) => {
        if (name === 'card_views') {
          return mockViewsCollection as any;
        }
        return mockCollection as any;
      });

      await deleteMaxCard(cardId);

      expect(mockViewsCollection.deleteMany).not.toHaveBeenCalled();
    });
  });
});

