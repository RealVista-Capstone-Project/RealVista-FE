'use client';

import { useState } from 'react';
import { ChatRoomComponent } from '@/features/chat';
import { useTranslations } from 'next-intl';

export function ChatView() {
  const t = useTranslations('Chat');
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('general');
  const [hasJoined, setHasJoined] = useState(false);
  const [secured, setSecured] = useState(false);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim() && roomId.trim()) {
      setHasJoined(true);
    }
  };

  const handleLeave = () => {
    setHasJoined(false);
    setUserName('');
  };

  if (!hasJoined) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>{t('joinRoom')}</h1>
          <p className='mb-6 text-sm text-gray-600'>{t('description')}</p>

          <form onSubmit={handleJoin} className='space-y-4'>
            <div>
              <label htmlFor='userName' className='mb-1 block text-sm font-medium text-gray-700'>
                {t('yourName')}
              </label>
              <input
                id='userName'
                type='text'
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder={t('yourNamePlaceholder')}
                required
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
              />
            </div>

            <div>
              <label htmlFor='roomId' className='mb-1 block text-sm font-medium text-gray-700'>
                {t('roomId')}
              </label>
              <input
                id='roomId'
                type='text'
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder={t('roomIdPlaceholder')}
                required
                className='w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'
              />
              <p className='mt-1 text-xs text-gray-500'>
                Common rooms: general, random, tech, gaming
              </p>
            </div>

            <div className='flex items-center gap-2'>
              <input
                id='secured'
                type='checkbox'
                checked={secured}
                onChange={(e) => setSecured(e.target.checked)}
                className='h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              />
              <label htmlFor='secured' className='text-sm font-medium text-gray-700'>
                Secured (requires authentication)
              </label>
            </div>

            <button
              type='submit'
              className='w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            >
              {t('joinButton')}
            </button>
          </form>

          <div className='mt-6 rounded-md bg-blue-50 p-4'>
            <h3 className='mb-2 text-sm font-semibold text-blue-900'>WebSocket Test Info</h3>
            <ul className='space-y-1 text-xs text-blue-800'>
              <li>• Uses SockJS + STOMP protocol</li>
              <li>• Auto-reconnects on disconnect</li>
              <li>• Shows typing indicators</li>
              <li>• Default endpoint: http://localhost:8080/ws</li>
              <li>• <strong>Secured mode:</strong> Sends JWT token, requires backend /app/secured endpoint</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='mx-auto max-w-4xl'>
        <div className='mb-4 flex items-center justify-between'>
          <h1 className='text-2xl font-bold text-gray-900'>{t('demoTitle')}</h1>
          <button
            onClick={handleLeave}
            className='rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'
          >
            {t('leaveRoom')}
          </button>
        </div>

        <ChatRoomComponent roomId={roomId} userName={userName} secured={secured} />

        <div className='mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-4'>
          <h3 className='mb-2 text-sm font-semibold text-yellow-900'>{t('testingNotes')}</h3>
          <ul className='space-y-1 text-xs text-yellow-800'>
            <li>• Open this page in multiple browser windows to test</li>
            <li>• Messages should appear in real-time across all windows</li>
            <li>• Check browser console for WebSocket connection logs</li>
            <li>• Green indicator = Connected, Red = Disconnected</li>
            <li>• Ensure Spring Boot backend is running on port 8080</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
