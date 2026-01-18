# WebSocket Implementation for Spring Boot

This WebSocket implementation uses **SockJS** and **STOMP** protocol to communicate with a Spring Boot backend.

## Architecture

### Files Created

```
src/
├── shared/
│   ├── types/
│   │   └── websocket.ts           # WebSocket type definitions
│   └── lib/
│       └── websocket/
│           ├── index.ts           # Public API exports
│           ├── websocket.service.ts   # Core WebSocket service
│           ├── use-websocket.ts   # React hook for WebSocket
│           └── websocket.store.ts # Zustand store for global state
└── features/
    └── chat/
        ├── model/
        │   └── types.ts           # Chat domain types
        ├── api/
        │   └── use-chat-websocket.ts  # Chat-specific WebSocket hook
        └── ui/
            └── chat-room.tsx      # Example chat component
```

## Spring Boot Backend Configuration

Your Spring Boot backend should have WebSocket configured like this:

```java
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }
}
```

## Usage

### Basic Usage with React Hook

```tsx
'use client';

import { useWebSocket } from '@/shared/lib/websocket';

function MyComponent() {
  const { isConnected, subscribe, send, state } = useWebSocket({
    endpoint: 'http://localhost:8080/ws',
    onConnect: () => console.log('Connected!'),
    onDisconnect: () => console.log('Disconnected'),
    onError: (error) => console.error(error),
  });

  // Subscribe to a topic
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe({
      destination: '/topic/messages',
      onMessage: (msg) => {
        const data = JSON.parse(msg.body);
        console.log('Received:', data);
      },
    });

    return unsubscribe;
  }, [isConnected, subscribe]);

  // Send a message
  const handleSend = () => {
    send({
      destination: '/app/chat',
      body: { text: 'Hello!' },
    });
  };

  return (
    <div>
      <p>State: {state}</p>
      <button onClick={handleSend}>Send</button>
    </div>
  );
}
```

### Chat Feature Example

```tsx
import { ChatRoom } from '@/features/chat';

function ChatPage() {
  return (
    <ChatRoom
      roomId="room-123"
      userName="John Doe"
    />
  );
}
```

### Advanced Usage with WebSocketService Class

```tsx
import { WebSocketService } from '@/shared/lib/websocket';

const wsService = new WebSocketService({
  endpoint: 'http://localhost:8080/ws',
  onConnect: () => console.log('Connected'),
  onDisconnect: () => console.log('Disconnected'),
  onError: (error) => console.error(error),
  debug: true,
  autoReconnect: true,
  reconnectDelay: 3000,
  maxReconnectAttempts: 5,
});

// Connect
wsService.connect();

// Subscribe
const unsubscribe = wsService.subscribe({
  destination: '/topic/messages',
  onMessage: (msg) => console.log(msg.body),
});

// Send
wsService.send({
  destination: '/app/chat',
  body: { text: 'Hello!' },
});

// Disconnect
wsService.disconnect();
```

## STOMP Endpoints

### Common Spring Boot STOMP Endpoints

| Type | Pattern | Description |
|------|---------|-------------|
| Subscribe | `/topic/{name}` | Public topic - all subscribers receive messages |
| Subscribe | `/user/queue/{name}` | Private queue - only specific user receives messages |
| Send | `/app/{endpoint}` | Application endpoint - handled by `@MessageMapping` |

### Example Message Mappings

```java
@Controller
public class ChatController {

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(@Payload ChatMessage message) {
        return message;
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/messages")
    public ChatMessage addUser(@Payload ChatMessage message) {
        return message;
    }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `endpoint` | `string` | - | WebSocket server URL |
| `useSTOMP` | `boolean` | `true` | Use STOMP protocol |
| `connectionTimeout` | `number` | `5000` | Connection timeout (ms) |
| `autoReconnect` | `boolean` | `true` | Auto-reconnect on disconnect |
| `reconnectDelay` | `number` | `3000` | Delay between reconnections (ms) |
| `maxReconnectAttempts` | `number` | `5` | Max reconnection attempts |
| `headers` | `object` | `{}` | Additional connection headers |
| `debug` | `boolean` | `false` | Enable debug logging |

## Authentication

The WebSocket service automatically includes JWT tokens from `localStorage.sessionToken` as Bearer authentication:

```typescript
private getAuthHeaders(): { [key: string]: string } {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('sessionToken');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
  }
  return {};
}
```

On Spring Boot, configure WebSocket authentication:

```java
@Configuration
public class WebSocketSecurityConfig {
    @Bean
    public ChannelInterceptor authInterceptor() {
        return new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                    StompHeaderAccessor.wrap(message);

                String token = accessor.getFirstNativeHeader("Authorization");

                // Validate token and set user principal
                if (token != null && token.startsWith("Bearer ")) {
                    // Validate JWT and set user
                }

                return message;
            }
        };
    }
}
```

## Environment Variables

Add to your `.env.local`:

```bash
# WebSocket endpoint (usually same as API but with /ws path)
NEXT_PUBLIC_WS_ENDPOINT=http://localhost:8080/ws
```

## Testing

```tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from '@/shared/lib/websocket';

describe('useWebSocket', () => {
  it('should connect to WebSocket', async () => {
    const { result } = renderHook(() =>
      useWebSocket({
        endpoint: 'ws://localhost:8080/ws',
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onError: vi.fn(),
      })
    );

    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
  });
});
```

## Troubleshooting

### Connection Issues

1. **CORS Errors**: Ensure Spring Boot allows your origin:
   ```java
   registry.addEndpoint("/ws")
           .setAllowedOriginPatterns("*")
           .withSockJS();
   ```

2. **401 Unauthorized**: Check that JWT token is in `localStorage.sessionToken`

3. **Connection Timeout**: Increase `connectionTimeout` option

### Message Not Received

1. Verify subscription destination matches Spring Boot `@SendTo` annotation
2. Check browser console for STOMP errors
3. Enable `debug: true` to see all WebSocket messages

## Resources

- [Spring Boot WebSocket Documentation](https://docs.spring.io/spring-framework/reference/web/websocket.html)
- [STOMP Protocol Specification](https://stomp.github.io/)
- [SockJS Client Documentation](https://github.com/sockjs/sockjs-client)
