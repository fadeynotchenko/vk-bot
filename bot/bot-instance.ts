import { Bot } from '@maxhub/max-bot-api';
import dotenv from 'dotenv';
import { botStartedHandler } from './handlers/bot-started.ts';

dotenv.config();

const bot = new Bot(process.env.BOT_TOKEN!);

// Обработчик события запуска бота
bot.on('bot_started', botStartedHandler);

// Экспортируем бота для использования в других модулях (без запуска)
export { bot };

