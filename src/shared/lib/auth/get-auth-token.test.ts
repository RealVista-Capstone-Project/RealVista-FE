import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock next-auth/react before importing the module
jest.mock('next-auth/react', () => ({
  getSession: jest.fn(),
}));

import {
  getAuthTokenSync,
  updateAuthTokenCache,
  getAuthTokenHybrid,
} from './get-auth-token';

describe('getAuthToken', () => {
  // Reset cache before each test
  beforeEach(() => {
    updateAuthTokenCache(null);
  });

  // Cleanup localStorage after tests that use it
  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
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

  describe('getAuthTokenHybrid', () => {
    beforeEach(() => {
      // Clear cache before each hybrid test
      updateAuthTokenCache(null);
      // Clear localStorage before each hybrid test
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    });

    it('should return cached token when available', () => {
      const cachedToken = 'cached-nextauth-token';
      updateAuthTokenCache(cachedToken);

      // Even if localStorage has a token, cached token takes priority
      localStorage.setItem('token', 'legacy-token');

      expect(getAuthTokenHybrid()).toBe(cachedToken);

      // Cleanup
      localStorage.removeItem('token');
    });

    it('should fallback to localStorage when cache is empty', () => {
      updateAuthTokenCache(null);
      const mockToken = 'legacy-token';
      localStorage.setItem('token', mockToken);

      expect(getAuthTokenHybrid()).toBe(mockToken);

      // Cleanup
      localStorage.removeItem('token');
    });

    it('should return null when both cache and localStorage are empty', () => {
      updateAuthTokenCache(null);
      // Ensure localStorage is empty
      const existing = localStorage.getItem('token');
      if (existing) {
        localStorage.removeItem('token');
      }

      expect(getAuthTokenHybrid()).toBeNull();
    });

    it('should prioritize cache over localStorage', () => {
      const cached = 'next-auth-token';
      const legacy = 'old-local-storage-token';

      updateAuthTokenCache(cached);
      localStorage.setItem('token', legacy);

      expect(getAuthTokenHybrid()).toBe(cached);
      expect(getAuthTokenHybrid()).not.toBe(legacy);

      // Cleanup
      localStorage.removeItem('token');
    });

    it('should switch from localStorage to cache when cache is updated', () => {
      // Start with only localStorage
      const legacyToken = 'legacy-token';
      localStorage.setItem('token', legacyToken);

      expect(getAuthTokenHybrid()).toBe(legacyToken);

      // Update cache - should now return cached token
      const nextAuthToken = 'next-auth-token';
      updateAuthTokenCache(nextAuthToken);

      expect(getAuthTokenHybrid()).toBe(nextAuthToken);
      expect(getAuthTokenHybrid()).not.toBe(legacyToken);

      // Cleanup
      localStorage.removeItem('token');
    });

    it('should return null after cache is cleared', () => {
      // Set cache
      updateAuthTokenCache('some-token');
      expect(getAuthTokenHybrid()).toBe('some-token');

      // Clear cache
      updateAuthTokenCache(null);

      // Should return null (assuming localStorage is also empty)
      const existing = localStorage.getItem('token');
      if (existing) {
        localStorage.removeItem('token');
      }

      expect(getAuthTokenHybrid()).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      updateAuthTokenCache(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
      }
    });

    it('should handle login flow (null -> token)', () => {
      // Initially not logged in
      expect(getAuthTokenSync()).toBeNull();
      expect(getAuthTokenHybrid()).toBeNull();

      // User logs in, token is cached
      const userToken = 'user-auth-token';
      updateAuthTokenCache(userToken);

      expect(getAuthTokenSync()).toBe(userToken);
      expect(getAuthTokenHybrid()).toBe(userToken);
    });

    it('should handle logout flow (token -> null)', () => {
      // User is logged in
      updateAuthTokenCache('logged-in-token');
      expect(getAuthTokenSync()).toBe('logged-in-token');

      // User logs out
      updateAuthTokenCache(null);
      expect(getAuthTokenSync()).toBeNull();
    });

    it('should handle token refresh flow', () => {
      const oldToken = 'old-expired-token';
      const newToken = 'new-refreshed-token';

      // Initial token
      updateAuthTokenCache(oldToken);
      expect(getAuthTokenSync()).toBe(oldToken);

      // Token refreshed
      updateAuthTokenCache(newToken);
      expect(getAuthTokenSync()).toBe(newToken);
      expect(getAuthTokenSync()).not.toBe(oldToken);
    });
  });
});
