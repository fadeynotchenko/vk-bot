import type { FastifyReply, FastifyRequest } from 'fastify';
import { checkAndSendMotivationalMessage } from '../../bot/handlers/motivational-messages.ts';
import { bot } from '../../bot/bot.ts';

type OnAppCloseBody = {
  user_id: number;
};

/**
 * Обрабатывает POST /on-app-close.
 * 
 * Принимает JSON body с полями:
 * - user_id (обязательное): ID пользователя MAX, который закрыл мини-приложение
 * 
 * Проверяет общее количество просмотров пользователя и отправляет мотивационное сообщение
 * при достижении определённых порогов (3, 5, 10, 20 просмотров всех карточек).
 *
 * Успех: отдаёт 200 с подтверждением { ok: true }.
 * Ошибка: логирует причину и возвращает 400/500 с текстом ошибки.
 */
export async function handleOnAppClose(req: FastifyRequest, reply: FastifyReply) {
  try {
    let user_id: number | undefined;

    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('multipart/form-data') || req.isMultipart()) {
      try {
        const parts = req.parts();
        for await (const part of parts) {
          if (part.type === 'field' && part.fieldname === 'user_id') {
            user_id = Number(part.value);
            break;
          }
        }
      } catch (parseError: any) {
        req.log.error({ method: 'onAppClose', error: parseError?.message }, 'Failed to parse FormData body');
        try {
          const body = req.body as any;
          user_id = body?.user_id;
        } catch (fallbackError) {
          req.log.error({ method: 'onAppClose', error: fallbackError }, 'Fallback parsing also failed');
        }
      }
    } else {
      const body = req.body as any;
      user_id = body?.user_id;
    }

    if (!user_id || isNaN(user_id) || user_id <= 0) {
      req.log.warn({ method: 'onAppClose', content_type: contentType, user_id }, 'App close event received without valid user_id');
      return reply.code(400).send({ ok: false, error: 'user_id is required and must be a positive number' });
    }

    checkAndSendMotivationalMessage(bot, user_id)
      .then(() => {
        req.log.info({ method: 'onAppClose', user_id }, `Successfully executed onAppClose for user: ${user_id}`);
      })
      .catch((err) => {
        req.log.error({ method: 'onAppClose', user_id, error: err?.message, stack: err?.stack }, `Error executing onAppClose for user ${user_id}: ${err?.message ?? 'Unknown error'}`);
      });

    return reply.code(200).send({ ok: true });
  } catch (e: any) {
    req.log.error({ method: 'onAppClose', error: e?.message, stack: e?.stack }, `Error executing onAppClose: ${e?.message ?? 'Unknown error'}`);
    return reply.code(500).send({ ok: false, error: e?.message ?? 'Unknown error' });
  }
}

