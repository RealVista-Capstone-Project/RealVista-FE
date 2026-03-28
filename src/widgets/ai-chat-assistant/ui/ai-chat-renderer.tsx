'use client';

import { AiChatFab } from './ai-chat-fab';
import { AiChatWindow } from './ai-chat-window';
import type { AiChatMessage } from './ai-chat-message-item';
import { useCallback, useState } from 'react';

/**
 * Mock AI response map - maps keywords to relevant real-estate answers.
 * Used for demo purposes before a real backend is connected.
 */
const MOCK_RESPONSES: { keywords: string[]; response: string }[] = [
  {
    keywords: ['find', 'properties', 'near', 'tìm', 'bất động sản', 'gần'],
    response:
      'I found 12 properties near your area! Here are the top picks:\n\n1. Modern apartment in District 2 - $1,200/mo\n2. Studio in Thao Dien - $800/mo\n3. 2BR condo in Binh Thanh - $950/mo\n\nWould you like me to filter by price range or number of bedrooms?',
  },
  {
    keywords: ['average', 'rent', 'district 1', 'quận 1', 'giá thuê', 'trung bình'],
    response:
      'The average rent in District 1 varies by property type:\n\n- Studio: $600 - $900/month\n- 1 Bedroom: $800 - $1,400/month\n- 2 Bedrooms: $1,200 - $2,500/month\n- 3 Bedrooms: $2,000 - $4,000/month\n\nPrices have increased ~8% over the past year. Want me to show specific listings?',
  },
  {
    keywords: ['compare', 'listings', 'so sánh', 'tin đăng'],
    response:
      'I can help you compare listings! Please share the listing URLs or tell me the areas and property types you\'d like to compare. For example:\n\n- "Compare 2BR apartments in District 2 vs District 7"\n- "Compare studios under $800 in Thao Dien"',
  },
  {
    keywords: ['hello', 'hi', 'hey', 'xin chào', 'chào'],
    response:
      "Hello! I'm here to help you find the perfect property. You can ask me about:\n\n- Property listings in specific areas\n- Rent prices and market trends\n- Comparing different properties\n- Neighborhood information\n\nWhat would you like to know?",
  },
  {
    keywords: ['price', 'cost', 'giá', 'chi phí', 'budget'],
    response:
      "I can help with pricing! To give you the most accurate information, could you tell me:\n\n1. What area are you looking in?\n2. How many bedrooms do you need?\n3. What's your monthly budget range?\n\nThis will help me find the best matches for you.",
  },
];

const FALLBACK_RESPONSE =
  "That's a great question! I'm still learning about the real estate market. Could you try asking about:\n\n- Property prices in a specific district\n- Finding listings near an area\n- Comparing different properties\n\nI'm here to help!";

function getMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase();
  const match = MOCK_RESPONSES.find((r) => r.keywords.some((kw) => lower.includes(kw)));
  return match?.response ?? FALLBACK_RESPONSE;
}

function createMessage(content: string, role: 'user' | 'assistant'): AiChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    content,
    role,
    timestamp: new Date(),
  };
}

/**
 * AiChatRenderer - Top-level orchestrator for the AI chat assistant.
 * Manages open/close state, messages, and mock AI responses.
 * Place once in PublicLayout alongside ChatWindowRenderer.
 */
export function AiChatRenderer() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const simulateAiResponse = useCallback((userMessage: string) => {
    setIsTyping(true);

    // Simulate network delay (1-2s)
    const delay = 1000 + Math.random() * 1000;
    setTimeout(() => {
      const response = getMockResponse(userMessage);
      setMessages((prev) => [...prev, createMessage(response, 'assistant')]);
      setIsTyping(false);
    }, delay);
  }, []);

  const handleSendMessage = useCallback(
    (content: string) => {
      setMessages((prev) => [...prev, createMessage(content, 'user')]);
      simulateAiResponse(content);
    },
    [simulateAiResponse]
  );

  const handleQuickAction = useCallback(
    (text: string) => {
      handleSendMessage(text);
    },
    [handleSendMessage]
  );

  return (
    <>
      {isOpen && (
        <AiChatWindow
          messages={messages}
          isTyping={isTyping}
          onSendMessage={handleSendMessage}
          onClose={handleClose}
          onQuickAction={handleQuickAction}
        />
      )}
      <AiChatFab isOpen={isOpen} onClick={handleToggle} />
    </>
  );
}
