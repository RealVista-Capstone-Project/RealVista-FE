import { notificationApi } from './notification.api';

describe('notificationApi.deleteNotification', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('is defined on notificationApi', () => {
    expect(typeof notificationApi.deleteNotification).toBe('function');
  });

  it('calls DELETE /notifications/:id with Bearer token', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await notificationApi.deleteNotification('nid-abc', 'tok-xyz');

    const [url, opts] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain('/notifications/nid-abc');
    expect(opts.method).toBe('DELETE');
    expect(opts.headers.Authorization).toBe('Bearer tok-xyz');
  });

  it('throws on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(
      notificationApi.deleteNotification('missing-id', 'tok-xyz')
    ).rejects.toThrow('HTTP 404');
  });
});
