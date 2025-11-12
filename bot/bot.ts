import { connectDB } from '../db/db-client.ts';
import { bot } from './bot-instance.ts';

await connectDB();

// Запуск бота
try {
  console.log('🤖 Запуск бота...');
  await bot.start();
  console.log('✅ Бот успешно запущен');
} catch (error: any) {
  const errorMessage = error?.cause?.message || error?.message || 'Неизвестная ошибка';
  const errorCode = error?.cause?.code || error?.code || 'UNKNOWN';
  
  console.error('❌ Ошибка при запуске бота:');
  console.error(`   Код: ${errorCode}`);
  console.error(`   Сообщение: ${errorMessage}`);
  
  if (error?.stack) {
    console.error(`   Stack: ${error.stack}`);
  }
  
  process.exit(1);
}
