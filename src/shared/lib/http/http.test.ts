import { HttpError, EntityError } from './http';
import http from './http';

// Mock getAuthTokenSync and getAuthToken to avoid NextAuth import issues
jest.mock('@/shared/lib/auth/get-auth-token', () => ({
  getAuthTokenSync: jest.fn(),
  getAuthToken: jest.fn(),
}));

import { getAuthTokenSync } from '@/shared/lib/auth/get-auth-token';

// Mock fetch
global.fetch = jest.fn();

describe('HTTP Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as any).mockClear();
  });

  const mockHeaders = {
    get: jest.fn().mockReturnValue('application/json'),
  };

  describe('GET request', () => {
    it('makes a successful GET request', async () => {
      const mockData = { id: 1, name: 'Test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce(mockData),
      });

      const response = await http.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.test.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.any(Object),
        })
      );
      expect(response).toEqual({
        status: 200,
        payload: mockData,
      });
    });

    it('includes Authorization header when sessionToken exists', async () => {
      (getAuthTokenSync as jest.Mock).mockReturnValueOnce('test-token');

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await http.get('/protected');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('POST request', () => {
    it('makes a POST request with JSON body', async () => {
      const mockBody = { name: 'Test User' };
      const mockResponse = { success: true };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce(mockResponse),
      });

      const response = await http.post('/users', mockBody);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockBody),
        })
      );
      expect(response).toEqual({
        status: 201,
        payload: mockResponse,
      });
    });

    it('handles FormData body', async () => {
      const formData = new FormData();
      formData.append('file', 'test');
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce({ success: true }),
      });

      await http.post('/upload', formData);

      const fetchCall = (global.fetch as any).mock.calls[0];
      expect(fetchCall[1].body).toBe(formData);
      expect(fetchCall[1].headers).not.toHaveProperty('Content-Type');
    });
  });

  describe('PUT request', () => {
    it('makes a PUT request', async () => {
      const mockBody = { id: 1, name: 'Updated' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce(mockBody),
      });

      const response = await http.put('/users/1', mockBody);

      expect(response).toEqual({
        status: 200,
        payload: mockBody,
      });
    });
  });

  describe('PATCH request', () => {
    it('makes a PATCH request', async () => {
      const mockBody = { name: 'Partial Update' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce(mockBody),
      });

      const response = await http.patch('/users/1', mockBody);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
      expect(response.payload).toEqual(mockBody);
    });
  });

  describe('DELETE request', () => {
    it('makes a DELETE request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 204,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await http.delete('/users/1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('Error handling', () => {
    it('throws EntityError for 422 status', async () => {
      const mockErrors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Password too short' },
      ];
      const mockResponse = {
        ok: false,
        status: 422,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValue({
          message: 'Validation failed',
          errors: mockErrors,
        }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(http.post('/users', {})).rejects.toThrow(EntityError);

      try {
        await http.post('/users', {});
      } catch (error) {
        expect(error).toBeInstanceOf(EntityError);
        expect((error as EntityError).status).toBe(422);
        expect((error as EntityError).payload.errors).toEqual(mockErrors);
      }
    });

    it('throws HttpError for other error statuses', async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValue({ message: 'Internal Server Error' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(http.get('/error')).rejects.toThrow(HttpError);

      try {
        await http.get('/error');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpError);
        expect((error as HttpError).status).toBe(500);
      }
    });

    it('throws HttpError for 404 status', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValue({ message: 'Not Found' }),
      };
      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(http.get('/not-found')).rejects.toThrow(HttpError);
    });
  });

  describe('Custom baseUrl', () => {
    it('uses custom baseUrl when provided', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await http.get('/test', { baseUrl: 'https://custom.api.com' });

      expect(global.fetch).toHaveBeenCalledWith('https://custom.api.com/test', expect.any(Object));
    });

    it('uses empty baseUrl for Next.js API routes', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await http.get('/api/hello', { baseUrl: '' });

      expect(global.fetch).toHaveBeenCalledWith('/api/hello', expect.any(Object));
    });
  });

  describe('URL handling', () => {
    it('handles URLs starting with /', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await http.get('/test');

      expect(global.fetch).toHaveBeenCalledWith('https://api.test.com/test', expect.any(Object));
    });

    it('handles URLs without leading /', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: mockHeaders,
        json: jest.fn().mockResolvedValueOnce({}),
      });

      await http.get('test');

      expect(global.fetch).toHaveBeenCalledWith('https://api.test.com/test', expect.any(Object));
    });
  });
});
