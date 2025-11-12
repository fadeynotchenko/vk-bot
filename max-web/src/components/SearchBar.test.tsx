import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar.tsx';

describe('SearchBar', () => {
  it('должен отображать поле ввода', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('Поиск по названию и описанию...');
    expect(input).toBeInTheDocument();
  });

  it('должен вызывать onChange при вводе текста', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const input = screen.getByPlaceholderText('Поиск по названию и описанию...');
    fireEvent.change(input, { target: { value: 'тест' } });

    expect(onChange).toHaveBeenCalledWith('тест');
  });

  it('должен отображать кнопку очистки при наличии значения', () => {
    const onChange = vi.fn();
    render(<SearchBar value="тест" onChange={onChange} />);

    const clearButton = screen.getByLabelText('Очистить поиск');
    expect(clearButton).toBeInTheDocument();
  });

  it('должен не отображать кнопку очистки при пустом значении', () => {
    const onChange = vi.fn();
    render(<SearchBar value="" onChange={onChange} />);

    const clearButton = screen.queryByLabelText('Очистить поиск');
    expect(clearButton).not.toBeInTheDocument();
  });

  it('должен очищать значение при нажатии на кнопку очистки', () => {
    const onChange = vi.fn();
    render(<SearchBar value="тест" onChange={onChange} />);

    const clearButton = screen.getByLabelText('Очистить поиск');
    fireEvent.click(clearButton);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('должен использовать кастомный placeholder', () => {
    const onChange = vi.fn();
    const customPlaceholder = 'Введите запрос...';
    render(<SearchBar value="" onChange={onChange} placeholder={customPlaceholder} />);

    const input = screen.getByPlaceholderText(customPlaceholder);
    expect(input).toBeInTheDocument();
  });
});

