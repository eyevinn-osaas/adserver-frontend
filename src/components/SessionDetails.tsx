import React, { useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Activity, Download, Globe, Monitor, Code, FileText, Play, Video, Zap, ChevronDown, ChevronRight, Hash, FileVideoCamera } from 'lucide-react';
import { useSessionQuery, useSessionEventsQuery } from '../hooks/useApi';
import { formatDistanceToNow, format } from 'date-fns';

interface ParsedAd {
  id: string;
  sequence: number;
  title: string;
  duration: string;
  creativeAdId?: string;
  mediaFiles: {
    url: string;
    type: string;
    width: number;
    height: number;
    bitrate: number;
    codec?: string;
  }[];
  clickThrough?: string;
  impressionUrl?: string;
}

const parseVastResponse = (xmlString: string): ParsedAd[] => {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    const ads: ParsedAd[] = [];

    const adElements = xmlDoc.querySelectorAll('Ad');

    adElements.forEach((adElement) => {
      const id = adElement.getAttribute('id') || '';
      const sequence = parseInt(adElement.getAttribute('sequence') || '1');
      const title = adElement.querySelector('AdTitle')?.textContent || '';
      const duration = adElement.querySelector('Duration')?.textContent || '';
      const impressionUrl = adElement.querySelector('Impression')?.textContent?.trim() || '';
      const clickThrough = adElement.querySelector('ClickThrough')?.textContent?.trim() || '';
      const creativeAdId = adElement.querySelector('Creative')?.getAttribute('adId') || '';

      const mediaFiles: ParsedAd['mediaFiles'] = [];
      const mediaFileElements = adElement.querySelectorAll('MediaFile');

      mediaFileElements.forEach((mediaFile) => {
        const url = mediaFile.textContent?.trim() || '';
        const type = mediaFile.getAttribute('type') || '';
        const width = parseInt(mediaFile.getAttribute('width') || '0');
        const height = parseInt(mediaFile.getAttribute('height') || '0');
        const bitrate = parseInt(mediaFile.getAttribute('bitrate') || '0');
        const codec = mediaFile.getAttribute('codec') || undefined;

        if (url) {
          mediaFiles.push({ url, type, width, height, bitrate, codec });
        }
      });

      ads.push({
        id,
        sequence,
        title,
        duration,
        creativeAdId,
        mediaFiles,
        clickThrough,
        impressionUrl,
      });
    });

    return ads.sort((a, b) => a.sequence - b.sequence);
  } catch (error) {
    console.error('Error parsing VAST XML:', error);
    return [];
  }
};

const SessionDetails: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { data: session, isLoading: sessionLoading, error: sessionError } = useSessionQuery(sessionId!);
  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useSessionEventsQuery(sessionId!);

  const [expandedSections, setExpandedSections] = useState({
    sessionInfo: true,
    clientRequest: false,
    adAnalysis: false,
    vastResponse: false,
    trackedAds: false,
    trackingEvents: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const events = eventsData?.events || [];

  const parsedAds = useMemo(() => {
    if (!session?.response) return [];
    try {
      return parseVastResponse(session.response);
    } catch (error) {
      console.error('Error parsing VAST response:', error);
      return [];
    }
  }, [session?.response]);

  const groupedAdEvents = useMemo(() => {
    const grouped: Record<string, Array<{ type: string; issuedAt: string; userAgent: string }>> = {};

    try {
      events.forEach(event => {
        if (event && event.onAd && event.type && event.issuedAt) {
          if (!grouped[event.onAd]) {
            grouped[event.onAd] = [];
          }
          grouped[event.onAd].push({
            type: event.type,
            issuedAt: event.issuedAt,
            userAgent: event.userAgent || ''
          });
        }
      });

      // Sort events within each ad by issuedAt
      Object.keys(grouped).forEach(adId => {
        grouped[adId].sort((a, b) => new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime());
      });
    } catch (error) {
      console.error('Error grouping ad events:', error);
    }

    return grouped;
  }, [eventsData?.events]);

  const detectResponseType = (response: string): 'VAST' | 'VMAP' => {
    if (response.includes('<vmap:VMAP') || response.includes('<VMAP')) {
      return 'VMAP';
    }
    return 'VAST';
  };

  if (sessionLoading || eventsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (sessionError || (!session && !sessionLoading)) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-center">
          <h3 className="text-sm font-medium text-red-800">Session not found</h3>
          <p className="mt-1 text-sm text-red-700">
            The session ID {sessionId} does not exist.
          </p>
          {sessionError && (
            <p className="mt-1 text-xs text-red-600">
              Error: {sessionError instanceof Error ? sessionError.message : 'Unknown error'}
            </p>
          )}
          <Link
            to="/"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sessions
          </Link>
        </div>
      </div>
    );
  }

  // Additional safety check for TypeScript
  if (!session) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-center">
          <h3 className="text-sm font-medium text-red-800">Session not found</h3>
          <p className="mt-1 text-sm text-red-700">
            Unable to load session data.
          </p>
        </div>
      </div>
    );
  }

  const downloadEvents = () => {
    const dataStr = JSON.stringify(events, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `session-${sessionId}-events.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to="/sessions"
            className="mr-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Session Details</h1>
            <p className="text-sm text-gray-500">Session ID: {sessionId}</p>
          </div>
        </div>
        {events.length > 0 && (
          <button
            onClick={downloadEvents}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Events
          </button>
        )}
      </div>

      {/* Session Overview */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div
          className="px-4 py-5 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('sessionInfo')}
        >
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-blue-600" />
              Session Information
            </div>
            {expandedSections.sessionInfo ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </h3>
        </div>
        {expandedSections.sessionInfo && (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Session ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                {session.sessionId}
              </dd>
            </div>
            <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {format(new Date(session.created), 'PPpp')}
                <span className="text-gray-500 ml-2">
                  ({formatDistanceToNow(new Date(session.created), { addSuffix: true })})
                </span>
              </dd>
            </div>
            <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {session.userId || 'Not specified'}
              </dd>
            </div>
            <div className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Ad Break Duration</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {session.adBreakDuration} seconds
              </dd>
            </div>
          </dl>
          </div>
        )}
      </div>

      {/* Client Request Details */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div
          className="px-4 py-5 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('clientRequest')}
        >
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between">
            <div className="flex items-center">
              <Monitor className="h-5 w-5 mr-2 text-green-600" />
              Client Request Details
            </div>
            {expandedSections.clientRequest ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </h3>
        </div>
        {expandedSections.clientRequest && (
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            {Object.entries(session.clientRequest || {}).map(([key, value]) => {
              const shouldUseMono = (key: string) => {
                return ['uip', 'userAgent', 'host'].includes(key);
              };

              return (
                <div key={key} className="py-2 sm:py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    {key}
                  </dt>
                  <dd className={`mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 ${shouldUseMono(key) ? 'font-mono' : ''}`}>
                    {value}
                  </dd>
                </div>
              );
            })}
          </dl>
          </div>
        )}
      </div>

      {/* Parsed Ads */}
      {parsedAds.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div
            className="px-4 py-5 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('adAnalysis')}
          >
            <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between">
              <div>
                <div className="flex items-center">
                  <Play className="h-5 w-5 mr-2 text-indigo-600" />
                  Ad Creative Analysis
                </div>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Visual breakdown of ads served in this session
                </p>
              </div>
              {expandedSections.adAnalysis ? (
                <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
              )}
            </h3>
          </div>
          {expandedSections.adAnalysis && (
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="space-y-6">
              {parsedAds.map((ad, index) => (
                <div key={ad.id || index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                          <Video className="h-4 w-4 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {ad.title || `Ad ${ad.sequence}`}
                          </h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Hash className="h-4 w-4 mr-1" />
                             {ad.sequence}
                            </span>
                            {ad.duration && (
                              <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {ad.duration}
                              </span>
                            )}
                            {ad.creativeAdId && (
                              <span className="flex items-center">
                                <FileVideoCamera className="h-4 w-4 mr-1" />
                                {ad.creativeAdId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Media Files */}
                      {ad.mediaFiles.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            Media Files ({ad.mediaFiles.length})
                          </h5>
                          <div className="space-y-3">
                            {ad.mediaFiles.map((media, mediaIndex) => (
                              <div key={mediaIndex} className="bg-white border border-gray-200 rounded-md p-4">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3">
                                  <div className="flex items-center space-x-2">
                                    <Monitor className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm font-medium text-gray-900">
                                      {media.width} × {media.height}
                                    </span>
                                  </div>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {media.type.split('/')[1]?.toUpperCase() || 'VIDEO'}
                                  </span>
                                  <div className="flex items-center space-x-2">
                                    <Zap className="h-3 w-3 text-gray-400" />
                                    <span className="text-sm text-gray-600">Bitrate: {media.bitrate} kbps</span>
                                  </div>
                                  {media.codec && (
                                    <div className="flex items-center space-x-2">
                                      <Code className="h-3 w-3 text-gray-400" />
                                      <span className="text-sm text-gray-600">Codec: {media.codec}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Globe className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <a
                                    href={media.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 break-all text-sm"
                                    title={media.url}
                                  >
                                    {media.url}
                                  </a>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Click Through & Impression URLs */}
                      {(ad.clickThrough || ad.impressionUrl) && (
                        <div className="border-t border-gray-200 pt-4">
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Tracking</h5>
                          <div className="space-y-2">
                            {ad.clickThrough && (
                              <div className="flex items-start space-x-2 text-sm">
                                <span className="font-medium text-gray-600 flex-shrink-0">Click-through:</span>
                                <a
                                  href={ad.clickThrough}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 break-all"
                                  title={ad.clickThrough}
                                >
                                  {ad.clickThrough}
                                </a>
                              </div>
                            )}
                            {ad.impressionUrl && (
                              <div className="flex items-start space-x-2 text-sm">
                                <span className="font-medium text-gray-600 flex-shrink-0">Impression:</span>
                                <a
                                  href={ad.impressionUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 break-all"
                                  title={ad.impressionUrl}
                                >
                                  {ad.impressionUrl}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}
        </div>
      )}

      {/* VAST Response */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div
          className="px-4 py-5 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('vastResponse')}
        >
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <Code className="h-5 w-5 mr-2 text-purple-600" />
                {detectResponseType(session.response || '')} Response
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                The XML response generated for this session
              </p>
            </div>
            {expandedSections.vastResponse ? (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </h3>
        </div>
        {expandedSections.vastResponse && (
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <div className="bg-gray-50 rounded-md p-4">
            <pre className="text-xs text-gray-800 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
              {session.response}
            </pre>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                const blob = new Blob([session.response], { type: 'application/xml' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `session-${sessionId}-response.xml`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Download XML
            </button>
          </div>
          </div>
        )}
      </div>

      {/* Tracked Ads */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div
          className="px-4 py-5 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('trackedAds')}
        >
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-orange-600" />
                Tracked Ads
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Summary of tracking events grouped by ad (auto-refreshes every 10 seconds)
              </p>
            </div>
            {expandedSections.trackedAds ? (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </h3>
        </div>

        {expandedSections.trackedAds && (
          <div className="border-t border-gray-200">
            {Object.keys(groupedAdEvents).length === 0 ? (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tracked ads</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Ad tracking events will appear here when ads are played.
                </p>
              </div>
            ) : (
              <div className="px-4 py-5 sm:px-6">
                <div className="space-y-4">
                  {Object.entries(groupedAdEvents).map(([adId, adEvents]) => (
                    <div key={adId} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Ad ID: {adId}</h4>
                          <p className="text-xs text-gray-500 mt-1">{adEvents.length} tracking events</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {adEvents.map((event, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            title={`${event.type} - ${format(new Date(event.issuedAt), 'PPpp')}`}
                          >
                            {event.type}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div
          className="px-4 py-5 sm:px-6 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => toggleSection('trackingEvents')}
        >
          <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center justify-between">
            <div>
              <div className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                Tracking Events
              </div>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Real-time tracking events for this session (auto-refreshes every 10 seconds)
              </p>
            </div>
            {expandedSections.trackingEvents ? (
              <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            )}
          </h3>
        </div>

        {expandedSections.trackingEvents && (
          <div className="border-t border-gray-200">
            {eventsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading events...</p>
              </div>
            ) : eventsError ? (
              <div className="text-center py-12">
                <div className="mx-auto h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to load events</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {eventsError instanceof Error ? eventsError.message : 'Unable to fetch tracking events for this session.'}
                </p>
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tracking events will appear here when the ads are played.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {events.map((event, index) => (
                  <li key={index} className="px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <p className="text-sm font-medium text-gray-900">
                              {event.type}
                            </p>
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {event.onAd}
                            </span>
                          </div>
                          <div className="flex items-center mt-1 text-sm text-gray-500">
                            <Clock className="flex-shrink-0 mr-1.5 h-4 w-4" />
                            <p>{format(new Date(event.issuedAt), 'PPpp')}</p>
                          </div>
                          <div className="mt-2">
                            <details className="text-sm">
                              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                                View event details
                              </summary>
                              <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                                <div><strong>User Agent:</strong> {event.userAgent}</div>
                                <div><strong>Ad ID:</strong> {event.onAd}</div>
                                <div><strong>Timestamp:</strong> {event.issuedAt}</div>
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionDetails;