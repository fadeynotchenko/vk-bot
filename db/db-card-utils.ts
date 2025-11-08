import type { ObjectId, OptionalUnlessRequiredId } from 'mongodb';
import { db } from './db-client.ts';
import type { MaxCard, MaxCardInput } from '../api/shared/max-card.ts';

type MaxCardDocument = Omit<MaxCard, 'id' | 'date'> & {
  _id?: ObjectId;
  date: Date;
};

type InsertableMaxCardDocument = OptionalUnlessRequiredId<MaxCardDocument>;

/**
 * Загружает все карточки инициатив из MongoDB и приводит документы к DTO для UI.
 *
 * Успешное выполнение возвращает массив карточек в удобном формате.
 * В случае ошибки пробрасывает исключение MongoDB, чтобы вызывающий код обработал его.
 */
export async function getMaxCards(): Promise<MaxCard[]> {
  const docs = await db.collection<MaxCardDocument>('max_cards').find().sort({ date: -1 }).toArray();
  return docs.map((doc) => ({
    id: doc._id ? doc._id.toString() : '',
    category: doc.category,
    title: doc.title,
    subtitle: doc.subtitle,
    text: doc.text,
    status: doc.status,
    date: doc.date.toISOString(),
    ...(doc.link ? { link: doc.link } : {}),
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
  };

  const result = await db.collection<MaxCardDocument>('max_cards').insertOne(document);

  return {
    id: result.insertedId.toString(),
    ...card,
    date: document.date.toISOString(),
  };
}
