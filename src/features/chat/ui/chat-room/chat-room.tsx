'use client';

/**
 * ChatRoom Component (Legacy)
 *
 * This component is deprecated and was part of the initial WebSocket demo.
 * It has been disabled to avoid conflicts with the new conversation-based
 * chat architecture and to resolve CI/CD build failures.
 */
export function ChatRoom({
  roomId,
  userName,
}: {
  roomId: string;
  userName: string;
  secured?: boolean;
}) {
  return (
    <div className='flex h-[400px] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center'>
      <div>
        <h3 className='mb-2 text-lg font-medium text-gray-900'>Legacy Chat Room</h3>
        <p className='text-sm text-gray-500 mb-4'>
          Room: <span className='font-semibold'>{roomId}</span> | User:{' '}
          <span className='font-semibold'>{userName}</span>
        </p>
        <p className='text-sm text-gray-500'>
          This component is currently disabled as we have migrated to a conversation-based chat
          system. Please use the new Floating Chat Window or Conversation List instead.
        </p>
      </div>
    </div>
  );
}

export default ChatRoom;
