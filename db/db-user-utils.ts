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
}

/**
 * Получает последнее сохраненное количество просмотров пользователя.
 * 
 * @param user_id - идентификатор пользователя
 * @returns Последнее количество просмотров или 0, если данных нет
 */
export async function getLastViewCount(user_id: number): Promise<number> {
  const user = await db.collection('max_users').findOne(
    { user_id: user_id },
    { projection: { lastViewCount: 1 } }
  );
  
  return (user?.lastViewCount as number) || 0;
}

/**
 * Сохраняет текущее количество просмотров пользователя.
 * 
 * @param user_id - идентификатор пользователя
 * @param viewCount - текущее количество просмотров
 */
export async function saveLastViewCount(user_id: number, viewCount: number): Promise<void> {
  await db.collection('max_users').updateOne(
    { user_id: user_id },
    {
      $set: {
        lastViewCount: viewCount,
      }
    },
    { upsert: true }
  );
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
 */
export async function saveLastMotivationalMessageId(user_id: number, messageId: string): Promise<void> {
  await db.collection('max_users').updateOne(
    { user_id: user_id },
    {
      $set: {
        lastMotivationalMessageId: messageId,
        lastMotivationalMessageDate: new Date(),
      }
    },
    { upsert: true }
  );
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
      }
    },
    { upsert: false }
  );
}
