import type { FastifyReply, FastifyRequest } from 'fastify';
import { deleteMaxCard } from '../../db/db-card-utils.ts';

/**
 * Обрабатывает DELETE /delete-card.
 * 
 * Принимает query параметр:
 * - card_id (обязательное): ID карточки для удаления
 * 
 * Успех: отдаёт 200 с { ok: true }.
 * Ошибка: логирует причину и возвращает 400/404/500 с текстом ошибки.
 */
export async function handleDeleteMaxCard(req: FastifyRequest, reply: FastifyReply) {
  try {
    const query = req.query as { card_id?: string };
    
    if (!query.card_id || typeof query.card_id !== 'string' || query.card_id.trim().length === 0) {
      return reply.code(400).send({ ok: false, error: 'Field "card_id" is required' });
    }

    const cardId = query.card_id.trim();
    const deleted = await deleteMaxCard(cardId);
    
    if (!deleted) {
      return reply.code(404).send({ ok: false, error: 'Card not found' });
    }
    
    req.log.info({ method: 'deleteMaxCard', card_id: cardId }, `Successfully deleted card: ${cardId}`);
    
    return reply.code(200).send({ ok: true });
  } catch (e: any) {
    req.log.error({ method: 'deleteMaxCard', error: e?.message, stack: e?.stack }, `Error executing deleteMaxCard: ${e?.message ?? 'Unknown error'}`);
    return reply.code(500).send({ ok: false, error: e?.message ?? 'Unknown error' });
  }
}

