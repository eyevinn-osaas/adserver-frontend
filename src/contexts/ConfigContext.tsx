import React, { createContext, useState, useContext } from 'react';
import type { ReactNode } from 'react';

export interface ConfigContextType {
  apiBaseUrl: string;
  setApiBaseUrl: (url: string) => void;
  isValidUrl: (url: string) => boolean;
  testConnection: (url: string) => Promise<boolean>;
  resetToDefault: () => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const DEFAULT_API_URL = import.meta.env.VITE_API_BASE_URL || '';
const STORAGE_KEY = 'adserver_api_url';

interface ConfigProviderProps {
  children: ReactNode;
}

const ConfigProviderComponent: React.FC<ConfigProviderProps> = ({ children }) => {
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored || DEFAULT_API_URL;
    } catch {
      return DEFAULT_API_URL;
    }
  });

  const setApiBaseUrl = (url: string) => {
    const cleanUrl = url.trim().replace(/\/$/, ''); // Remove trailing slash
    setApiBaseUrlState(cleanUrl);
    localStorage.setItem(STORAGE_KEY, cleanUrl);

    // Note: Query invalidation should be handled by the components using this
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const testConnection = async (url: string): Promise<boolean> => {
    if (!isValidUrl(url)) return false;

    try {
      const cleanUrl = url.trim().replace(/\/$/, '');
      const response = await fetch(cleanUrl, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
      });
      // Check if response status is in the 200-299 range
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      console.warn('Connection test failed:', error);
      return false;
    }
  };

  const resetToDefault = () => {
    setApiBaseUrlState(DEFAULT_API_URL);
    localStorage.setItem(STORAGE_KEY, DEFAULT_API_URL);

    // Note: Query invalidation should be handled by the components using this
  };

  const value: ConfigContextType = {
    apiBaseUrl,
    setApiBaseUrl,
    isValidUrl,
    testConnection,
    resetToDefault,
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

// Hook to use the ConfigContext
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ConfigProviderComponent;