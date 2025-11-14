import type { Bot } from '@maxhub/max-bot-api';
import { getUserTotalViewCount } from '../../db/db-card-views-utils.ts';
import { getLastStatsViewCount, saveLastStatsViewCount } from '../../db/db-user-utils.ts';

const MOTIVATION_MESSAGES_WITH_VIEWS: readonly string[] = [
  '🌟 Каждая инициатива, которую вы просматриваете, может стать реальной помощью для людей. Спасибо за ваше участие!',
  '💚 Ваше внимание к инициативам поддержки — это уже важный шаг. Вместе мы можем сделать больше для тех, кому нужна помощь.',
  '✨ Каждый просмотр — это возможность найти способ помочь. Продолжайте изучать инициативы, ваша поддержка очень важна!',
  '🤝 Спасибо, что не остаётесь в стороне! Каждая инициатива, которую вы изучаете, приближает реальную помощь людям.',
  '🎯 Ваша активность вдохновляет! Продолжайте исследовать инициативы — вместе мы можем изменить ситуацию к лучшему.',
  '💫 Каждая инициатива — это шанс помочь. Спасибо, что уделяете время изучению возможностей поддержки.',
  '🫶 Вы делаете мир лучше! Каждый просмотр — это шаг к реальной помощи тем, кто в ней нуждается.',
  '🌱 Ваше участие в благотворительности создаёт позитивные изменения. Продолжайте в том же духе!',
  '💪 Сила в единстве! Изучая инициативы, вы находите способы помочь и вдохновляете других.',
  '🎁 Каждая инициатива — это подарок надежды. Спасибо за то, что вы часть этого движения!',
];

const MOTIVATION_MESSAGES_NO_VIEWS: readonly string[] = [
  '💡 Откройте мини-приложение и начните изучать инициативы! Каждый просмотр приближает реальную помощь людям.',
  '🌟 Изучайте благотворительные проекты в мини-приложении — там вы найдёте множество способов помочь!',
  '✨ Начните свой путь помощи прямо сейчас! Откройте мини-приложение и посмотрите доступные инициативы.',
  '🎯 В мини-приложении вас ждут интересные проекты помощи. Откройте и начните изучать!',
  '💚 Каждая инициатива — это возможность помочь. Откройте мини-приложение и начните исследовать!',
];

function getRandomMotivation(hasViews: boolean): string {
  const messages = hasViews ? MOTIVATION_MESSAGES_WITH_VIEWS : MOTIVATION_MESSAGES_NO_VIEWS;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex] ?? messages[0]!;
}

interface LevelInfo {
  name: string;
  emoji: string;
  minViews: number;
}

const LEVELS: readonly LevelInfo[] = [
  { name: 'Новичок', emoji: '🌱', minViews: 0 },
  { name: 'Активист', emoji: '⭐', minViews: 6 },
  { name: 'Волонтер', emoji: '🌟', minViews: 16 },
  { name: 'Лидер', emoji: '💎', minViews: 31 },
  { name: 'Мастер', emoji: '👑', minViews: 51 },
];

function getLevel(totalViews: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalViews >= LEVELS[i]!.minViews) {
      return LEVELS[i]!;
    }
  }
  return LEVELS[0]!;
}

function getNextLevelInfo(currentLevel: LevelInfo, totalViews: number): { viewsNeeded: number; nextLevel: LevelInfo | null } {
  const currentIndex = LEVELS.findIndex(level => level.name === currentLevel.name);
  if (currentIndex === -1 || currentIndex === LEVELS.length - 1) {
    return { viewsNeeded: 0, nextLevel: null };
  }
  
  const nextLevel = LEVELS[currentIndex + 1]!;
  const viewsNeeded = nextLevel.minViews - totalViews;
  return { viewsNeeded, nextLevel };
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
 * @param viewsSinceLastStats - количество просмотров с момента последнего вызова команды /stats
 * @param totalViews - общее количество просмотров
 * @returns Сформированное сообщение
 */
function generateMotivationalMessage(viewsSinceLastStats: number, totalViews: number): string {
  const viewsSinceLastStatsText = formatViewCount(viewsSinceLastStats);
  const totalViewsText = formatViewCount(totalViews);
  const motivation = getRandomMotivation(viewsSinceLastStats > 0);
  const currentDate = formatCurrentDate();
  const level = getLevel(totalViews);
  const { viewsNeeded, nextLevel } = getNextLevelInfo(level, totalViews);
  
  let levelInfo = `\n🏆 Ваш уровень: ${level.emoji} ${level.name}`;
  if (nextLevel && viewsNeeded > 0) {
    levelInfo += `\n📈 До уровня ${nextLevel.emoji} ${nextLevel.name}: ${formatViewCount(viewsNeeded)}`;
  } else if (!nextLevel) {
    levelInfo += `\n🎉 Вы достигли максимального уровня!`;
  }
  
  if (viewsSinceLastStats === 0) {
    return `📊 Статистика за ${currentDate}\n\n📱 С последнего запроса: 0 просмотров\n📈 Всего просмотрено: ${totalViewsText}${levelInfo}\n\n${motivation}`;
  }
  
  return `📊 Статистика за ${currentDate}\n\n📱 С последнего запроса: ${viewsSinceLastStatsText}\n📈 Всего просмотрено: ${totalViewsText}${levelInfo}\n\n${motivation}`;
}

/**
 * Отправляет мотивационное сообщение со статистикой пользователю по команде /stats.
 * 
 * Логика работы:
 * - Вычисляет прогресс с момента последнего вызова команды /stats
 * - Генерирует новое сообщение со статистикой
 * - Отправляет новое сообщение пользователю
 * - Сохраняет текущее количество просмотров для следующего вызова команды
 * 
 * @param bot - экземпляр бота для отправки сообщений
 * @param userId - ID пользователя MAX
 */
export async function sendStatsMessage(bot: Bot, userId: number): Promise<void> {
  try {
    const [totalViewCount, lastStatsViewCount] = await Promise.all([
      getUserTotalViewCount(userId),
      getLastStatsViewCount(userId),
    ]);
    
    // Вычисляем просмотры с момента последнего вызова команды /stats
    const viewsSinceLastStats = Math.max(0, totalViewCount - lastStatsViewCount);
    const message = generateMotivationalMessage(viewsSinceLastStats, totalViewCount);
    
    // Отправляем новое сообщение
    await bot.api.sendMessageToUser(userId, message);
    // Сохраняем текущее количество просмотров для следующего вызова команды
    await saveLastStatsViewCount(userId, totalViewCount);
    console.log(`✅ Статистика отправлена пользователю ${userId}, просмотров с последнего запроса: ${viewsSinceLastStats}`);
  } catch (error: any) {
    console.error(`❌ Ошибка при отправке статистики пользователю ${userId}:`, error?.message || error);
    throw error;
  }
}

