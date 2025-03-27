import { vi } from 'vitest';

export const bedrockService = {
  createChatSession: vi.fn(async () => 'test-session-id'),
  sendMessage: vi.fn(async (_sessionId: string, message: string) => `This is a mock response to: "${message}"`),
  getChatSession: vi.fn(() => ({
    id: 'test-session-id',
    messages: [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there! How can I help you?' }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  })),
  getAllSessions: vi.fn(() => [
    {
      id: 'test-session-id',
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there! How can I help you?' }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ])
}; 