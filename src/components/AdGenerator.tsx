import React, { useState } from 'react';
import { Play, Download, Copy, Eye, Sparkles, Zap, Code2, FileText } from 'lucide-react';
import { useGenerateVastMutation, useGenerateVmapMutation } from '../hooks/useApi';
import type { VastRequest, VmapRequest } from '../types/api';
import PageHeader from './PageHeader';

const AdGenerator: React.FC = () => {
  const [adType, setAdType] = useState<'vast' | 'vmap'>('vast');
  const [formData, setFormData] = useState<VastRequest & VmapRequest>({
    c: true,
    dur: '120',
    v: '4',
  });
  const [generatedXml, setGeneratedXml] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  const generateVastMutation = useGenerateVastMutation();
  const generateVmapMutation = useGenerateVmapMutation();

  const handleInputChange = (key: keyof (VastRequest & VmapRequest), value: string | boolean | undefined) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    try {
      if (adType === 'vast') {
        const response = await generateVastMutation.mutateAsync(formData);
        setGeneratedXml(response.xml);
        setSessionId(response.sessionId);
      } else {
        const response = await generateVmapMutation.mutateAsync(formData);
        setGeneratedXml(response.xml);
        setSessionId(response.sessionId);
      }
    } catch (error) {
      console.error('Failed to generate ad:', error);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedXml);
  };

  const downloadXml = () => {
    const blob = new Blob([generatedXml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${adType}-${sessionId}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = generateVastMutation.isPending || generateVmapMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Ad Request Generator"
        description="Create a VAST or VMAP request for testing the Ad-Server"
        icon={Play}
        iconColor="text-blue-600"
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
            </div>

            <div className="space-y-6">
              {/* Ad Type Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Ad Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['vast', 'vmap'].map((type) => (
                    <label key={type} className="relative cursor-pointer">
                      <input
                        type="radio"
                        value={type}
                        checked={adType === type}
                        onChange={(e) => setAdType(e.target.value as 'vast' | 'vmap')}
                        className="sr-only"
                      />
                      <div className={`rounded-lg border p-4 transition-all ${
                        adType === type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}>
                        <div className="text-center">
                          <div className={`w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center ${
                            adType === type ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Play className={`h-4 w-4 ${adType === type ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <span className={`text-sm font-medium ${
                            adType === type ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {type.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Basic Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duration (seconds) [dur]
                  </label>
                  <input
                    type="text"
                    value={formData.dur || ''}
                    onChange={(e) => handleInputChange('dur', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="120"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    VAST Version [v]
                  </label>
                  <select
                    value={formData.v || '4'}
                    onChange={(e) => handleInputChange('v', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="2">2.0</option>
                    <option value="3">3.0</option>
                    <option value="4">4.0</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Skip Offset [skip]
                  </label>
                  <input
                    type="text"
                    value={formData.skip || ''}
                    onChange={(e) => handleInputChange('skip', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="5 or 25%"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Collection [coll]
                  </label>
                  <input
                    type="text"
                    value={formData.coll || ''}
                    onChange={(e) => handleInputChange('coll', e.target.value || undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="my-cat-ads"
                  />
                </div>
              </div>

              {/* User & Device Parameters */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-sm font-semibold text-blue-900 mb-4">User & Device Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">User ID [uid]</label>
                    <input
                      type="text"
                      value={formData.uid || ''}
                      onChange={(e) => handleInputChange('uid', e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="user-123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Operating System [os]</label>
                    <select
                      value={formData.os || ''}
                      onChange={(e) => handleInputChange('os', e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select OS</option>
                      <option value="ios">iOS</option>
                      <option value="android">Android</option>
                      <option value="windows">Windows</option>
                      <option value="macos">macOS</option>
                      <option value="linux">Linux</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Device Type [dt]</label>
                    <select
                      value={formData.dt || ''}
                      onChange={(e) => handleInputChange('dt', e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Device</option>
                      <option value="mobile">Mobile</option>
                      <option value="tablet">Tablet</option>
                      <option value="desktop">Desktop</option>
                      <option value="tv">TV</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Screen Size [ss]</label>
                    <input
                      type="text"
                      value={formData.ss || ''}
                      onChange={(e) => handleInputChange('ss', e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="1920x1080"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">Client IP [uip]</label>
                    <input
                      type="text"
                      value={formData.uip || ''}
                      onChange={(e) => handleInputChange('uip', e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="192.168.1.200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-700 mb-1">User Agent [userAgent]</label>
                    <input
                      type="text"
                      value={formData.userAgent || ''}
                      onChange={(e) => handleInputChange('userAgent', e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mozilla/5.0..."
                    />
                  </div>
                </div>
              </div>

              {/* Ad Pod Configuration */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h4 className="text-sm font-semibold text-green-900 mb-4">Ad Pod Configuration</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Min Duration (s) [min]</label>
                    <input
                      type="text"
                      value={formData.min || ''}
                      onChange={(e) => handleInputChange('min', e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-white border border-green-200 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Max Duration (s) [max]</label>
                    <input
                      type="text"
                      value={formData.max || ''}
                      onChange={(e) => handleInputChange('max', e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-white border border-green-200 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-green-700 mb-1">Pod Size [ps]</label>
                    <input
                      type="text"
                      value={formData.ps || ''}
                      onChange={(e) => handleInputChange('ps', e.target.value || undefined)}
                      className="w-full px-3 py-2 bg-white border border-green-200 rounded-md text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="3"
                    />
                  </div>
                </div>
              </div>

              {/* VMAP Specific Options */}
              {adType === 'vmap' && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-semibold text-purple-900 mb-4 flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    VMAP Configuration
                  </h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-purple-700 mb-1">Breakpoints [bp]</label>
                      <input
                        type="text"
                        value={formData.bp || ''}
                        onChange={(e) => handleInputChange('bp', e.target.value || undefined)}
                        className="w-full px-3 py-2 bg-white border border-purple-200 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="300,900,1500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.prr === 'true'}
                        onChange={(e) => handleInputChange('prr', e.target.checked ? 'true' : undefined)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label className="ml-2 text-xs font-medium text-purple-700">
                        Include 15s Preroll [prr]
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.por === 'true'}
                        onChange={(e) => handleInputChange('por', e.target.checked ? 'true' : undefined)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label className="ml-2 text-xs font-medium text-purple-700">
                        Include 15s Postroll [por]
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Consent Tracking Toggle */}
              <div className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                <input
                  type="checkbox"
                  checked={formData.c || false}
                  onChange={(e) => handleInputChange('c', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Consent check [c]
                </label>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                <div className="flex items-center justify-center">
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Generate {adType.toUpperCase()}
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Code2 className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Generated XML</h3>
              </div>

              {generatedXml && (
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </button>
                  <button
                    onClick={downloadXml}
                    className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              )}
            </div>

            {generatedXml ? (
              <div className="space-y-4">
                {sessionId && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-5 h-5 bg-blue-100 rounded flex items-center justify-center mr-2">
                        <Eye className="h-3 w-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-blue-900">Session ID:</span>
                      <span className="text-sm text-blue-700 ml-2 font-mono bg-white px-2 py-1 rounded">
                        {sessionId}
                      </span>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="max-h-96 overflow-auto bg-gray-900 rounded-lg border border-gray-300">
                    <pre className="text-xs text-green-400 p-4 font-mono leading-relaxed">
                      {generatedXml}
                    </pre>
                  </div>
                  <div className="absolute top-2 right-2 px-2 py-1 bg-gray-800 text-green-400 text-xs rounded font-mono">
                    XML
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                  <Code2 className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Generate</h4>
                <p className="text-gray-500">
                  Your generated XML will appear here with syntax highlighting
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdGenerator;