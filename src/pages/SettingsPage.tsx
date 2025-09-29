import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useConfig } from '../hooks/useConfig';
import {
  Settings,
  Server,
  Check,
  X,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  Globe
} from 'lucide-react';
import PageHeader from '../components/PageHeader';

const SettingsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { apiBaseUrl, setApiBaseUrl, isValidUrl, testConnection, resetToDefault } = useConfig();
  const [inputUrl, setInputUrl] = useState(apiBaseUrl);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error' | 'saved'>('idle');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(inputUrl !== apiBaseUrl);
  }, [inputUrl, apiBaseUrl]);

  const handleTestConnection = async () => {
    if (!isValidUrl(inputUrl)) {
      setConnectionStatus('error');
      return;
    }

    setIsTestingConnection(true);
    setConnectionStatus('idle');

    try {
      const isConnected = await testConnection(inputUrl);
      setConnectionStatus(isConnected ? 'success' : 'error');
    } catch {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleSaveUrl = () => {
    if (isValidUrl(inputUrl)) {
      setApiBaseUrl(inputUrl);
      setConnectionStatus('idle');
      // Invalidate all queries to force refetch with new URL
      queryClient.clear(); // Clear all cached data
      // Show saved feedback briefly
      setTimeout(() => {
        setConnectionStatus('saved');
        setTimeout(() => setConnectionStatus('idle'), 2000);
      }, 100);
    }
  };

  const handleReset = () => {
    resetToDefault();
    // Invalidate all queries to force refetch with new URL
    queryClient.clear(); // Clear all cached data
    // Get the default URL and update input
    const defaultUrl = import.meta.env.VITE_API_BASE_URL || '';
    setInputUrl(defaultUrl);
    setConnectionStatus('idle');
  };

  const isInputValid = isValidUrl(inputUrl);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Settings"
        description="Configure your AdServer connection"
        icon={Settings}
        iconColor="text-gray-600"
      />

      {/* API Configuration */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Server className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">AdServer Connection</h3>
              <p className="text-sm text-gray-500">Configure the URL for your AdServer instance</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="space-y-6">
            {/* Current URL Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current AdServer URL
              </label>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border">
                <Globe className="h-4 w-4 text-gray-400" />
                <span className="font-mono text-sm text-gray-900">{apiBaseUrl}</span>
                <a
                  href={`${apiBaseUrl}/api/docs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  API Docs
                </a>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New AdServer URL
              </label>
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://your-adserver.example.com"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      inputUrl && !isInputValid
                        ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300'
                    }`}
                  />
                  {inputUrl && !isInputValid && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>

                {inputUrl && !isInputValid && (
                  <div className="flex items-center space-x-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>Please enter a valid URL starting with http:// or https://</span>
                  </div>
                )}
              </div>
            </div>

            {/* Test Connection */}
            <div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleTestConnection}
                  disabled={!isInputValid || isTestingConnection}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTestingConnection ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                      Testing...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </button>

                {connectionStatus === 'success' && (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Connection successful</span>
                  </div>
                )}

                {connectionStatus === 'saved' && (
                  <div className="flex items-center space-x-2 text-blue-600">
                    <Check className="h-4 w-4" />
                    <span className="text-sm">Configuration saved & data refreshed</span>
                  </div>
                )}

                {connectionStatus === 'error' && (
                  <div className="flex items-center space-x-2 text-red-600">
                    <X className="h-4 w-4" />
                    <span className="text-sm">Connection failed</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <button
                onClick={handleReset}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Default
              </button>

              <button
                onClick={handleSaveUrl}
                disabled={!isInputValid || !hasChanges}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Check className="h-4 w-4 mr-2" />
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <AlertCircle className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Configuration Help
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Enter the base URL of your AdServer instance (e.g., https://my-adserver.com)</li>
                <li>Test the connection to ensure the server is reachable</li>
                <li>The connection test checks if the base URL responds with a 2xx status code</li>
                <li>Changes are saved automatically and will be used for all API calls</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;