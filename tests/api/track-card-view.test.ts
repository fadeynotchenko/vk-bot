import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleTrackCardView } from '../../api/endpoints/track-card-view.ts';
import * as dbCardViewsUtils from '../../db/db-card-views-utils.ts';

// Мокаем модуль базы данных
vi.mock('../../db/db-card-views-utils.ts', () => ({
  trackCardView: vi.fn(),
}));

describe('handleTrackCardView', () => {
  let mockRequest: Partial<FastifyRequest<{ Body: { card_id: string; user_id: number } }>>;
  let mockReply: Partial<FastifyReply>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    mockRequest = {
      body: {
        card_id: '123',
        user_id: 456,
      },
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      } as any,
    };
  });

  it('должен успешно отследить просмотр карточки', async () => {
    const viewCount = 5;
    vi.mocked(dbCardViewsUtils.trackCardView).mockResolvedValue(viewCount);

    await handleTrackCardView(
      mockRequest as FastifyRequest<{ Body: { card_id: string; user_id: number } }>,
      mockReply as FastifyReply
    );

    expect(dbCardViewsUtils.trackCardView).toHaveBeenCalledWith('123', 456);
    expect(mockReply.code).toHaveBeenCalledWith(200);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: true,
      view_count: viewCount,
    });
  });

  it('должен вернуть ошибку 400, если отсутствует card_id', async () => {
    mockRequest.body = {
      card_id: '',
      user_id: 456,
    } as any;

    await handleTrackCardView(
      mockRequest as FastifyRequest<{ Body: { card_id: string; user_id: number } }>,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: false,
      error: 'card_id and user_id are required',
    });
    expect(dbCardViewsUtils.trackCardView).not.toHaveBeenCalled();
  });

  it('должен вернуть ошибку 400, если отсутствует user_id', async () => {
    mockRequest.body = {
      card_id: '123',
      user_id: 0,
    } as any;

    await handleTrackCardView(
      mockRequest as FastifyRequest<{ Body: { card_id: string; user_id: number } }>,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: false,
      error: 'card_id and user_id are required',
    });
  });

  it('должен вернуть ошибку 500 при ошибке базы данных', async () => {
    vi.mocked(dbCardViewsUtils.trackCardView).mockRejectedValue(
      new Error('Database error')
    );

    await handleTrackCardView(
      mockRequest as FastifyRequest<{ Body: { card_id: string; user_id: number } }>,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(500);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: false,
      error: 'Database error',
    });
  });
});

