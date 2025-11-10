import type { FastifyReply, FastifyRequest } from 'fastify';
import { getUserViewedCardIds } from '../../db/db-card-views-utils.ts';

/**
 * Обрабатывает GET /viewed-cards.
 * 
 * Query параметры:
 * - user_id (обязательный): ID пользователя MAX
 *
 * Успех: отдаёт 200 с массивом ID просмотренных карточек.
 * Ошибка: логирует причину и возвращает 400/500 с текстом ошибки.
 */
export async function handleGetViewedCards(req: FastifyRequest, reply: FastifyReply) {
  try {
    const query = req.query as { user_id?: string };
    const userIdStr = query.user_id;

    if (!userIdStr) {
      req.log.warn({ method: 'getViewedCards' }, 'getViewedCards: missing user_id query parameter');
      return reply.code(400).send({ ok: false, error: 'user_id query parameter is required' });
    }

    const userId = Number(userIdStr);
    if (isNaN(userId) || userId <= 0) {
      req.log.warn({ method: 'getViewedCards', user_id: userIdStr }, 'getViewedCards: invalid user_id');
      return reply.code(400).send({ ok: false, error: 'user_id must be a positive number' });
    }

    const viewedCardIds = await getUserViewedCardIds(userId);
    
    req.log.info({ method: 'getViewedCards', user_id: userId, count: viewedCardIds.length }, `Successfully executed getViewedCards for user: ${userId}`);
    
    return reply.code(200).send({ ok: true, data: viewedCardIds });
  } catch (e: any) {
    const query = req.query as { user_id?: string };
    req.log.error({ method: 'getViewedCards', user_id: query.user_id, error: e?.message, stack: e?.stack }, `Error executing getViewedCards: ${e?.message ?? 'Unknown error'}`);
    return reply.code(500).send({ ok: false, error: e?.message ?? 'Unknown error' });
  }
}

