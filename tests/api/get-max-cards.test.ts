import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleGetMaxCards } from '../../api/endpoints/get-max-cards.ts';
import * as dbCardUtils from '../../db/db-card-utils.ts';

vi.mock('../../db/db-card-utils.ts', () => ({
  getMaxCards: vi.fn(),
}));

describe('handleGetMaxCards', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    mockRequest = {
      log: {
        info: vi.fn(),
        error: vi.fn(),
      } as any,
    };
  });

  it('должен успешно вернуть список карточек', async () => {
    const mockCards = [
      {
        id: '1',
        category: 'благотворительность',
        title: 'Карточка 1',
        subtitle: 'Описание 1',
        text: 'Полное описание 1',
        status: 'accepted',
        date: new Date().toISOString(),
        view_count: 10,
      },
      {
        id: '2',
        category: 'волонтерство',
        title: 'Карточка 2',
        subtitle: 'Описание 2',
        text: 'Полное описание 2',
        status: 'accepted',
        date: new Date().toISOString(),
        view_count: 5,
      },
    ];

    vi.mocked(dbCardUtils.getMaxCards).mockResolvedValue(mockCards as any);

    await handleGetMaxCards(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(dbCardUtils.getMaxCards).toHaveBeenCalled();
    expect(mockReply.code).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: true,
      data: mockCards,
    });
  });

  it('должен вернуть пустой массив, если карточек нет', async () => {
    vi.mocked(dbCardUtils.getMaxCards).mockResolvedValue([]);

    await handleGetMaxCards(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: true,
      data: [],
    });
  });

  it('должен вернуть ошибку 500 при ошибке базы данных', async () => {
    vi.mocked(dbCardUtils.getMaxCards).mockRejectedValue(
      new Error('Database connection failed')
    );

    await handleGetMaxCards(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: false,
      error: 'Database connection failed',
    });
  });
});

