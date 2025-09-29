import React, { useMemo } from 'react';
import { BarChart3, Activity, Clock, PlayCircle, Users, TrendingUp, Calendar } from 'lucide-react';
import { useSessionsQuery } from '../hooks/useApi';
import { formatDistanceToNow, format, subDays, isAfter } from 'date-fns';
import PageHeader from './PageHeader';

const Analytics: React.FC = () => {
  const { data: sessionsData, isLoading } = useSessionsQuery();

  const analytics = useMemo(() => {
    if (!sessionsData?.data) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        recentSessions: 0,
        averageSessionAge: 0,
        sessionsByDay: [],
      };
    }

    const sessions = sessionsData.data;
    const now = new Date();
    const oneDayAgo = subDays(now, 1);

    const recentSessions = sessions.filter(session =>
      isAfter(new Date(session.created), oneDayAgo)
    ).length;

    // Since we don't have updatedAt, we'll consider all sessions as "active" for now
    // or use created date as a proxy
    const activeSessions = sessions.filter(session =>
      isAfter(new Date(session.created), subDays(now, 0.25)) // Active in last 6 hours
    ).length;

    // Calculate average session age
    const totalAge = sessions.reduce((acc, session) => {
      return acc + (now.getTime() - new Date(session.created).getTime());
    }, 0);
    const averageSessionAge = sessions.length > 0 ? totalAge / sessions.length : 0;

    // Group sessions by day for the last 7 days
    const sessionsByDay = [];
    for (let i = 6; i >= 0; i--) {
      const day = subDays(now, i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const dayCount = sessions.filter(session => {
        const sessionDate = new Date(session.created);
        return sessionDate >= dayStart && sessionDate < dayEnd;
      }).length;

      sessionsByDay.push({
        date: format(day, 'MMM dd'),
        count: dayCount,
      });
    }

    return {
      totalSessions: sessions.length,
      activeSessions,
      recentSessions,
      averageSessionAge,
      sessionsByDay,
    };
  }, [sessionsData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-red-600 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...analytics.sessionsByDay.map(d => d.count), 1);

  const statCards = [
    {
      title: 'Total Sessions',
      value: analytics.totalSessions,
      icon: Users,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Active Sessions',
      value: analytics.activeSessions,
      icon: Activity,
      gradient: 'from-emerald-500 to-green-500',
      bgGradient: 'from-emerald-50 to-green-50',
      change: '+8%',
      changeType: 'positive'
    },
    {
      title: 'Recent (24h)',
      value: analytics.recentSessions,
      icon: PlayCircle,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50',
      change: '+23%',
      changeType: 'positive'
    },
    {
      title: 'Avg. Session Age',
      value: analytics.averageSessionAge > 0
        ? formatDistanceToNow(new Date(Date.now() - analytics.averageSessionAge))
        : 'N/A',
      icon: Clock,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50',
      change: '-5%',
      changeType: 'positive'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Analytics"
        description="Real-time insights and session metrics"
        icon={BarChart3}
        iconColor="text-purple-600"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="group relative overflow-hidden backdrop-blur-xl bg-white/80 rounded-2xl shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-50`}></div>
              <div className="relative p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <dt className="text-sm font-semibold text-gray-600 mb-2">
                      {card.title}
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {card.value}
                    </dd>
                    <div className="flex items-center mt-2">
                      <TrendingUp className={`h-3 w-3 mr-1 ${
                        card.changeType === 'positive' ? 'text-emerald-500' : 'text-red-500'
                      }`} />
                      <span className={`text-xs font-medium ${
                        card.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {card.change}
                      </span>
                      <span className="text-xs text-gray-500 ml-1">vs last week</span>
                    </div>
                  </div>
                  <div className="relative">
                    <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className={`absolute -inset-1 bg-gradient-to-br ${card.gradient} rounded-2xl blur opacity-30 group-hover:opacity-60 transition-opacity`}></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart Section */}
      <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl border border-white/20 overflow-hidden">
        <div className="relative p-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500"></div>

          <div className="flex items-center space-x-3 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Session Activity (Last 7 Days)</h3>
          </div>

          {analytics.sessionsByDay.length > 0 ? (
            <div className="relative">
              <div className="flex items-end justify-between space-x-3 h-64">
                {analytics.sessionsByDay.map((day, index) => (
                  <div key={index} className="group flex-1 flex flex-col items-center">
                    <div className="flex-1 flex items-end w-full">
                      <div
                        className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t-xl transition-all duration-500 group-hover:from-orange-600 group-hover:to-red-600 shadow-lg relative overflow-hidden"
                        style={{
                          height: day.count === 0 ? '2px' : `${Math.max((day.count / maxCount) * 100, 12)}%`,
                          minHeight: day.count > 0 ? '12px' : '2px'
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          {day.count} sessions
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-gray-600 font-medium">
                      {day.date}
                    </div>
                    <div className="text-sm font-bold text-gray-900 bg-white px-2 py-1 rounded-lg shadow-sm">
                      {day.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="relative mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center shadow-xl">
                  <BarChart3 className="h-10 w-10 text-gray-400" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-400 to-red-500 rounded-3xl blur opacity-20 animate-pulse"></div>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h4>
              <p className="text-gray-600">
                Session activity will be displayed here once you have some sessions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="backdrop-blur-xl bg-white/80 rounded-3xl shadow-xl border border-white/20">
        <div className="relative p-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <Calendar className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">Quick Stats</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Sessions Today',
                value: analytics.sessionsByDay[analytics.sessionsByDay.length - 1]?.count || 0,
                gradient: 'from-blue-500 to-purple-600',
                bgGradient: 'from-blue-50 to-purple-50'
              },
              {
                title: 'Sessions Yesterday',
                value: analytics.sessionsByDay[analytics.sessionsByDay.length - 2]?.count || 0,
                gradient: 'from-purple-500 to-pink-600',
                bgGradient: 'from-purple-50 to-pink-50'
              },
              {
                title: 'Week Total',
                value: analytics.sessionsByDay.reduce((sum, day) => sum + day.count, 0),
                gradient: 'from-pink-500 to-red-600',
                bgGradient: 'from-pink-50 to-red-50'
              }
            ].map((stat) => (
              <div
                key={stat.title}
                className="relative overflow-hidden rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient}`}></div>
                <div className="relative">
                  <dt className="text-sm font-semibold text-gray-600 mb-2">
                    {stat.title}
                  </dt>
                  <dd className={`text-4xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </dd>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Animation Styles */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default Analytics;