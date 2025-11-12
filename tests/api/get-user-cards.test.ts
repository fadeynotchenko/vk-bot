import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleGetUserCards } from '../../api/endpoints/get-user-cards.ts';
import * as dbCardUtils from '../../db/db-card-utils.ts';

// Мокаем модуль базы данных
vi.mock('../../db/db-card-utils.ts', () => ({
  getUserMaxCards: vi.fn(),
}));

describe('handleGetUserCards', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    mockRequest = {
      query: {},
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      } as any,
    };
  });

  it('должен успешно вернуть карточки пользователя', async () => {
    const userId = 12345;
    const mockCards = [
      {
        id: '1',
        category: 'благотворительность',
        title: 'Моя карточка',
        subtitle: 'Описание',
        text: 'Полное описание',
        status: 'moderate',
        date: new Date().toISOString(),
        user_id: userId,
        view_count: 5,
      },
    ];

    vi.mocked(dbCardUtils.getUserMaxCards).mockResolvedValue(mockCards as any);
    mockRequest.query = { user_id: userId.toString() };

    await handleGetUserCards(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(dbCardUtils.getUserMaxCards).toHaveBeenCalledWith(userId);
    expect(mockReply.code).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: true,
      data: mockCards,
    });
  });

  it('должен вернуть ошибку 400, если user_id отсутствует', async () => {
    mockRequest.query = {};

    await handleGetUserCards(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: false,
      error: 'user_id query parameter is required',
    });
    expect(dbCardUtils.getUserMaxCards).not.toHaveBeenCalled();
  });

  it('должен вернуть ошибку 400, если user_id невалидный', async () => {
    mockRequest.query = { user_id: 'invalid' };

    await handleGetUserCards(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: false,
      error: 'user_id must be a positive number',
    });
    expect(dbCardUtils.getUserMaxCards).not.toHaveBeenCalled();
  });

  it('должен вернуть ошибку 500 при ошибке базы данных', async () => {
    const userId = 12345;
    mockRequest.query = { user_id: userId.toString() };
    vi.mocked(dbCardUtils.getUserMaxCards).mockRejectedValue(
      new Error('Database error')
    );

    await handleGetUserCards(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: false,
      error: 'Database error',
    });
  });
});

