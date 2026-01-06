import { render, screen } from '@testing-library/react';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';

describe('Avatar Components', () => {
  describe('Avatar', () => {
    it('renders avatar container', () => {
      render(<Avatar data-testid='avatar' />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(<Avatar className='custom-class' data-testid='avatar' />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass('custom-class');
    });

    it('has base classes', () => {
      render(<Avatar data-testid='avatar' />);
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toHaveClass(
        'relative',
        'flex',
        'size-8',
        'shrink-0',
        'overflow-hidden',
        'rounded-full'
      );
    });
  });

  describe('AvatarFallback', () => {
    it('renders fallback text', () => {
      render(
        <Avatar>
          <AvatarFallback>JD</AvatarFallback>
        </Avatar>
      );
      expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      render(
        <Avatar>
          <AvatarFallback className='bg-red-500'>JD</AvatarFallback>
        </Avatar>
      );
      const fallback = screen.getByText('JD');
      expect(fallback).toHaveClass('bg-red-500');
    });

    it('has base classes', () => {
      render(
        <Avatar>
          <AvatarFallback data-testid='fallback'>Test</AvatarFallback>
        </Avatar>
      );
      const fallback = screen.getByTestId('fallback');
      expect(fallback).toHaveClass(
        'bg-muted',
        'flex',
        'size-full',
        'items-center',
        'justify-center',
        'rounded-full'
      );
    });

    it('renders with AvatarImage (fallback shows by default)', () => {
      render(
        <Avatar>
          <AvatarImage src='https://example.com/avatar.png' alt='Avatar' />
          <AvatarFallback data-testid='fallback'>AB</AvatarFallback>
        </Avatar>
      );
      // With Radix UI Avatar, both components are present in DOM
      expect(screen.getByTestId('fallback')).toBeInTheDocument();
    });
  });

  describe('Integration', () => {
    it('renders complete avatar with image and fallback', () => {
      render(
        <Avatar data-testid='avatar'>
          <AvatarImage src='https://example.com/avatar.png' alt='User avatar' />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      );
      const avatar = screen.getByTestId('avatar');
      expect(avatar).toBeInTheDocument();
      expect(screen.getByText('U')).toBeInTheDocument();
    });

    it('renders multiple avatars', () => {
      render(
        <>
          <Avatar data-testid='avatar1'>
            <AvatarFallback>AB</AvatarFallback>
          </Avatar>
          <Avatar data-testid='avatar2'>
            <AvatarFallback>CD</AvatarFallback>
          </Avatar>
        </>
      );
      expect(screen.getByTestId('avatar1')).toBeInTheDocument();
      expect(screen.getByTestId('avatar2')).toBeInTheDocument();
    });
  });
});
