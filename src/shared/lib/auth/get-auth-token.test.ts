import { describe, it, expect, beforeEach } from '@jest/globals';

// Mock next-auth/react before importing the module
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));

import {
  getAuthTokenSync,
  updateAuthTokenCache,
} from './get-auth-token';

describe('getAuthToken', () => {
  // Reset cache before each test
  beforeEach(() => {
    updateAuthTokenCache(null);
  });

  describe('getAuthTokenSync', () => {
    it('should return null when cache is empty', () => {
      expect(getAuthTokenSync()).toBeNull();
    });

    it('should return cached token', () => {
      const token = 'test-token-123';
      updateAuthTokenCache(token);
      expect(getAuthTokenSync()).toBe(token);
    });

    it('should update cache correctly', () => {
      updateAuthTokenCache('token1');
      expect(getAuthTokenSync()).toBe('token1');

      updateAuthTokenCache('token2');
      expect(getAuthTokenSync()).toBe('token2');

      updateAuthTokenCache('token3');
      expect(getAuthTokenSync()).toBe('token3');
    });

    it('should handle null token', () => {
      updateAuthTokenCache('some-token');
      expect(getAuthTokenSync()).toBe('some-token');

      updateAuthTokenCache(null);
      expect(getAuthTokenSync()).toBeNull();
    });

    it('should handle empty string token', () => {
      updateAuthTokenCache('');
      expect(getAuthTokenSync()).toBe('');
    });
  });

  describe('updateAuthTokenCache', () => {
    it('should update the cache', () => {
      updateAuthTokenCache('new-token');
      expect(getAuthTokenSync()).toBe('new-token');
    });

    it('should clear the cache with null', () => {
      updateAuthTokenCache('existing-token');
      expect(getAuthTokenSync()).toBe('existing-token');

      updateAuthTokenCache(null);
      expect(getAuthTokenSync()).toBeNull();
    });

    it('should handle rapid updates', () => {
      const tokens = ['token1', 'token2', 'token3', 'token4', 'token5'];

      tokens.forEach((token) => {
        updateAuthTokenCache(token);
        expect(getAuthTokenSync()).toBe(token);
      });
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      updateAuthTokenCache(null);
    });

    it('should handle login flow (null -> token)', () => {
      // Initially not logged in
      expect(getAuthTokenSync()).toBeNull();

      // User logs in, token is cached
      const userToken = 'user-auth-token';
      updateAuthTokenCache(userToken);

      expect(getAuthTokenSync()).toBe(userToken);
    });

    it('should handle logout flow (token -> null)', () => {
      // User is logged in
      updateAuthTokenCache('logged-in-token');
      expect(getAuthTokenSync()).toBe('logged-in-token');

      // User logs out
      updateAuthTokenCache(null);
      expect(getAuthTokenSync()).toBeNull();
    });

    it('should handle token refresh', () => {
      const oldToken = 'old-expired-token';
      const newToken = 'new-refreshed-token';

      updateAuthTokenCache(oldToken);
      expect(getAuthTokenSync()).toBe(oldToken);

      updateAuthTokenCache(newToken);
      expect(getAuthTokenSync()).toBe(newToken);
    });
  });

  describe('performance', () => {
    it('should have O(1) access time', () => {
      updateAuthTokenCache('perf-test-token');

      // Multiple reads should be instant
      const start = Date.now();
      for (let i = 0; i < 10000; i++) {
        getAuthTokenSync();
      }
      const end = Date.now();

      // 10,000 reads should take < 10ms (O(1) access)
      expect(end - start).toBeLessThan(10);
    });
  });
});
