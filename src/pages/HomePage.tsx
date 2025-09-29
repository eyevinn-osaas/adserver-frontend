import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, BarChart3, Activity, TrendingUp, Zap, List, Home } from 'lucide-react';
import { useSessionsQuery } from '../hooks/useApi';
import { useConfig } from '../hooks/useConfig';
import { subDays, isAfter } from 'date-fns';
import PageHeader from '../components/PageHeader';

const HomePage: React.FC = () => {
  const { data: sessionsData } = useSessionsQuery();
  const { apiBaseUrl } = useConfig();

  const analytics = useMemo(() => {
    if (!sessionsData?.data) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        recentSessions: 0,
      };
    }

    const sessions = sessionsData.data;
    const now = new Date();
    const oneDayAgo = subDays(now, 1);

    const recentSessions = sessions.filter(session =>
      isAfter(new Date(session.created), oneDayAgo)
    ).length;

    const activeSessions = sessions.filter(session =>
      isAfter(new Date(session.created), subDays(now, 0.25)) // Active in last 6 hours
    ).length;

    return {
      totalSessions: sessions.length,
      activeSessions,
      recentSessions,
    };
  }, [sessionsData]);

  const stats = [
    { name: 'Total Sessions', value: analytics.totalSessions.toString(), icon: Activity, colorClass: 'text-blue-600' },
    { name: 'Active Sessions', value: analytics.activeSessions.toString(), icon: TrendingUp, colorClass: 'text-green-600' },
    { name: 'Recent (24h)', value: analytics.recentSessions.toString(), icon: BarChart3, colorClass: 'text-purple-600' },
    {
      name: 'AdServer Status',
      value: apiBaseUrl ? 'Connected' : 'Not Configured',
      icon: Zap,
      colorClass: apiBaseUrl ? 'text-green-600' : 'text-gray-500'
    },
  ];

  const quickActions = [
    {
      name: 'View Ad Sessions',
      description: 'View Ad Sessions',
      href: '/sessions',
      icon: List,
      bgClass: 'bg-green-50',
      textClass: 'text-green-600',
      hoverClass: 'group-hover:bg-green-100',
    },
    {
      name: 'View Analytics',
      description: 'Monitor performance metrics',
      href: '/analytics',
      icon: BarChart3,
      bgClass: 'bg-purple-50',
      textClass: 'text-purple-600',
      hoverClass: 'group-hover:bg-purple-100',
    },
    {
      name: 'Generate Ad Request',
      description: 'Generate a VAST or VMAP request for testing the server',
      href: '/generator',
      icon: Play,
      bgClass: 'bg-blue-50',
      textClass: 'text-blue-600',
      hoverClass: 'group-hover:bg-blue-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Dashboard"
        description="Monitor your ad server performance and manage active sessions."
        icon={Home}
        iconColor="text-blue-600"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 ${stat.colorClass}`} />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.name}
                  to={action.href}
                  className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-500 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div>
                    <span className={`rounded-lg inline-flex p-3 ${action.bgClass} ${action.textClass} ${action.hoverClass}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {action.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {action.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};

export default HomePage;