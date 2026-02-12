'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { ContactModal } from '@/widgets/contact-modal';
import { ChatDropdown } from '@/widgets/chat-dropdown';
import { FloatingChatWindow } from '@/widgets/floating-chat-window';
import { ChatWindowProvider, useChatWindows } from '@/shared/context/chat-window-context';
import type {
  ChatListingData,
  UserContactInfo,
  Conversation,
  ChatMessageData,
} from '@/entities/contact';

// Mock data for demonstration
const mockUserInfo: UserContactInfo = {
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 234 567 8900',
};

const mockListing: ChatListingData = {
  id: '1',
  title: 'Beautiful Modern Apartment in Downtown',
  image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
  price: 2500,
  currency: '$',
  address: '123 Main St, New York, NY 10001',
  beds: 2,
  bathrooms: 2,
  area: 85,
};

const mockConversations: Conversation[] = [
  {
    id: '1',
    participant: { id: 'agent1', name: 'Sarah Johnson', avatar: 'https://i.pravatar.cc/150?img=1' },
    lastMessage: "I'd love to schedule a viewing for next week!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 5),
    unreadCount: 2,
    listing: mockListing,
  },
  {
    id: '2',
    participant: { id: 'agent2', name: 'Michael Chen' },
    lastMessage: 'The property is still available. Would you like to make an offer?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30),
    unreadCount: 0,
  },
  {
    id: '3',
    participant: { id: 'agent3', name: 'Emily Davis', avatar: 'https://i.pravatar.cc/150?img=5' },
    lastMessage: 'Thank you for your interest!',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2),
    unreadCount: 1,
  },
];

const mockMessages: ChatMessageData[] = [
  {
    id: '1',
    content: "Hi, I'm interested in viewing this property. Is it still available?",
    senderId: 'user',
    senderName: 'You',
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    isOwn: true,
    listing: mockListing,
  },
  {
    id: '2',
    content:
      'Hello! Yes, the property is still available. When would you like to schedule a viewing?',
    senderId: 'agent1',
    senderName: 'Sarah Johnson',
    timestamp: new Date(Date.now() - 1000 * 60 * 8),
    isOwn: false,
  },
  {
    id: '3',
    content: "I'm available this Saturday afternoon, around 2-4 PM. Does that work?",
    senderId: 'user',
    senderName: 'You',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isOwn: true,
  },
];

function ContactDemoContent() {
  const t = useTranslations('Contact');
  const { windows, openWindow, closeWindow, toggleMinimize } = useChatWindows();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageData[]>(mockMessages);

  const handleConversationClick = (conversation: Conversation) => {
    openWindow(conversation.id, conversation.participant, conversation.listing);
  };

  const handleSendMessage = async (content: string) => {
    const newMessage: ChatMessageData = {
      id: String(Date.now()),
      content,
      senderId: 'user',
      senderName: 'You',
      timestamp: new Date(),
      isOwn: true,
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const totalUnread = mockConversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <div className='min-h-screen bg-grey-50 p-8'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-8 text-3xl font-bold text-main-black'>Contact Feature Demo</h1>

        {/* Demo Controls */}
        <div className='mb-8 rounded-lg border border-border bg-white p-6 shadow-sm'>
          <h2 className='mb-4 text-xl font-semibold text-main-black'>Test Components</h2>

          <div className='flex flex-wrap items-center gap-4'>
            {/* Contact Modal Trigger */}
            <Button onClick={() => setIsContactModalOpen(true)}>
              <MessageSquare className='mr-2 h-4 w-4' />
              Open Contact Modal
            </Button>

            {/* Chat Dropdown */}
            <div className='flex items-center gap-2'>
              <span className='text-sm text-grey-500'>Chat Dropdown:</span>
              <ChatDropdown
                conversations={mockConversations}
                unreadCount={totalUnread}
                onConversationClick={handleConversationClick}
                onViewAll={() => console.log('View all clicked')}
                onMarkAllRead={() => console.log('Mark all read clicked')}
              />
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        <ContactModal
          open={isContactModalOpen}
          onOpenChange={setIsContactModalOpen}
          listing={mockListing}
          userInfo={mockUserInfo}
          agentName='Sarah Johnson'
          onSend={async (data) => {
            console.log('Contact form submitted:', data);
          }}
        />

        {/* Floating Chat Windows */}
        {windows.map((window, index) => (
          <FloatingChatWindow
            key={window.id}
            id={window.id}
            participant={window.participant}
            messages={messages}
            listing={window.listing}
            isMinimized={window.isMinimized}
            position={index}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => toggleMinimize(window.id)}
            onSendMessage={handleSendMessage}
          />
        ))}

        {/* Instructions */}
        <div className='rounded-lg border border-border bg-white p-6 shadow-sm'>
          <h2 className='mb-4 text-xl font-semibold text-main-black'>How to Test</h2>
          <ul className='list-inside list-disc space-y-2 text-grey-600'>
            <li>
              <strong>Contact Modal:</strong> Click &quot;Open Contact Modal&quot; to see the form with
              pre-filled user info
            </li>
            <li>
              <strong>Chat Dropdown:</strong> Click the message icon to see conversation list with
              unread badges
            </li>
            <li>
              <strong>Floating Chat:</strong> Click a conversation in the dropdown to open a chat
              window
            </li>
            <li>
              <strong>Multiple Windows:</strong> Open multiple conversations to see stacked windows
            </li>
            <li>
              <strong>Minimize/Close:</strong> Use window controls to minimize or close chat windows
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ContactDemoPage() {
  return (
    <ChatWindowProvider>
      <ContactDemoContent />
    </ChatWindowProvider>
  );
}
