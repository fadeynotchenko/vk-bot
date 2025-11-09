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
 *
 * Успешное выполнение возвращает массив карточек в удобном формате.
 * В случае ошибки пробрасывает исключение MongoDB, чтобы вызывающий код обработал его.
 */
export async function getMaxCards(): Promise<MaxCard[]> {
  const docs = await db.collection<MaxCardDocument>('max_cards')
    .find({ status: 'accepted' })
    .sort({ date: -1 })
    .toArray();
  return docs.map((doc) => ({
    id: doc._id ? doc._id.toString() : '',
    category: doc.category,
    title: doc.title,
    subtitle: doc.subtitle,
    text: doc.text,
    status: doc.status,
    date: doc.date.toISOString(),
    ...(doc.link ? { link: doc.link } : {}),
    ...(doc.image ? { image: doc.image } : {}),
    ...(doc.user_id ? { user_id: doc.user_id } : {}),
  }));
}

/**
 * Загружает все карточки инициатив пользователя по user_id из MongoDB.
 * Возвращает карточки со всеми статусами (moderate, accepted, rejected).
 *
 * Успешное выполнение возвращает массив карточек в удобном формате.
 * В случае ошибки пробрасывает исключение MongoDB, чтобы вызывающий код обработал его.
 */
export async function getUserMaxCards(userId: number): Promise<MaxCard[]> {
  const docs = await db.collection<MaxCardDocument>('max_cards')
    .find({ user_id: userId })
    .sort({ date: -1 })
    .toArray();
  return docs.map((doc) => ({
    id: doc._id ? doc._id.toString() : '',
    category: doc.category,
    title: doc.title,
    subtitle: doc.subtitle,
    text: doc.text,
    status: doc.status,
    date: doc.date.toISOString(),
    ...(doc.link ? { link: doc.link } : {}),
    ...(doc.image ? { image: doc.image } : {}),
    ...(doc.user_id ? { user_id: doc.user_id } : {}),
  }));
}

/**
 * Создаёт новую карточку инициативы в MongoDB из данных, пришедших с UI/бота.
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
