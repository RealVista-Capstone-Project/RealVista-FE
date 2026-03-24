'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { type Notification } from '@/entities/notification';
import { NotificationDropdown } from './notification-dropdown';

// ---------------------------------------------------------------------------
// Mock data — remove once the real API is wired up
// ---------------------------------------------------------------------------
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    type: 'OPEN_DRAFT',
    title: '701 Buckingham Unit 12 has an open draft',
    createdAt: new Date('2021-12-12T10:13:00'),
    isRead: false,
    targetUrl: '/listings/701-buckingham',
  },
  {
    id: '2',
    type: 'TENANT_APPLICATION',
    title: 'Tenant applications from Valentino Parker',
    createdAt: new Date('2021-12-11T09:10:00'),
    isRead: false,
    actor: {
      id: 'u2',
      name: 'Valentino Parker',
      avatar: 'https://i.pravatar.cc/40?u=valentino',
    },
    targetUrl: '/applications/valentino-parker',
  },
  {
    id: '3',
    type: 'TOUR_REQUEST',
    title: "Beverly Springfield tour request by Jason O'Neill",
    createdAt: new Date('2021-12-04T13:38:00'),
    isRead: true,
    actor: {
      id: 'u3',
      name: "Jason O'Neill",
      avatar: 'https://i.pravatar.cc/40?u=jason',
    },
    targetUrl: '/tours/beverly-springfield',
  },
  {
    id: '4',
    type: 'GENERAL',
    title: 'Your listing at 204 Oak Street is now live',
    createdAt: new Date('2021-12-01T08:00:00'),
    isRead: true,
    targetUrl: '/listings/204-oak-street',
  },
];
// ---------------------------------------------------------------------------

export function NotificationDropdownContainer() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const router = useRouter();
  const params = useParams();

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <NotificationDropdown
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAllRead={handleMarkAllRead}
      onNotificationClick={(n) => {
        if (n.targetUrl) {
          const locale = params.locale as string;
          router.push(`/${locale}${n.targetUrl}`);
        }
      }}
      onViewAll={() => {
        const locale = params.locale as string;
        router.push(`/${locale}/notifications`);
      }}
    />
  );
}
