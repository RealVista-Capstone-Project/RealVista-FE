import { EntityError } from '../http/http';
import { handleErrorApi } from './handle-error';

// Mock toast from sonner - must be defined inline due to jest.mock hoisting
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
  },
}));

// Import the mocked type
import { toast } from 'sonner';

const toastMock = toast as jest.Mocked<typeof toast>;

describe('handleErrorApi', () => {
  const mockSetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('handles EntityError with setError callback', () => {
    const error = new EntityError({
      status: 422,
      payload: {
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' },
        ],
      },
    });

    handleErrorApi({ error, setError: mockSetError });

    expect(mockSetError).toHaveBeenCalledWith('email', {
      type: 'server',
      message: 'Invalid email format',
    });
    expect(mockSetError).toHaveBeenCalledWith('password', {
      type: 'server',
      message: 'Password too short',
    });
    expect(mockSetError).toHaveBeenCalledTimes(2);
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('handles EntityError without setError callback', () => {
    const error = new EntityError({
      status: 422,
      payload: {
        message: 'Validation failed',
        errors: [{ field: 'email', message: 'Invalid email' }],
      },
    });

    handleErrorApi({ error });

    expect(toastMock.error).toHaveBeenCalledWith('Validation failed', {
      duration: 5000,
    });
  });

  it('handles HttpError with toast', () => {
    const error = new Error('Network error') as any;
    error.payload = { message: 'Something went wrong' };

    handleErrorApi({ error });

    expect(toastMock.error).toHaveBeenCalledWith('Something went wrong', {
      duration: 5000,
    });
  });

  it('handles error without payload message', () => {
    const error = new Error('Unknown error') as any;
    error.payload = {};

    handleErrorApi({ error });

    expect(toastMock.error).toHaveBeenCalledWith('Đã xảy ra lỗi. Vui lòng thử lại.', {
      duration: 5000,
    });
  });

  it('handles error without payload', () => {
    const error = new Error('Unknown error') as any;

    handleErrorApi({ error });

    expect(toastMock.error).toHaveBeenCalledWith('Đã xảy ra lỗi. Vui lòng thử lại.', {
      duration: 5000,
    });
  });

  it('uses custom duration when provided', () => {
    const error = new Error('Custom duration error') as any;
    error.payload = { message: 'Test message' };

    handleErrorApi({ error, duration: 3000 });

    expect(toastMock.error).toHaveBeenCalledWith('Test message', {
      duration: 3000,
    });
  });

  it('handles empty errors array in EntityError', () => {
    const error = new EntityError({
      status: 422,
      payload: {
        message: 'Validation failed',
        errors: [],
      },
    });

    handleErrorApi({ error, setError: mockSetError });

    expect(mockSetError).not.toHaveBeenCalled();
  });
});
