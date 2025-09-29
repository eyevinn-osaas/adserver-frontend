import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionApi, adApi, utilityApi } from '../services/api';
import type { VastRequest, VmapRequest } from '../types/api';

export const useSessionsQuery = () => {
  return useQuery({
    queryKey: ['sessions'],
    queryFn: sessionApi.getSessions,
    refetchInterval: 60000, // Auto-refresh every 60 seconds
  });
};

export const useSessionQuery = (sessionId: string) => {
  return useQuery({
    queryKey: ['sessions', sessionId],
    queryFn: () => sessionApi.getSession(sessionId),
    enabled: !!sessionId,
  });
};

export const useSessionEventsQuery = (sessionId: string) => {
  return useQuery({
    queryKey: ['sessions', sessionId, 'events'],
    queryFn: () => sessionApi.getSessionEvents(sessionId),
    enabled: !!sessionId,
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  });
};

export const useDeleteSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sessionApi.deleteSession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
    },
  });
};

export const useGenerateVastMutation = () => {
  return useMutation({
    mutationFn: (params: VastRequest) => adApi.generateVast(params),
  });
};

export const useGenerateVmapMutation = () => {
  return useMutation({
    mutationFn: (params: VmapRequest) => adApi.generateVmap(params),
  });
};

export const useGenerateFlexibleAdMutation = () => {
  return useMutation({
    mutationFn: (params: Record<string, unknown>) => adApi.generateFlexibleAd(params),
  });
};

export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: utilityApi.healthCheck,
    refetchInterval: 30000, // Check every 30 seconds
    retry: 1,
  });
};