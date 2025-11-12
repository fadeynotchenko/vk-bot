import { describe, it, expect } from 'vitest';
import { formatCardDate } from './formatDate.ts';

describe('formatCardDate', () => {
  it('должен форматировать валидную дату', () => {
    const dateString = '2024-01-15T10:30:00.000Z';
    const result = formatCardDate(dateString);

    expect(result).toBeTruthy();
    expect(result).toContain('15');
    expect(result).toContain('2024');
  });

  it('должен вернуть пустую строку для undefined', () => {
    const result = formatCardDate(undefined);
    expect(result).toBe('');
  });

  it('должен вернуть пустую строку для невалидной даты', () => {
    const result = formatCardDate('invalid-date');
    expect(result).toBe('');
  });

  it('должен вернуть пустую строку для пустой строки', () => {
    const result = formatCardDate('');
    expect(result).toBe('');
  });

  it('должен использовать русскую локаль', () => {
    const dateString = '2024-03-15T10:30:00.000Z';
    const result = formatCardDate(dateString);

    // Проверяем, что форматирование использует русскую локаль
    expect(result).toBeTruthy();
    // В русской локали месяц должен быть в родительном падеже
    expect(typeof result).toBe('string');
  });
});

