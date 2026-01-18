import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChatRoom } from './chat-room';

// Mock the env
jest.mock('@/shared/lib/env', () => ({
  env: {
    NEXT_PUBLIC_WS_ENDPOINT: 'ws://localhost:8080/ws',
  },
}));

// Mock useChatWebSocket
jest.mock('../api/use-chat-websocket', () => ({
  useChatWebSocket: jest.fn(),
}));

import { useChatWebSocket } from '../api/use-chat-websocket';

describe('ChatRoom Component', () => {
  let mockSendMessage: jest.Mock;
  let mockJoinRoom: jest.Mock;
  let mockLeaveRoom: jest.Mock;
  let mockOnNewMessage: jest.Mock;
  let mockOnError: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSendMessage = jest.fn();
    mockJoinRoom = jest.fn();
    mockLeaveRoom = jest.fn();
    mockOnNewMessage = jest.fn();
    mockOnError = jest.fn();

    // Default mock implementation
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
