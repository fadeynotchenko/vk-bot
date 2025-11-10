import type { Bot } from '@maxhub/max-bot-api';
import { getUserTotalViewCount } from '../../db/db-card-views-utils.ts';
import { getLastViewCount, saveLastViewCount } from '../../db/db-user-utils.ts';

const MOTIVATION_MESSAGES: readonly string[] = [
  'Продолжайте исследовать инициативы — каждая может стать вашим шансом помочь!',
  'Ваш интерес к добрым делам вдохновляет! Не останавливайтесь на достигнутом.',
  'Каждая просмотренная инициатива — это шаг к реальной помощи. Продолжайте в том же духе!',
  'Вы на правильном пути! Откликайтесь на инициативы, которые вам близки, и делайте мир лучше.',
];

function getRandomMotivation(): string {
  const randomIndex = Math.floor(Math.random() * MOTIVATION_MESSAGES.length);
  return MOTIVATION_MESSAGES[randomIndex] ?? MOTIVATION_MESSAGES[0]!;
}

function formatViewCount(count: number): string {
  if (count === 0) return '0';
  if (count === 1) return '1 инициативу';
  if (count >= 2 && count <= 4) return `${count} инициативы`;
  return `${count} инициатив`;
}

/**
 * Генерирует мотивационное сообщение со статистикой просмотров.
 * 
 * @param viewsThisSession - количество просмотров за текущую сессию
 * @param totalViews - общее количество просмотров
 * @returns Сформированное сообщение
 */
function generateMotivationalMessage(viewsThisSession: number, totalViews: number): string {
  const viewsThisSessionText = formatViewCount(viewsThisSession);
  const totalViewsText = formatViewCount(totalViews);
  const motivation = getRandomMotivation();
  
  if (viewsThisSession === 0) {
    return `📊 Статистика:\nЗа эту сессию: 0 просмотров\nВсего просмотрено: ${totalViewsText}\n\n${motivation}`;
  }
  
  return `📊 Статистика:\nЗа эту сессию: ${viewsThisSessionText}\nВсего просмотрено: ${totalViewsText}\n\n${motivation}`;
}

/**
 * Проверяет и отправляет мотивационное сообщение пользователю при закрытии мини-приложения.
 * 
 * Отправляет сообщение со статистикой: сколько просмотрено за эту сессию и всего.
 * Включает случайную мотивацию из 3-4 вариантов.
 * 
 * @param bot - экземпляр бота для отправки сообщений
 * @param userId - ID пользователя MAX
 */
export async function checkAndSendMotivationalMessage(bot: Bot, userId: number): Promise<void> {
  try {
    const [totalViewCount, lastViewCount] = await Promise.all([
      getUserTotalViewCount(userId),
      getLastViewCount(userId),
    ]);

    const viewsThisSession = Math.max(0, totalViewCount - lastViewCount);
    
    const message = generateMotivationalMessage(viewsThisSession, totalViewCount);
    
    await bot.api.sendMessageToUser(userId, message);
    await saveLastViewCount(userId, totalViewCount);
  } catch (error) {
    throw error;
  }
}

