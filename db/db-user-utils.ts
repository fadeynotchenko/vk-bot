import type { User } from '@maxhub/max-bot-api/types';
import { db } from './db-client.ts';

/**
 * Добавляет пользователя в MongoDB только один раз.
 * 
 * Если запись с таким `user_id` уже есть — счётчик не меняется.
 * Если записи нет — создаётся документ с именем и датой добавления.
 * 
 * @param user_id - идентификатор пользователя ВКонтакте
 * @param name - отображаемое имя пользователя
 */
export async function upsertUser(user_id: number, name: string) {
  await db.collection('max_users').updateOne(
    { user_id: user_id },
    {
      $setOnInsert: {
        name: name,
        addedAt: new Date(),
      }
    },
    { upsert: true }
  );
  console.log(`✅ Пользователь ${user_id} добавлен или обновлен в базе данных`);
}

/**
 * Получает количество просмотров на момент последнего вызова команды /stats.
 * 
 * @param user_id - идентификатор пользователя
 * @returns Количество просмотров на момент последнего вызова или 0, если данных нет
 */
export async function getLastStatsViewCount(user_id: number): Promise<number> {
  const user = await db.collection('max_users').findOne(
    { user_id: user_id },
    { projection: { lastStatsViewCount: 1 } }
  );
  
  return (user?.lastStatsViewCount as number) || 0;
}

/**
 * Сохраняет количество просмотров на момент вызова команды /stats.
 * 
 * @param user_id - идентификатор пользователя
 * @param viewCount - текущее количество просмотров
 */
export async function saveLastStatsViewCount(user_id: number, viewCount: number): Promise<void> {
  await db.collection('max_users').updateOne(
    { user_id: user_id },
    {
      $set: {
        lastStatsViewCount: viewCount,
        lastStatsDate: new Date(),
      }
    },
    { upsert: true }
  );
  console.log(`✅ Сохранено количество просмотров для статистики пользователя ${user_id}: ${viewCount}`);
}

/**
 * Получает ID последнего отправленного мотивационного сообщения для пользователя.
 * 
 * @param user_id - идентификатор пользователя
 * @returns ID сообщения или null, если сообщение не было отправлено
 */
export async function getLastMotivationalMessageId(user_id: number): Promise<string | null> {
  const user = await db.collection('max_users').findOne(
    { user_id: user_id },
    { projection: { lastMotivationalMessageId: 1 } }
  );
  
  return (user?.lastMotivationalMessageId as string) || null;
}

/**
 * Сохраняет ID последнего отправленного мотивационного сообщения для пользователя.
 * 
 * @param user_id - идентификатор пользователя
 * @param messageId - ID сообщения
 * @param messageText - текст сообщения
 */
export async function saveLastMotivationalMessageId(user_id: number, messageId: string, messageText?: string): Promise<void> {
  await db.collection('max_users').updateOne(
    { user_id: user_id },
    {
      $set: {
        lastMotivationalMessageId: messageId,
        lastMotivationalMessageDate: new Date(),
        ...(messageText ? { lastMotivationalMessageText: messageText } : {}),
      }
    },
    { upsert: true }
  );
  console.log(`✅ Сохранен ID мотивационного сообщения для пользователя ${user_id}: ${messageId}`);
}

/**
 * Получает текст последнего отправленного мотивационного сообщения для пользователя.
 * 
 * @param user_id - идентификатор пользователя
 * @returns Текст сообщения или null, если сообщение не было отправлено
 */
export async function getLastMotivationalMessageText(user_id: number): Promise<string | null> {
  const user = await db.collection('max_users').findOne(
    { user_id: user_id },
    { projection: { lastMotivationalMessageText: 1 } }
  );
  
  return (user?.lastMotivationalMessageText as string) || null;
}

/**
 * Получает дату последнего отправленного мотивационного сообщения для пользователя.
 * 
 * @param user_id - идентификатор пользователя
 * @returns Дата последнего сообщения или null, если сообщение не было отправлено
 */
export async function getLastMotivationalMessageDate(user_id: number): Promise<Date | null> {
  const user = await db.collection('max_users').findOne(
    { user_id: user_id },
    { projection: { lastMotivationalMessageDate: 1 } }
  );
  
  if (user?.lastMotivationalMessageDate) {
    return user.lastMotivationalMessageDate instanceof Date 
      ? user.lastMotivationalMessageDate 
      : new Date(user.lastMotivationalMessageDate);
  }
  
  return null;
}

/**
 * Очищает данные о последнем мотивационном сообщении для пользователя.
 * Используется при перезапуске диалога (bot_started), когда старые сообщения больше не существуют.
 * 
 * @param user_id - идентификатор пользователя
 */
export async function clearLastMotivationalMessage(user_id: number): Promise<void> {
  await db.collection('max_users').updateOne(
    { user_id: user_id },
    {
      $unset: {
        lastMotivationalMessageId: '',
        lastMotivationalMessageDate: '',
        lastMotivationalMessageText: '',
      }
    },
    { upsert: false }
  );
  console.log(`✅ Очищены данные о мотивационном сообщении для пользователя ${user_id}`);
}

/**
 * Тип для топ пользователя
 */
export type TopUser = {
  user_id: number;
  name: string;
  cards_count: number;
  total_views: number;
};

/**
 * Тип для топ пользователя по просмотрам
 */
export type TopUserByViews = {
  user_id: number;
  name: string;
  total_views: number;
};

/**
 * Получает топ пользователей по количеству созданных инициатив со статусом "accepted".
 * 
 * Возвращает до указанного количества пользователей с наибольшим количеством инициатив.
 * Также включает общее количество просмотров всех инициатив пользователя.
 * 
 * @param limit - максимальное количество пользователей в топе (по умолчанию 10)
 * @returns Массив пользователей, отсортированных по количеству инициатив (по убыванию)
 * 
 * Успешное выполнение возвращает массив пользователей с количеством инициатив и просмотров.
 * В случае ошибки пробрасывает исключение MongoDB.
 */
export async function getTopUsersByCards(limit: number = 10): Promise<TopUser[]> {
  const cardsCollection = db.collection('max_cards');
  const usersCollection = db.collection('max_users');

  // Получаем топ пользователей по количеству карточек со статусом "accepted"
  // и одновременно считаем общее количество просмотров их карточек
  const pipeline = [
    { $match: { status: 'accepted', user_id: { $exists: true, $ne: null } } },
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
        card_views: {
          $ifNull: [{ $arrayElemAt: ['$viewStats.totalViews', 0] }, 0],
        },
      },
    },
    {
      $group: {
        _id: '$user_id',
        cards_count: { $sum: 1 },
        total_views: { $sum: '$card_views' },
      },
    },
    { $sort: { cards_count: -1, total_views: -1 } },
    { $limit: limit },
  ];

  const topUsersData = await cardsCollection.aggregate(pipeline).toArray();

  if (topUsersData.length === 0) {
    console.log(`ℹ️ Топ пользователей по карточкам пуст (лимит: ${limit})`);
    return [];
  }

  // Получаем имена пользователей
  const userIds = topUsersData.map((item: any) => item._id);
  const users = await usersCollection
    .find({ user_id: { $in: userIds } })
    .toArray();

  const userMap = new Map<number, string>();
  users.forEach((user: any) => {
    userMap.set(user.user_id, user.name || `Пользователь ${user.user_id}`);
  });

  // Формируем результат
  const result = topUsersData.map((item: any) => {
    const userId = item._id;
    const userName = userMap.get(userId) || `Пользователь ${userId}`;
    
    return {
      user_id: userId,
      name: userName,
      cards_count: item.cards_count,
      total_views: item.total_views || 0,
    };
  });
  
  console.log(`✅ Получен топ пользователей по карточкам: ${result.length} пользователей`);
  return result;
}

/**
 * Получает топ пользователей по количеству просмотров карточек (когда они сами просматривали).
 * 
 * Возвращает до указанного количества пользователей с наибольшим количеством просмотров.
 * 
 * @param limit - максимальное количество пользователей в топе (по умолчанию 5)
 * @returns Массив пользователей, отсортированных по количеству просмотров (по убыванию)
 * 
 * Успешное выполнение возвращает массив пользователей с количеством просмотров.
 * В случае ошибки пробрасывает исключение MongoDB.
 */
export async function getTopUsersByViews(limit: number = 5): Promise<TopUserByViews[]> {
  const viewsCollection = db.collection('card_views');
  const usersCollection = db.collection('max_users');

  // Получаем топ пользователей по сумме всех просмотров
  const pipeline = [
    {
      $group: {
        _id: '$user_id',
        total_views: { $sum: '$view_count' },
      },
    },
    { $sort: { total_views: -1 } },
    { $limit: limit },
  ];

  const topUsersData = await viewsCollection.aggregate(pipeline).toArray();

  if (topUsersData.length === 0) {
    console.log(`ℹ️ Топ пользователей по просмотрам пуст (лимит: ${limit})`);
    return [];
  }

  // Получаем имена пользователей
  const userIds = topUsersData.map((item: any) => item._id);
  const users = await usersCollection
    .find({ user_id: { $in: userIds } })
    .toArray();

  const userMap = new Map<number, string>();
  users.forEach((user: any) => {
    userMap.set(user.user_id, user.name || `Пользователь ${user.user_id}`);
  });

  // Формируем результат
  const result = topUsersData.map((item: any) => {
    const userId = item._id;
    const userName = userMap.get(userId) || `Пользователь ${userId}`;
    
    return {
      user_id: userId,
      name: userName,
      total_views: item.total_views || 0,
    };
  });
  
  console.log(`✅ Получен топ пользователей по просмотрам: ${result.length} пользователей`);
  return result;
}
