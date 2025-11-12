import type { Bot } from '@maxhub/max-bot-api';
import { getUserTotalViewCount } from '../../db/db-card-views-utils.ts';
import { getLastViewCount, saveLastViewCount, saveLastMotivationalMessageId, getLastMotivationalMessageDate, getLastMotivationalMessageId } from '../../db/db-user-utils.ts';

const MOTIVATION_MESSAGES: readonly string[] = [
  'Каждая инициатива, которую вы просматриваете, может стать реальной помощью для людей в приграничных территориях. Спасибо за ваше участие!',
  'Ваше внимание к инициативам поддержки — это уже важный шаг. Вместе мы можем сделать больше для тех, кому нужна помощь.',
  'Каждый просмотр — это возможность найти способ помочь. Продолжайте изучать инициативы, ваша поддержка очень важна!',
  'Спасибо, что не остаётесь в стороне! Каждая инициатива, которую вы изучаете, приближает реальную помощь людям в приграничных территориях.',
  'Ваша активность вдохновляет! Продолжайте исследовать инициативы — вместе мы можем изменить ситуацию к лучшему.',
  'Каждая инициатива — это шанс помочь. Спасибо, что уделяете время изучению возможностей поддержки приграничных территорий.',
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
 * Форматирует текущую дату на русском языке.
 * 
 * @returns Отформатированная дата в формате "15 января 2024"
 */
function formatCurrentDate(): string {
  const now = new Date();
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  
  return `${day} ${month} ${year}`;
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
  const currentDate = formatCurrentDate();
  
  if (viewsThisSession === 0) {
    return `📊 Статистика за ${currentDate}:\nЗа эту сессию: 0 просмотров\nВсего просмотрено: ${totalViewsText}\n\n${motivation}`;
  }
  
  return `📊 Статистика за ${currentDate}:\nЗа эту сессию: ${viewsThisSessionText}\nВсего просмотрено: ${totalViewsText}\n\n${motivation}`;
}

/**
 * Проверяет, была ли отправка мотивационного сообщения сегодня.
 * 
 * @param lastMessageDate - дата последнего сообщения или null
 * @returns true, если сообщение было отправлено сегодня
 */
function wasMessageSentToday(lastMessageDate: Date | null): boolean {
  if (!lastMessageDate) {
    return false;
  }
  
  const today = new Date();
  const lastDate = new Date(lastMessageDate);
  
  return (
    today.getFullYear() === lastDate.getFullYear() &&
    today.getMonth() === lastDate.getMonth() &&
    today.getDate() === lastDate.getDate()
  );
}

/**
 * Отправляет мотивационное сообщение со статистикой пользователю при закрытии мини-приложения.
 * 
 * Логика работы:
 * - Если сообщение уже было отправлено сегодня - редактирует существующее сообщение
 * - Если сообщение не было отправлено сегодня - отправляет новое
 * - Если редактирование не удалось (например, пользователь удалил чат) - отправляет новое сообщение
 * 
 * @param bot - экземпляр бота для отправки сообщений
 * @param userId - ID пользователя MAX
 */
export async function checkAndSendMotivationalMessage(bot: Bot, userId: number): Promise<void> {
  try {
    const [totalViewCount, lastViewCount, lastMessageDate, lastMessageId] = await Promise.all([
      getUserTotalViewCount(userId),
      getLastViewCount(userId),
      getLastMotivationalMessageDate(userId),
      getLastMotivationalMessageId(userId),
    ]);

    const viewsThisSession = Math.max(0, totalViewCount - lastViewCount);
    const message = generateMotivationalMessage(viewsThisSession, totalViewCount);
    
    const wasSentToday = wasMessageSentToday(lastMessageDate);
    
    if (wasSentToday && lastMessageId) {
      // Пытаемся отредактировать существующее сообщение
      try {
        await bot.api.editMessage(lastMessageId, { text: message });
        await saveLastViewCount(userId, totalViewCount);
        console.log(`✅ Статистика отредактирована для пользователя ${userId}`);
        return;
      } catch (editError: any) {
        // Если редактирование не удалось (сообщение не найдено, чат удален и т.д.)
        // Отправляем новое сообщение
        console.log(`⚠️ Не удалось отредактировать сообщение для пользователя ${userId}, отправляем новое: ${editError?.message || 'Unknown error'}`);
        // Продолжаем выполнение, чтобы отправить новое сообщение
      }
    }
    
    // Отправляем новое сообщение (если не было отправлено сегодня или редактирование не удалось)
    const newMessage = await bot.api.sendMessageToUser(userId, message);
    await saveLastMotivationalMessageId(userId, newMessage.body.mid);
    await saveLastViewCount(userId, totalViewCount);
    console.log(`✅ Статистика отправлена пользователю ${userId}`);
  } catch (error: any) {
    console.error(`❌ Ошибка при отправке статистики пользователю ${userId}:`, error?.message || error);
    throw error;
  }
}

