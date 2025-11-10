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

    // Поддержка sendBeacon (отправляет FormData) и обычного JSON
    const contentType = req.headers['content-type'] || '';
    
    req.log.info(`📥 Received app close request (content-type: ${contentType})`);
    
    if (contentType.includes('multipart/form-data') || req.isMultipart()) {
      // sendBeacon отправляет FormData через multipart
      // Fastify multipart парсит FormData автоматически через req.parts()
      try {
        const parts = req.parts();
        for await (const part of parts) {
          if (part.type === 'field' && part.fieldname === 'user_id') {
            user_id = Number(part.value);
            req.log.info(`✅ Parsed user_id from FormData: ${user_id}`);
            break;
          }
        }
      } catch (parseError: any) {
        req.log.error(`❌ Failed to parse FormData body: ${parseError?.message || parseError}`);
        // Пробуем прочитать как обычный body в случае ошибки
        try {
          const body = req.body as any;
          user_id = body?.user_id;
          if (user_id) {
            req.log.info(`✅ Fallback: parsed user_id from body: ${user_id}`);
          }
        } catch (fallbackError) {
          req.log.error(`❌ Fallback parsing also failed: ${fallbackError}`);
        }
      }
    } else {
      // Обычный JSON запрос - Fastify уже распарсил body
      const body = req.body as any;
      user_id = body?.user_id;
      req.log.info(`✅ Parsed user_id from JSON: ${user_id}`);
    }

    if (!user_id || isNaN(user_id) || user_id <= 0) {
      req.log.warn(`⚠️ App close event received without valid user_id (content-type: ${contentType}, user_id: ${user_id})`);
      return reply.code(400).send({ ok: false, error: 'user_id is required and must be a positive number' });
    }

    req.log.info(`📱 App closed event received for user ${user_id}`);

    // Проверяем общее количество просмотров и отправляем мотивационное сообщение при достижении порогов
    // Отправляем асинхронно, не блокируя ответ
    checkAndSendMotivationalMessage(bot, user_id)
      .then(() => {
        req.log.info(`✅ Successfully processed motivational message for user ${user_id}`);
      })
      .catch((err) => {
        req.log.error(`❌ Failed to check/send motivational message for user ${user_id}:`, err);
        // Логируем полную информацию об ошибке
        if (err instanceof Error) {
          req.log.error(`Error message: ${err.message}`);
          req.log.error(`Error stack: ${err.stack}`);
        } else {
          req.log.error(`Error details: ${JSON.stringify(err)}`);
        }
      });

    return reply.code(200).send({ ok: true });
  } catch (e: any) {
    req.log.error(`❌ Unexpected error in handleOnAppClose:`, e);
    req.log.error(`Error message: ${e?.message || 'Unknown error'}`);
    req.log.error(`Error stack: ${e?.stack || 'No stack trace'}`);
    return reply.code(500).send({ ok: false, error: e?.message ?? 'Unknown error' });
  }
}

