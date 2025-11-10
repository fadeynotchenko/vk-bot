import type { Bot } from '@maxhub/max-bot-api';
import { getUserTotalViewCount } from '../../db/db-card-views-utils.ts';

// Пороги для отправки мотивационных сообщений
const MOTIVATION_THRESHOLDS = [3, 5, 10, 20] as const;

/**
 * Генерирует мотивационное сообщение на основе общего количества просмотров.
 */
function getMotivationalMessage(totalViewCount: number): string {
  switch (totalViewCount) {
    case 3:
      return '🎉 Отлично! Вы уже просмотрели 3 инициативы. Продолжайте исследовать возможности помочь!';
    case 5:
      return '🌟 Превосходно! 5 просмотренных инициатив — вы на правильном пути к добрым делам!';
    case 10:
      return '💫 Невероятно! 10 инициатив — вы настоящий активист добра! Спасибо за вашу активность!';
    case 20:
      return '🏆 Потрясающе! 20 инициатив — вы вдохновляете других на добрые дела! Продолжайте в том же духе!';
    default:
      return `👍 Спасибо за интерес к инициативам! Вы уже просмотрели ${totalViewCount} карточек.`;
  }
}

/**
 * Проверяет, нужно ли отправить мотивационное сообщение пользователю при закрытии мини-приложения.
 * 
 * Использует метод библиотеки @maxhub/max-bot-api: bot.api.sendMessageToUser()
 * согласно документации: https://dev.max.ru/docs-api/methods/POST/messages
 * 
 * @param bot - экземпляр бота для отправки сообщений
 * @param userId - ID пользователя MAX
 * 
 * Получает общее количество просмотров пользователя и отправляет мотивационное сообщение,
 * если достигнут один из порогов (3, 5, 10, 20 просмотров всех карточек).
 */
export async function checkAndSendMotivationalMessage(bot: Bot, userId: number): Promise<void> {
  try {
    console.log(`🔍 Checking motivational message for user ${userId}...`);
    
    const totalViewCount = await getUserTotalViewCount(userId);
    console.log(`📊 User ${userId} has ${totalViewCount} total views`);

    if (!MOTIVATION_THRESHOLDS.includes(totalViewCount as typeof MOTIVATION_THRESHOLDS[number])) {
      console.log(`⏭️ User ${userId} has ${totalViewCount} views, which is not a threshold (${MOTIVATION_THRESHOLDS.join(', ')})`);
      return;
    }

    const message = getMotivationalMessage(totalViewCount);
    console.log(`📝 Prepared message for user ${userId}: "${message.substring(0, 50)}..."`);
    
    // Используем метод библиотеки согласно документации
    console.log(`📤 Attempting to send message to user ${userId}...`);
    const result = await bot.api.sendMessageToUser(userId, message);
    
    console.log(`✅ Motivational message sent to user ${userId} (total views: ${totalViewCount})`);
    console.log(`📨 Message result:`, result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error(`❌ Failed to check/send motivational message for user ${userId}:`, errorMessage);
    if (errorStack) {
      console.error(`Stack trace:`, errorStack);
    }
    
    // Логируем полную информацию об ошибке для отладки
    if (error && typeof error === 'object') {
      console.error(`Error details:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    
    // Пробрасываем ошибку, чтобы она была залогирована на уровне выше
    throw error;
  }
}

