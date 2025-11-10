import type { ObjectId, OptionalUnlessRequiredId } from 'mongodb';
import { db } from './db-client.ts';
import type { MaxCard, MaxCardInput } from '../api/shared/max-card.ts';

type MaxCardDocument = Omit<MaxCard, 'id' | 'date'> & {
  _id?: ObjectId;
  date: Date;
  image?: string; // base64 строка изображения
  user_id?: number; // ID пользователя MAX
};

type InsertableMaxCardDocument = OptionalUnlessRequiredId<MaxCardDocument>;

/**
 * Загружает все карточки инициатив из MongoDB со статусом "accepted" и приводит документы к DTO для UI.
 * Оптимизированно получает счетчики просмотров через MongoDB aggregation pipeline.
 * 
 * Карточки сортируются по дате создания в порядке убывания (самые новые первыми).
 * 
 * @returns Массив карточек со статусом "accepted" в формате MaxCard с включенными счетчиками просмотров
 * 
 * Успешное выполнение возвращает массив карточек в удобном формате.
 * В случае ошибки пробрасывает исключение MongoDB, чтобы вызывающий код обработал его.
 */
export async function getMaxCards(): Promise<MaxCard[]> {
  const cardsCollection = db.collection<MaxCardDocument>('max_cards');

  const pipeline = [
    { $match: { status: 'accepted' } },
    { $sort: { date: -1 } },
    {
      $lookup: {
        from: 'card_views',
        let: { cardId: { $toString: '$_id' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$card_id', '$$cardId'],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalViews: { $sum: '$view_count' },
            },
          },
        ],
        as: 'viewStats',
      },
    },
    {
      $addFields: {
        view_count: {
          $ifNull: [{ $arrayElemAt: ['$viewStats.totalViews', 0] }, 0],
        },
      },
    },
    {
      $project: {
        viewStats: 0,
      },
    },
  ];

  const docs = await cardsCollection.aggregate(pipeline).toArray();

  return docs.map((doc) => ({
    id: doc._id ? doc._id.toString() : '',
    category: doc.category,
    title: doc.title,
    subtitle: doc.subtitle,
    text: doc.text,
    status: doc.status,
    date: doc.date.toISOString(),
    view_count: doc.view_count ?? 0,
    ...(doc.link ? { link: doc.link } : {}),
    ...(doc.image ? { image: doc.image } : {}),
    ...(doc.user_id ? { user_id: doc.user_id } : {}),
  }));
}

/**
 * Загружает все карточки инициатив пользователя по user_id из MongoDB.
 * Возвращает карточки со всеми статусами (moderate, accepted, rejected).
 * Оптимизированно получает счетчики просмотров через MongoDB aggregation pipeline.
 * 
 * Карточки сортируются по дате создания в порядке убывания (самые новые первыми).
 * 
 * @param userId - ID пользователя MAX
 * @returns Массив карточек пользователя в формате MaxCard с включенными счетчиками просмотров
 * 
 * Успешное выполнение возвращает массив карточек в удобном формате.
 * В случае ошибки пробрасывает исключение MongoDB, чтобы вызывающий код обработал его.
 */
export async function getUserMaxCards(userId: number): Promise<MaxCard[]> {
  const cardsCollection = db.collection<MaxCardDocument>('max_cards');

  const pipeline = [
    { $match: { user_id: userId } },
    { $sort: { date: -1 } },
    {
      $lookup: {
        from: 'card_views',
        let: { cardId: { $toString: '$_id' } },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ['$card_id', '$$cardId'],
              },
            },
          },
          {
            $group: {
              _id: null,
              totalViews: { $sum: '$view_count' },
            },
          },
        ],
        as: 'viewStats',
      },
    },
    {
      $addFields: {
        view_count: {
          $ifNull: [{ $arrayElemAt: ['$viewStats.totalViews', 0] }, 0],
        },
      },
    },
    {
      $project: {
        viewStats: 0,
      },
    },
  ];

  const docs = await cardsCollection.aggregate(pipeline).toArray();

  return docs.map((doc) => ({
    id: doc._id ? doc._id.toString() : '',
    category: doc.category,
    title: doc.title,
    subtitle: doc.subtitle,
    text: doc.text,
    status: doc.status,
    date: doc.date.toISOString(),
    view_count: doc.view_count ?? 0,
    ...(doc.link ? { link: doc.link } : {}),
    ...(doc.image ? { image: doc.image } : {}),
    ...(doc.user_id ? { user_id: doc.user_id } : {}),
  }));
}

/**
 * Создаёт новую карточку инициативы в MongoDB из данных, пришедших с UI/бота.
 * 
 * Автоматически устанавливает дату создания карточки на текущее время.
 * 
 * @param card - данные карточки для создания (без id и date, они генерируются автоматически)
 * @returns Созданная карточка с присвоенным ID и датой создания
 * 
 * В случае неуспеха пробрасывает исключение MongoDB.
 */
export async function createMaxCard(card: MaxCardInput): Promise<MaxCard> {
  const document: InsertableMaxCardDocument = {
    category: card.category,
    title: card.title,
    subtitle: card.subtitle,
    text: card.text,
    status: card.status,
    date: new Date(),
    ...(card.link ? { link: card.link } : {}),
    ...(card.image ? { image: card.image } : {}),
    ...(card.user_id ? { user_id: card.user_id } : {}),
  };

  const result = await db.collection<MaxCardDocument>('max_cards').insertOne(document);

  return {
    id: result.insertedId.toString(),
    ...card,
    date: document.date.toISOString(),
  };
}
