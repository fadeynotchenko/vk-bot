import type { Context } from '@maxhub/max-bot-api';
import { sendStatsMessage } from './motivational-messages.ts';
import { bot } from '../bot-instance.ts';

/**
 * Обработчик команды /stats
 * 
 * Отправляет пользователю статистику просмотров и мотивационное сообщение.
 * Показывает прогресс с момента последнего вызова команды.
 * 
 * @param ctx - контекст команды
 */
export async function statsCommandHandler(ctx: Context): Promise<void> {
  try {
    const userId = ctx.user?.user_id;
    
    if (!userId) {
      console.error('❌ Не удалось получить user_id из контекста команды /stats');
      return;
    }

    await sendStatsMessage(bot, userId);
  } catch (error: any) {
    console.error(`❌ Ошибка при обработке команды /stats для пользователя ${ctx.user?.user_id || 'неизвестного'}:`, error?.message || error);
    
    try {
      await ctx.reply('❌ Произошла ошибка при получении статистики. Попробуйте позже.');
    } catch (replyError) {
      console.error('❌ Не удалось отправить сообщение об ошибке:', replyError);
    }
  }
}

