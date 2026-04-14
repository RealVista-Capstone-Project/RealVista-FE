import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationItem } from './notification-item';
import type { Notification } from '@/entities/notification';

const mockNotification: Notification = {
  id: 'n-1',
  eventType: 'TOUR_REQUESTED',
  entityType: 'APPOINTMENT',
  entityId: 'appt-1',
  title: 'New tour request',
  message: 'Someone wants a tour',
  createdAt: new Date('2024-06-01T12:00:00Z'),
  isRead: false,
  metadata: null,
};

describe('NotificationItem', () => {
  it('renders title and message', () => {
    render(<NotificationItem notification={mockNotification} />);
    expect(screen.getByText('New tour request')).toBeInTheDocument();
    expect(screen.getByText('Someone wants a tour')).toBeInTheDocument();
  });

  it('renders the × delete button when onDelete is provided', () => {
    const onDelete = jest.fn();
    render(<NotificationItem notification={mockNotification} onDelete={onDelete} />);
    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    expect(deleteBtn).toBeInTheDocument();
  });

  it('does NOT render delete button when onDelete is omitted', () => {
    render(<NotificationItem notification={mockNotification} />);
    expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
  });

  it('calls onDelete with notification.id when × is clicked', () => {
    const onDelete = jest.fn();
    render(<NotificationItem notification={mockNotification} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('n-1');
  });

  it('does not call onClick when × is clicked (stopPropagation)', () => {
    const onClick = jest.fn();
    const onDelete = jest.fn();
    render(
      <NotificationItem notification={mockNotification} onClick={onClick} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith('n-1');
    expect(onClick).not.toHaveBeenCalled();
  });
});
