import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatRoom } from './chat-room';
import type { ChatMessage } from '../model/types';

// Mock the useChatWebSocket hook
jest.mock('../api/use-chat-websocket');

// Mock the env
jest.mock('@/shared/lib/env', () => ({
  env: {
    NEXT_PUBLIC_WS_ENDPOINT: 'ws://localhost:8080/ws',
  },
}));

import { useChatWebSocket } from '../api/use-chat-websocket';

describe('ChatRoom Component', () => {
  let mockSendMessage: jest.Mock;
  let mockJoinRoom: jest.Mock;
  let mockLeaveRoom: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSendMessage = jest.fn();
    mockJoinRoom = jest.fn();
    mockLeaveRoom = jest.fn();

    (useChatWebSocket as jest.Mock).mockReturnValue({
      isConnected: false,
      state: 'idle',
      messages: [],
      typingUsers: [],
      sendMessage: mockSendMessage,
      joinRoom: mockJoinRoom,
      leaveRoom: mockLeaveRoom,
      disconnect: jest.fn(),
    });
  });

  describe('rendering', () => {
    it('should render chat room UI', () => {
      render(<ChatRoom roomId='test-room' userName='test-user' />);

      expect(screen.getByText(/chat room: test-room/i)).toBeInTheDocument();
      expect(screen.getByText(/logged in as test-user/i)).toBeInTheDocument();
    });

    it('should show disconnected status when not connected', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: false,
        state: 'disconnected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      expect(screen.getByText(/disconnected/i)).toBeInTheDocument();
    });

    it('should show connected status when connected', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      expect(screen.getByText(/connected/i)).toBeInTheDocument();
    });

    it('should show connecting status when connecting', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: false,
        state: 'connecting',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      expect(screen.getByText(/connecting\.\.\./i)).toBeInTheDocument();
    });

    it('should render empty message state', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      expect(screen.getByText(/no messages yet/i)).toBeInTheDocument();
    });

    it('should render messages', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          senderId: 1,
          senderName: 'Alice',
          content: 'Hello world',
          timestamp: Date.now(),
        },
        {
          id: 'msg-2',
          senderId: 2,
          senderName: 'Bob',
          content: 'How are you?',
          timestamp: Date.now(),
        },
      ];

      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages,
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      expect(screen.getByText('Hello world')).toBeInTheDocument();
      expect(screen.getByText('How are you?')).toBeInTheDocument();
    });
  });

  describe('message styling', () => {
    it('should style own messages differently', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          senderId: 1,
          senderName: 'test-user',
          content: 'My message',
          timestamp: Date.now(),
        },
      ];

      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages,
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      const messageElement = screen.getByText('My message').closest('div');
      expect(messageElement).toHaveClass('bg-blue-500');
    });

    it('should show sender name for other users messages', () => {
      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          senderId: 2,
          senderName: 'Alice',
          content: 'Hello',
          timestamp: Date.now(),
        },
      ];

      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages,
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  describe('send message', () => {
    it('should send message when form is submitted', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
      expect(input).toHaveValue('');
    });

    it('should send message when Enter key is pressed', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      const input = screen.getByPlaceholderText(/type a message/i);

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.submit(input.closest('form')!);

      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });

    it('should not send empty messages', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.click(sendButton);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should disable send button when not connected', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: false,
        state: 'disconnected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      const input = screen.getByPlaceholderText(/type a message/i);
      const sendButton = screen.getByRole('button', { name: /send/i });

      expect(input).toBeDisabled();
      expect(sendButton).toBeDisabled();
    });

    it('should disable send button when input is empty', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      const sendButton = screen.getByRole('button', { name: /send/i });

      expect(sendButton).toBeDisabled();
    });
  });

  describe('join/leave room', () => {
    it('should join room on mount when connected', async () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      await waitFor(() => {
        expect(mockJoinRoom).toHaveBeenCalledWith('test-user');
      });
    });

    it('should leave room on unmount when connected', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      const { unmount } = render(<ChatRoom roomId='test-room' userName='test-user' />);

      unmount();

      expect(mockLeaveRoom).toHaveBeenCalledWith('test-user');
    });
  });

  describe('message timestamps', () => {
    it('should display message timestamps', () => {
      const timestamp = new Date('2026-01-17T10:30:00').getTime();

      const messages: ChatMessage[] = [
        {
          id: 'msg-1',
          senderId: 1,
          senderName: 'test-user',
          content: 'Test message',
          timestamp,
        },
      ];

      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages,
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      render(<ChatRoom roomId='test-room' userName='test-user' />);

      // The timestamp should be displayed
      const timeString = new Date(timestamp).toLocaleTimeString();
      expect(screen.getByText(timeString)).toBeInTheDocument();
    });
  });

  describe('connection status indicator', () => {
    it('should show green indicator when connected', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: true,
        state: 'connected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      const { container } = render(<ChatRoom roomId='test-room' userName='test-user' />);

      const indicator = container.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });

    it('should show red indicator when disconnected', () => {
      (useChatWebSocket as jest.Mock).mockReturnValue({
        isConnected: false,
        state: 'disconnected',
        messages: [],
        typingUsers: [],
        sendMessage: mockSendMessage,
        joinRoom: mockJoinRoom,
        leaveRoom: mockLeaveRoom,
        disconnect: jest.fn(),
      });

      const { container } = render(<ChatRoom roomId='test-room' userName='test-user' />);

      const indicator = container.querySelector('.bg-red-500');
      expect(indicator).toBeInTheDocument();
    });
  });
});
