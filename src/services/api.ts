import axios from 'axios';
import type {
  Session,
  VastRequest,
  VmapRequest,
  AdResponse,
  SessionsResponse,
  EventsResponse,
} from '../types/api';

const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'adserver_api_url';

// Function to get the current API base URL
const getApiBaseUrl = (): string => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || DEFAULT_API_URL;
};

// Create axios instance with dynamic base URL
const createApiClient = () => {
  const baseURL = getApiBaseUrl();
  return axios.create({
    baseURL,
    timeout: 10000,
  });
};

export const sessionApi = {
  getSessions: async (): Promise<SessionsResponse> => {
    const apiClient = createApiClient();
    const response = await apiClient.get('/api/v1/sessions');
    return response.data;
  },

  getSession: async (sessionId: string): Promise<Session> => {
    const apiClient = createApiClient();
    const response = await apiClient.get(`/api/v1/sessions/${sessionId}`);
    return response.data;
  },

  deleteSession: async (sessionId: string): Promise<void> => {
    const apiClient = createApiClient();
    await apiClient.delete(`/api/v1/sessions/${sessionId}`);
  },

  getSessionEvents: async (sessionId: string): Promise<EventsResponse> => {
    const apiClient = createApiClient();
    const response = await apiClient.get(`/api/v1/sessions/${sessionId}/events`);
    return response.data;
  },

  sendTrackingEvent: async (sessionId: string, data: Record<string, unknown>): Promise<void> => {
    const apiClient = createApiClient();
    await apiClient.post(`/api/v1/sessions/${sessionId}/tracking`, data);
  },
};

export const adApi = {
  generateVast: async (params: VastRequest): Promise<AdResponse> => {
    const apiClient = createApiClient();
    const response = await apiClient.get('/api/v1/vast', { params });
    return {
      xml: response.data,
      sessionId: response.headers['x-session-id'] || '',
    };
  },

  generateVmap: async (params: VmapRequest): Promise<AdResponse> => {
    const apiClient = createApiClient();
    const response = await apiClient.get('/api/v1/vmap', { params });
    return {
      xml: response.data,
      sessionId: response.headers['x-session-id'] || '',
    };
  },

  generateFlexibleAd: async (params: Record<string, unknown>): Promise<AdResponse> => {
    const apiClient = createApiClient();
    const response = await apiClient.get('/api/v1/ads', { params });
    return {
      xml: response.data,
      sessionId: response.headers['x-session-id'] || '',
    };
  },
};

export const utilityApi = {
  getApiDocs: (): string => {
    return `${getApiBaseUrl()}/api/docs`;
  },

  healthCheck: async (): Promise<boolean> => {
    try {
      const apiClient = createApiClient();
      await apiClient.get('/health');
      return true;
    } catch {
      return false;
    }
  },
};