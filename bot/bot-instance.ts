import { Bot } from '@maxhub/max-bot-api';
import dotenv from 'dotenv';
import { botStartedHandler } from './handlers/bot-started.ts';
import { topCommandHandler } from './handlers/top-cards-command.ts';
import { topViewsCommandHandler } from './handlers/top-views-command.ts';
import { statsCommandHandler } from './handlers/stats-command.ts';
import { topCallbackHandler } from './handlers/top-cards-callback.ts';
import { topViewsCallbackHandler } from './handlers/top-views-callback.ts';

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN!);

bot.on('bot_started', botStartedHandler);

bot.command('topcards', topCommandHandler);

bot.command('topviews', topViewsCommandHandler);

bot.command('stats', statsCommandHandler);

bot.on('message_callback', async (ctx) => {
  await topCallbackHandler(bot, ctx);
  await topViewsCallbackHandler(bot, ctx);
});

export { bot };

export async function registerBotCommands(): Promise<void> {
  try {
    if (bot.api.setMyCommands) {
      await bot.api.setMyCommands([
        {
          name: 'topcards',
          description: 'Показать топ пользователей по количеству созданных инициатив',
        },
        {
          name: 'topviews',
          description: 'Показать топ пользователей по количеству просмотров',
        },
        {
          name: 'stats',
          description: 'Показать вашу статистику просмотров и прогресс',
        },
      ]);
      console.log('✅ Список команд зарегистрирован');
    }
  } catch (error) {
    console.warn('⚠️ Не удалось зарегистрировать список команд:', error);
  }
}

