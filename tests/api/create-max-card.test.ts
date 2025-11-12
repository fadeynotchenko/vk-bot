import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { FastifyRequest, FastifyReply } from 'fastify';
import { handleCreateMaxCard } from '../../api/endpoints/create-max-card.ts';
import * as dbCardUtils from '../../db/db-card-utils.ts';

// Мокаем модуль базы данных
vi.mock('../../db/db-card-utils.ts', () => ({
  createMaxCard: vi.fn(),
}));

describe('handleCreateMaxCard', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let mockParts: AsyncIterable<any>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Создаем мок для reply
    mockReply = {
      code: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };

    // Создаем мок для request
    mockRequest = {
      log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      } as any,
      parts: vi.fn(),
    };
  });

  it('должен успешно создать карточку с минимальными полями', async () => {
    const mockCard = {
      id: '123',
      category: 'благотворительность',
      title: 'Тестовая карточка',
      subtitle: 'Краткое описание',
      text: 'Полное описание',
      status: 'moderate',
      date: new Date().toISOString(),
    };

    vi.mocked(dbCardUtils.createMaxCard).mockResolvedValue(mockCard as any);

    // Создаем мок для multipart данных
    const mockPartsArray = [
      { type: 'field', fieldname: 'category', value: 'благотворительность' },
      { type: 'field', fieldname: 'title', value: 'Тестовая карточка' },
      { type: 'field', fieldname: 'subtitle', value: 'Краткое описание' },
      { type: 'field', fieldname: 'text', value: 'Полное описание' },
      { type: 'field', fieldname: 'status', value: 'moderate' },
    ];

    mockParts = (async function* () {
      for (const part of mockPartsArray) {
        yield part;
      }
    })();

    vi.mocked(mockRequest.parts).mockReturnValue(mockParts as any);

    await handleCreateMaxCard(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(dbCardUtils.createMaxCard).toHaveBeenCalledWith({
      category: 'благотворительность',
      title: 'Тестовая карточка',
      subtitle: 'Краткое описание',
      text: 'Полное описание',
      status: 'moderate',
    });
    expect(mockReply.code).toHaveBeenCalledWith(201);
    expect(mockReply.send).toHaveBeenCalledWith({ ok: true, data: mockCard });
  });

  it('должен создать карточку с дополнительными полями (link, user_id, image)', async () => {
    const mockCard = {
      id: '123',
      category: 'благотворительность',
      title: 'Тестовая карточка',
      subtitle: 'Краткое описание',
      text: 'Полное описание',
      status: 'accepted',
      date: new Date().toISOString(),
      link: 'https://example.com',
      user_id: 12345,
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };

    vi.mocked(dbCardUtils.createMaxCard).mockResolvedValue(mockCard as any);

    const imageBuffer = Buffer.from('fake-image-data');
    const mockPartsArray = [
      { type: 'field', fieldname: 'category', value: 'благотворительность' },
      { type: 'field', fieldname: 'title', value: 'Тестовая карточка' },
      { type: 'field', fieldname: 'subtitle', value: 'Краткое описание' },
      { type: 'field', fieldname: 'text', value: 'Полное описание' },
      { type: 'field', fieldname: 'status', value: 'accepted' },
      { type: 'field', fieldname: 'link', value: 'https://example.com' },
      { type: 'field', fieldname: 'user_id', value: '12345' },
      {
        type: 'file',
        filename: 'test.png',
        mimetype: 'image/png',
        toBuffer: vi.fn().mockResolvedValue(imageBuffer),
      },
    ];

    mockParts = (async function* () {
      for (const part of mockPartsArray) {
        yield part;
      }
    })();

    vi.mocked(mockRequest.parts).mockReturnValue(mockParts as any);

    await handleCreateMaxCard(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(dbCardUtils.createMaxCard).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'благотворительность',
        title: 'Тестовая карточка',
        subtitle: 'Краткое описание',
        text: 'Полное описание',
        status: 'accepted',
        link: 'https://example.com',
        user_id: 12345,
        image: expect.stringContaining('data:image/png;base64,'),
      })
    );
    expect(mockReply.code).toHaveBeenCalledWith(201);
  });

  it('должен вернуть ошибку 400, если отсутствует обязательное поле', async () => {
    const mockPartsArray = [
      { type: 'field', fieldname: 'category', value: 'благотворительность' },
      { type: 'field', fieldname: 'title', value: 'Тестовая карточка' },
      // Отсутствует subtitle
      { type: 'field', fieldname: 'text', value: 'Полное описание' },
      { type: 'field', fieldname: 'status', value: 'moderate' },
    ];

    mockParts = (async function* () {
      for (const part of mockPartsArray) {
        yield part;
      }
    })();

    vi.mocked(mockRequest.parts).mockReturnValue(mockParts as any);

    await handleCreateMaxCard(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: false,
      error: 'Field "subtitle" is required',
    });
    expect(dbCardUtils.createMaxCard).not.toHaveBeenCalled();
  });

  it('должен вернуть ошибку 400, если поле пустое', async () => {
    const mockPartsArray = [
      { type: 'field', fieldname: 'category', value: '   ' }, // Пустое поле
      { type: 'field', fieldname: 'title', value: 'Тестовая карточка' },
      { type: 'field', fieldname: 'subtitle', value: 'Краткое описание' },
      { type: 'field', fieldname: 'text', value: 'Полное описание' },
      { type: 'field', fieldname: 'status', value: 'moderate' },
    ];

    mockParts = (async function* () {
      for (const part of mockPartsArray) {
        yield part;
      }
    })();

    vi.mocked(mockRequest.parts).mockReturnValue(mockParts as any);

    await handleCreateMaxCard(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    );

    expect(mockReply.code).toHaveBeenCalledWith(400);
    expect(mockReply.send).toHaveBeenCalledWith({
      ok: false,
      error: 'Field "category" is required',
    });
  });

  it('должен вернуть ошибку 500 при ошибке базы данных', async () => {
    const mockPartsArray = [
      { type: 'field', fieldname: 'category', value: 'благотворительность' },
      { type: 'field', fieldname: 'title', value: 'Тестовая карточка' },
      { type: 'field', fieldname: 'subtitle', value: 'Краткое описание' },
      { type: 'field', fieldname: 'text', value: 'Полное описание' },
      { type: 'field', fieldname: 'status', value: 'moderate' },
    ];

    mockParts = (async function* () {
      for (const part of mockPartsArray) {
        yield part;
      }
    })();

    vi.mocked(mockRequest.parts).mockReturnValue(mockParts as any);
    vi.mocked(dbCardUtils.createMaxCard).mockRejectedValue(
      new Error('Database error')
    );

    await handleCreateMaxCard(
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

