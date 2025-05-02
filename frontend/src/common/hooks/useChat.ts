import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { bedrockService } from '../services/ai/bedrock.service';
import { QueryKey } from 'common/utils/constants';

export function useChat(sessionId?: string) {
  const queryClient = useQueryClient();

  // Query for getting chat session
  const { data: session } = useQuery({
    queryKey: [QueryKey.Chat, sessionId],
    queryFn: () => (sessionId ? bedrockService.getChatSession(sessionId) : undefined),
    enabled: !!sessionId,
  });

  // Query for getting all sessions
  const { data: sessions } = useQuery({
    queryKey: [QueryKey.Chat, 'sessions'],
    queryFn: () => bedrockService.getAllSessions(),
  });

  // Mutation for creating a new session
  const createSession = useMutation({
    mutationFn: () => bedrockService.createChatSession(),
    onSuccess: (newSessionId) => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.Chat, 'sessions'] });
      return newSessionId;
    },
  });

  // Mutation for sending a message
  const sendMessage = useMutation({
    mutationFn: (message: string) => {
      if (!sessionId) throw new Error('No active session');
      return bedrockService.sendMessage(sessionId, message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QueryKey.Chat, sessionId] });
      queryClient.invalidateQueries({ queryKey: [QueryKey.Chat, 'sessions'] });
    },
  });

  return {
    session,
    sessions,
    createSession,
    sendMessage,
    isLoading: createSession.isPending || sendMessage.isPending,
  };
}
