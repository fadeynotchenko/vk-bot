import { describe, it, expect, beforeEach, vi } from 'vitest';
import { botStartedHandler } from '../../bot/handlers/bot-started.ts';
import * as dbUserUtils from '../../db/db-user-utils.ts';
import { Context } from '@maxhub/max-bot-api';

vi.mock('../../db/db-user-utils.ts', () => ({
  upsertUser: vi.fn(),
  clearLastMotivationalMessage: vi.fn(),
}));

describe('botStartedHandler', () => {
  let mockContext: Partial<Context>;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WEB_APP_URL = 'https://example.com';

    mockContext = {
      user: {
        user_id: 12345,
        name: 'Test User',
      },
      reply: vi.fn().mockResolvedValue(undefined),
    } as any;
  });

  it('должен добавить пользователя в базу данных', async () => {
    await botStartedHandler(mockContext as Context);

    expect(dbUserUtils.upsertUser).toHaveBeenCalledWith(12345, 'Test User');
  });

  it('должен очистить данные о мотивационном сообщении', async () => {
    await botStartedHandler(mockContext as Context);

    expect(dbUserUtils.clearLastMotivationalMessage).toHaveBeenCalledWith(12345);
  });

  it('должен отправить приветственное сообщение', async () => {
    await botStartedHandler(mockContext as Context);

    expect(mockContext.reply).toHaveBeenCalled();
    const callArgs = vi.mocked(mockContext.reply).mock.calls[0];
    expect(callArgs[0]).toContain('Привет, Test User!');
  });

  it('должен не выполнять действия, если пользователь отсутствует', async () => {
    mockContext.user = undefined;

    await botStartedHandler(mockContext as Context);

    expect(dbUserUtils.upsertUser).not.toHaveBeenCalled();
    expect(mockContext.reply).not.toHaveBeenCalled();
  });

  it('должен добавить клавиатуру с ссылкой, если WEB_APP_URL задан и не localhost', async () => {
    process.env.WEB_APP_URL = 'https://example.com';

    await botStartedHandler(mockContext as Context);

    expect(mockContext.reply).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        attachments: expect.any(Array),
      })
    );
  });

  it('должен не добавлять клавиатуру, если WEB_APP_URL localhost', async () => {
    process.env.WEB_APP_URL = 'http://localhost:4173';

    await botStartedHandler(mockContext as Context);

    const callArgs = vi.mocked(mockContext.reply).mock.calls[0];
    expect(callArgs[1]).toBeDefined();
    if (callArgs[1] && callArgs[1].attachments) {
      const attachments = callArgs[1].attachments;
      expect(attachments).toBeDefined();
      expect(callArgs[0]).toContain('localhost:4173');
    }
  });
});

