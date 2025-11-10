import type { FastifyReply, FastifyRequest } from 'fastify';
import { createMaxCard } from '../../db/db-card-utils.ts';
import type { MaxCardCreatePayload, MaxCardInput } from '../shared/max-card.ts';

const REQUIRED_FIELDS: Array<keyof MaxCardCreatePayload> = ['category', 'title', 'subtitle', 'text', 'status'];

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
 * Обрабатывает POST /create-card.
 * 
 * Принимает multipart/form-data с полями:
 * - category (обязательное): категория карточки
 * - title (обязательное): заголовок карточки
 * - subtitle (обязательное): краткое описание
 * - text (обязательное): полное описание
 * - status (обязательное): статус карточки (moderate, accepted, rejected)
 * - link (опциональное): ссылка на мероприятие
 * - user_id (опциональное): ID пользователя MAX
 * - image (опциональное): файл изображения (PNG, JPG до 5MB)
 * 
 * Успех: отдаёт 201 с созданной карточкой.
 * Ошибка: логирует причину и возвращает 400/500 с текстом ошибки.
 */
export async function handleCreateMaxCard(req: FastifyRequest, reply: FastifyReply) {
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

    for (const field of REQUIRED_FIELDS) {
      const value = fields[field];
      if (!ensureString(value) || value.trim().length === 0) {
        return reply.code(400).send({ ok: false, error: `Field "${field}" is required` });
      }
    }

    let imageBase64: string | undefined;
    if (imageFile) {
      imageBase64 = `data:${imageFile.mimetype};base64,${imageFile.buffer.toString('base64')}`;
    }

    let userId: number | undefined;
    if (fields.user_id) {
      const parsedUserId = Number(fields.user_id);
      if (!isNaN(parsedUserId) && parsedUserId > 0) {
        userId = parsedUserId;
      }
    }

    const payload: MaxCardInput = {
      category: fields.category!.trim(),
      title: fields.title!.trim(),
      subtitle: fields.subtitle!.trim(),
      text: fields.text!.trim(),
      status: fields.status!.trim(),
      ...(ensureString(fields.link) && fields.link.trim().length > 0 ? { link: fields.link.trim() } : {}),
      ...(imageBase64 ? { image: imageBase64 } : {}),
      ...(userId ? { user_id: userId } : {}),
    };

    const card = await createMaxCard(payload);
    
    req.log.info({ method: 'createMaxCard', user_id: userId, card_id: card.id }, `Successfully executed createMaxCard for user: ${userId ?? 'anonymous'}`);
    
    return reply.code(201).send({ ok: true, data: card });
  } catch (e: any) {
    req.log.error({ method: 'createMaxCard', error: e?.message, stack: e?.stack }, `Error executing createMaxCard: ${e?.message ?? 'Unknown error'}`);
    return reply.code(500).send({ ok: false, error: e?.message ?? 'Unknown error' });
  }
}
