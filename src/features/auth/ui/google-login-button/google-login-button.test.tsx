import { render, screen, waitFor } from '@testing-library/react';
import { GoogleLoginButton } from './google-login-button';
import { useLocale } from 'next-intl';

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: jest.fn(),
}));

const mockUseLocale = useLocale as jest.Mock;

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    // Mock locale hook
    mockUseLocale.mockReturnValue('vi');

    // Mock window.location to avoid actual redirects
    delete (window as any).location;
    window.location = { href: '', origin: 'http://localhost:3000' } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders button with correct text', () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with outline variant', () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toHaveClass('border');
  });

  it('renders with full width', () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    expect(button).toHaveClass('w-full');
  });

  it('renders Google icon with correct colors', () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Check for paths with Google brand colors
    const paths = svg?.querySelectorAll('path');
    expect(paths).toHaveLength(4);

    // Verify each path has a fill attribute (Google colors)
    paths?.forEach((path) => {
      expect(path).toHaveAttribute('fill');
    });
  });

  it('redirects to OAuth endpoint with correct URL when clicked', () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });

    button.click();

    expect(window.location.href).toBe(
      'http://localhost:8080/api/v1/auth/login-google?redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fvi%2Fauth%2Fcallback'
    );
  });

  it('uses English locale when locale is "en"', () => {
    mockUseLocale.mockReturnValue('en');
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });

    button.click();

    // URL is encoded, so check for the encoded version
    expect(window.location.href).toContain('%2Fen%2Fauth%2Fcallback');
  });

  it('uses Vietnamese locale when locale is "vi"', () => {
    mockUseLocale.mockReturnValue('vi');
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });

    button.click();

    // URL is encoded, so check for the encoded version
    expect(window.location.href).toContain('%2Fvi%2Fauth%2Fcallback');
  });

  it('shows loading spinner when loading', async () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });

    // Click to start loading
    button.click();

    // Wait for state update and check for loader
    await waitFor(() => {
      expect(button).toBeDisabled();
    });

    const loader = button.querySelector('.animate-spin');
    expect(loader).toBeInTheDocument();
  });

  it('is disabled while loading', async () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });

    // Initially not disabled
    expect(button).not.toBeDisabled();

    // Click to start loading
    button.click();

    // Wait for state update
    await waitFor(() => {
      expect(button).toBeDisabled();
    });
  });

  it('uses correct backend OAuth URL', () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });

    button.click();

    expect(window.location.href).toMatch(
      /^http:\/\/localhost:8080\/api\/v1\/auth\/login-google/
    );
  });

  it('encodes redirect URI parameter correctly', () => {
    render(<GoogleLoginButton />);
    const button = screen.getByRole('button', { name: /continue with google/i });

    button.click();

    // Check that special characters in redirect URI are encoded
    expect(window.location.href).toContain('redirect_uri=');
    expect(window.location.href).toContain('http%3A%2F%2F');
  });
});
