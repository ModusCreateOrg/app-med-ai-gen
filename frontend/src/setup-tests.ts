import { vi } from 'vitest';

// Mock AWS Amplify and Bedrock
vi.mock('@aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockImplementation(() => ({
    credentials: {
      accessKeyId: 'test-access-key',
      secretAccessKey: 'test-secret-key',
      sessionToken: 'test-session-token',
      expiration: new Date(Date.now() + 3600 * 1000)
    }
  })),
  Amplify: {
    configure: vi.fn()
  }
}));

// Mock AWS SDK Bedrock client
vi.mock('@aws-sdk/client-bedrock-runtime', () => {
  return {
    BedrockRuntimeClient: vi.fn().mockImplementation(() => ({
      send: vi.fn().mockResolvedValue({
        body: new TextEncoder().encode(JSON.stringify({
          results: [{ outputText: 'This is a mocked Bedrock response' }]
        }))
      })
    })),
    InvokeModelCommand: vi.fn().mockImplementation((params) => params)
  };
});

// Mock Bedrock service to avoid credential issues in tests
vi.mock('./common/services/ai/bedrock.service', () => {
  return {
    bedrockService: {
      createChatSession: vi.fn(async () => 'test-session-id'),
      sendMessage: vi.fn(async (_sessionId, message) => `This is a test response to: "${message}"`),
      getChatSession: vi.fn(() => ({
        id: 'test-session-id',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      getAllSessions: vi.fn(() => [])
    },
    ChatMessage: class {},
    ChatSession: class {}
  };
}); 