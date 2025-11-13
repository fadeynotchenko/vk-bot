import type { FastifyReply, FastifyRequest } from 'fastify';
import { updateMaxCard } from '../../db/db-card-utils.ts';
import type { MaxCardInput } from '../shared/max-card.ts';

/**
 * Проверяет, является ли значение строкой.
 * Type guard для TypeScript.
 * 
 * @param value - значение для проверки
 * @returns true, если значение является строкой
 */
function ensureString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Обрабатывает PUT /update-card.
 * 
 * Принимает multipart/form-data с полями:
 * - card_id (обязательное): ID карточки для обновления
 * - category (опциональное): категория карточки
 * - title (опциональное): заголовок карточки
 * - subtitle (опциональное): краткое описание
 * - text (опциональное): полное описание
 * - status (опциональное): статус карточки (moderate, accepted, rejected)
 * - link (опциональное): ссылка на мероприятие
 * - image (опциональное): файл изображения (PNG, JPG до 5MB)
 * 
 * Успех: отдаёт 200 с обновлённой карточкой.
 * Ошибка: логирует причину и возвращает 400/404/500 с текстом ошибки.
 */
export async function handleUpdateMaxCard(req: FastifyRequest, reply: FastifyReply) {
  try {
    const fields: Record<string, string> = {};
    
    let imageFile: { buffer: Buffer; filename: string; mimetype: string } | null = null;
    
    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const buffer = await part.toBuffer();
        imageFile = {
          buffer,
          filename: part.filename || 'unknown',
          mimetype: part.mimetype || 'application/octet-stream',
        };
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }

    if (!fields.card_id || !ensureString(fields.card_id) || fields.card_id.trim().length === 0) {
      return reply.code(400).send({ ok: false, error: 'Field "card_id" is required' });
    }

    const cardId = fields.card_id.trim();

    let imageBase64: string | undefined;
    if (imageFile) {
      imageBase64 = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
    }

    const updates: Partial<MaxCardInput> = {};
    
    if (ensureString(fields.category) && fields.category.trim().length > 0) {
      updates.category = fields.category.trim();
    }
    if (ensureString(fields.title) && fields.title.trim().length > 0) {
      updates.title = fields.title.trim();
    }
    if (ensureString(fields.subtitle) && fields.subtitle.trim().length > 0) {
      updates.subtitle = fields.subtitle.trim();
    }
    if (ensureString(fields.text) && fields.text.trim().length > 0) {
      updates.text = fields.text.trim();
    }
    if (ensureString(fields.status) && fields.status.trim().length > 0) {
      updates.status = fields.status.trim();
    }
    if (ensureString(fields.link) && fields.link.trim().length > 0) {
      updates.link = fields.link.trim();
    } else if (fields.link === '') {
      // Позволяем очистить поле link, передав пустую строку
      updates.link = '';
    }
    if (imageBase64) {
      updates.image = imageBase64;
    }

    if (Object.keys(updates).length === 0) {
      return reply.code(400).send({ ok: false, error: 'No fields to update' });
    }

    const updatedCard = await updateMaxCard(cardId, updates);
    
    if (!updatedCard) {
      return reply.code(404).send({ ok: false, error: 'Card not found' });
    }
    
    const userId = updatedCard.user_id;
    if (userId) {
      console.log(`✅ Карточка отредактирована для пользователя ${userId}`);
    }
    
    return reply.code(200).send({ ok: true, data: updatedCard });
  } catch (e: any) {
    req.log.error({ method: 'updateMaxCard', error: e?.message, stack: e?.stack }, `Error executing updateMaxCard: ${e?.message ?? 'Unknown error'}`);
    return reply.code(500).send({ ok: false, error: e?.message ?? 'Unknown error' });
  }
}

