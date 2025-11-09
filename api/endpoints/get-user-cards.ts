import type { FastifyReply, FastifyRequest } from 'fastify';
import { getUserMaxCards } from '../../db/db-card-utils.ts';

/**
 * Обрабатывает GET /user-cards.
 * 
 * Query параметры:
 * - user_id (обязательный): ID пользователя MAX
 *
 * Успех: отдаёт 200 с массивом карточек пользователя.
 * Ошибка: логирует причину и возвращает 400/500 с текстом ошибки.
 */
export async function handleGetUserCards(req: FastifyRequest, reply: FastifyReply) {
  try {
    const query = req.query as { user_id?: string };
    const userIdStr = query.user_id;

    if (!userIdStr) {
      return reply.code(400).send({ ok: false, error: 'user_id query parameter is required' });
    }

    const userId = Number(userIdStr);
    if (isNaN(userId) || userId <= 0) {
      return reply.code(400).send({ ok: false, error: 'user_id must be a positive number' });
    }

    const cards = await getUserMaxCards(userId);
    return reply.code(200).send({ ok: true, data: cards });
  } catch (e: any) {
    req.log.error(e);
    return reply.code(500).send({ ok: false, error: e?.message ?? 'Unknown error' });
  }
}

