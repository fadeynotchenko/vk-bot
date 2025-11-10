import type { FastifyReply, FastifyRequest } from 'fastify';
import { getMaxCards } from '../../db/db-card-utils.ts';

/**
 * Обрабатывает GET /max-cards.
 *
 * Успех: отдаёт 200 с массивом карточек.
 * Ошибка: логирует причину и возвращает 500 с текстом ошибки.
 */
export async function handleGetMaxCards(req: FastifyRequest, reply: FastifyReply) {
  try {
    const cards = await getMaxCards();
    
    req.log.info({ method: 'getMaxCards', count: cards.length }, 'Successfully executed getMaxCards');
    
    return reply.code(200).send({ ok: true, data: cards });
  } catch (e: any) {
    req.log.error({ method: 'getMaxCards', error: e?.message, stack: e?.stack }, `Error executing getMaxCards: ${e?.message ?? 'Unknown error'}`);
    return reply.code(500).send({ ok: false, error: e?.message ?? 'Unknown error' });
  }
}
