import type { Context } from '@maxhub/max-bot-api';
import type { Bot } from '@maxhub/max-bot-api';
import { statsCommandHandler } from './stats-command.ts';

/**
 * Обработчик callback кнопки "📊 Статистика"
 * 
 * Обрабатывает нажатие на callback кнопку и отвечает на callback query,
 * затем выполняет обработчик команды статистики
 * 
 * @param bot - экземпляр бота для ответа на callback
 * @param ctx - контекст события message_callback
 */
export async function statsCallbackHandler(bot: Bot, ctx: Context): Promise<void> {
  try {
    const callback = (ctx as any).callback;
    const callbackId = callback?.callback_id;
    const callbackData = callback?.data || callback?.payload;
    
    if (callbackData === 'stats_command') {
      if (callbackId && bot.api.answerOnCallback) {
        try {
          await (bot.api.answerOnCallback as any)(callbackId, {
            notification: 'Загрузка статистики...',
          });
        } catch (answerError: any) {
          console.error(`❌ Ошибка при ответе на callback для пользователя ${ctx.user?.user_id || 'неизвестного'}:`, answerError?.message || answerError);
        }
      }
      
      await statsCommandHandler(ctx);
    }
  } catch (error: any) {
    console.error(`❌ Ошибка при обработке callback для пользователя ${ctx.user?.user_id || 'неизвестного'}:`, error?.message || error);
    
    const callbackId = (ctx as any).callback?.callback_id;
    if (callbackId && bot.api.answerOnCallback) {
      try {
        await (bot.api.answerOnCallback as any)(callbackId, {
          notification: 'Произошла ошибка',
        });
      } catch (answerError) {
      }
    }
  }
}

