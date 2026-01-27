import { useState, useEffect } from 'react';
import { Users, GraduationCap, DollarSign, CalendarCheck, TrendingUp, TrendingDown, Activity, Award } from 'lucide-react';
import { StatCard } from '../dashboard/StatCard';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { adminService } from '../../services';
import { DashboardStatsResponse } from '../../types/dashboard.types';
import { toast } from 'sonner@2.0.3';
import { getUserFriendlyError } from '../../utils/errors';
import { ApiException } from '../../utils/errors';

// Default chart data fallbacks - Only used if API doesn't return data
// Commented out to force API data usage - uncomment only for fallback
/*
const defaultAttendanceTrend = [
  { month: 'Jan', attendance: 92 },
  { month: 'Feb', attendance: 88 },
  { month: 'Mar', attendance: 94 },
  { month: 'Apr', attendance: 91 },
  { month: 'May', attendance: 89 },
  { month: 'Jun', attendance: 93 },
];

const defaultRevenueData = [
  { month: 'Jan', revenue: 45000, expenses: 28000 },
  { month: 'Feb', revenue: 52000, expenses: 30000 },
  { month: 'Mar', revenue: 48000, expenses: 29000 },
  { month: 'Apr', revenue: 61000, expenses: 32000 },
  { month: 'May', revenue: 55000, expenses: 31000 },
  { month: 'Jun', revenue: 67000, expenses: 33000 },
];

const defaultClassDistribution = [
  { name: 'Grade 1-3', value: 320, color: '#0A66C2' },
  { name: 'Grade 4-6', value: 280, color: '#4A90E2' },
  { name: 'Grade 7-9', value: 240, color: '#7FB3F5' },
  { name: 'Grade 10-12', value: 200, color: '#B3D4FC' },
];
*/

// Empty defaults - charts will show empty if API doesn't return data
const defaultAttendanceTrend: Array<{ month: string; attendance: number }> = [];
const defaultRevenueData: Array<{ month: string; revenue: number; expenses: number }> = [];
const defaultClassDistribution: Array<{ name: string; value: number; color: string }> = [];

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      setHasError(false);
      try {
        const data = await adminService.getDashboardStats();
        
        // Log response for debugging
        if (import.meta.env.DEV) {
          console.log('Dashboard Stats Component - Received Data:', {
            data,
            hasRevenueData: !!data.revenueData,
            hasAttendanceTrend: !!data.attendanceTrend,
            hasClassDistribution: !!data.classDistribution,
            revenueDataSample: data.revenueData?.[0],
            attendanceTrendSample: data.attendanceTrend?.[0],
            classDistributionSample: data.classDistribution?.[0],
          });
        }
        
        setStats(data);
      } catch (error: any) {
        setHasError(true);
        let errorMessage = 'Failed to load dashboard stats.';
        
        if (error instanceof ApiException) {
          // Check for CORS errors - don't show error toast, just log it
          if (error.code === 'CORS_ERROR') {
            console.error('CORS Error on dashboard API:', {
              message: error.message,
              details: error.details,
              note: 'Backend needs to allow X-School-UUID header in CORS configuration',
            });
            errorMessage = 'Dashboard data unavailable. Please check backend CORS configuration.';
          } else {
            errorMessage = getUserFriendlyError(error);
          }
        } else if (error?.message) {
          errorMessage = error.message;
        }
        
        // Only show toast for non-CORS errors
        if (!(error instanceof ApiException && error.code === 'CORS_ERROR')) {
          toast.error(errorMessage);
        }
        
        console.error('Dashboard stats error:', error);
        
        // Set default/fallback stats so dashboard still renders (don't redirect)
        setStats({
          students: { total: 0, change: 0, changeType: 'positive' },
          teachers: { total: 0, change: 0, changeType: 'positive' },
          fees: { total: 0, currency: 'PKR', change: 0, changeType: 'positive' },
          attendance: { average: 0, change: 0, changeType: 'positive' },
          topPerformers: [],
          recentActivities: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  // Format number with commas - safe handling
  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) {
      return '0';
    }
    return num.toLocaleString('en-US');
  };

  // Format currency - safe handling
  const formatCurrency = (amount: number | undefined | null, currency: string = 'PKR'): string => {
    const safeAmount = amount || 0;
    if (isNaN(safeAmount)) {
      return `${currency} 0`;
    }
    if (safeAmount >= 1000000) {
      return `${currency} ${(safeAmount / 1000000).toFixed(1)}M`;
    } else if (safeAmount >= 1000) {
      return `${currency} ${(safeAmount / 1000).toFixed(1)}K`;
    }
    return `${currency} ${formatNumber(safeAmount)}`;
  };

  // Format percentage - safe handling
  const formatPercentage = (value: number | undefined | null): string => {
    const safeValue = value || 0;
    if (isNaN(safeValue)) {
      return '0.0%';
    }
    return `${safeValue.toFixed(1)}%`;
  };

  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Extract data with safe defaults - handle different response structures
  // Always provide defaults so dashboard renders even if API fails
  const studentsData = stats?.students ?? { total: 0, change: 0, changeType: 'positive' as const };
  const teachersData = stats?.teachers ?? { total: 0, change: 0, changeType: 'positive' as const };
  const feesData = stats?.fees ?? { total: 0, currency: 'PKR', change: 0, changeType: 'positive' as const };
  const attendanceData = stats?.attendance ?? { average: 0, change: 0, changeType: 'positive' as const };
  const topPerformers = Array.isArray(stats?.topPerformers) ? stats.topPerformers : [];
  const recentActivities = Array.isArray(stats?.recentActivities) ? stats.recentActivities : [];
  
  // Graph data from API or defaults - with detailed logging and validation
  const revenueData = (() => {
    if (Array.isArray(stats?.revenueData) && stats.revenueData.length > 0) {
      // Validate and normalize revenue data structure
      const normalized = stats.revenueData.map(item => ({
        month: item.month || 'Unknown',
        revenue: typeof item.revenue === 'number' ? item.revenue : 0,
        expenses: typeof item.expenses === 'number' ? item.expenses : 0,
      }));
      if (import.meta.env.DEV) {
        console.log('✅ Using API revenueData:', normalized);
      }
      return normalized;
    }
    if (import.meta.env.DEV) {
      console.warn('⚠️ Using default revenueData - API data not available or empty', {
        hasStats: !!stats,
        hasRevenueData: !!stats?.revenueData,
        revenueDataType: Array.isArray(stats?.revenueData) ? 'array' : typeof stats?.revenueData,
        revenueDataLength: Array.isArray(stats?.revenueData) ? stats.revenueData.length : 'N/A',
      });
    }
    return defaultRevenueData;
  })();
  
  const attendanceTrend = (() => {
    if (Array.isArray(stats?.attendanceTrend) && stats.attendanceTrend.length > 0) {
      // Validate and normalize attendance trend data structure
      const normalized = stats.attendanceTrend.map(item => ({
        month: item.month || 'Unknown',
        attendance: typeof item.attendance === 'number' ? item.attendance : 0,
      }));
      if (import.meta.env.DEV) {
        console.log('✅ Using API attendanceTrend:', normalized);
      }
      return normalized;
    }
    if (import.meta.env.DEV) {
      console.warn('⚠️ Using default attendanceTrend - API data not available or empty', {
        hasStats: !!stats,
        hasAttendanceTrend: !!stats?.attendanceTrend,
        attendanceTrendType: Array.isArray(stats?.attendanceTrend) ? 'array' : typeof stats?.attendanceTrend,
        attendanceTrendLength: Array.isArray(stats?.attendanceTrend) ? stats.attendanceTrend.length : 'N/A',
      });
    }
    return defaultAttendanceTrend;
  })();
  
  const classDistribution = (() => {
    if (Array.isArray(stats?.classDistribution) && stats.classDistribution.length > 0) {
      // Validate and normalize class distribution data structure
      const mapped = stats.classDistribution.map((item, index) => ({
        name: item.name || `Category ${index + 1}`,
        value: typeof item.value === 'number' ? item.value : 0,
        color: item.color || ['#0A66C2', '#4A90E2', '#7FB3F5', '#B3D4FC'][index % 4],
      }));
      if (import.meta.env.DEV) {
        console.log('✅ Using API classDistribution:', mapped);
      }
      return mapped;
    }
    if (import.meta.env.DEV) {
      console.warn('⚠️ Using default classDistribution - API data not available or empty', {
        hasStats: !!stats,
        hasClassDistribution: !!stats?.classDistribution,
        classDistributionType: Array.isArray(stats?.classDistribution) ? 'array' : typeof stats?.classDistribution,
        classDistributionLength: Array.isArray(stats?.classDistribution) ? stats.classDistribution.length : 'N/A',
      });
    }
    return defaultClassDistribution;
  })();
  
  // Track if using API data or defaults
  const isUsingApiData = {
    revenue: Array.isArray(stats?.revenueData) && stats.revenueData.length > 0,
    attendance: Array.isArray(stats?.attendanceTrend) && stats.attendanceTrend.length > 0,
    distribution: Array.isArray(stats?.classDistribution) && stats.classDistribution.length > 0,
  };
  
  // Calculate revenue trend percentage
  const revenueTrend = revenueData.length > 1
    ? ((revenueData[revenueData.length - 1].revenue - revenueData[0].revenue) / revenueData[0].revenue) * 100
    : 0;
  
  // Calculate average attendance from trend
  const avgAttendanceFromTrend = attendanceTrend.length > 0
    ? attendanceTrend.reduce((sum, item) => sum + item.attendance, 0) / attendanceTrend.length
    : 0;

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A66C2]/10 to-blue-500/10 rounded-3xl blur-3xl -z-10"></div>
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Welcome back! Here's what's happening today.</p>
          {hasError && (
            <div className="mt-2 text-sm text-orange-600 dark:text-orange-400">
              ⚠️ Unable to load live data. Showing default values.
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid - Compact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Students"
          value={isLoading ? 'Loading...' : formatNumber(studentsData?.total)}
          change={
            studentsData?.change !== undefined && !isNaN(studentsData.change)
              ? `${studentsData.change >= 0 ? '+' : ''}${studentsData.change.toFixed(2)}%`
              : undefined
          }
          changeType={studentsData?.changeType || 'positive'}
          gradient="from-purple-600 to-purple-700"
        />
        <StatCard
          title="Total Teachers"
          value={isLoading ? 'Loading...' : formatNumber(teachersData?.total)}
          change={
            teachersData?.change !== undefined && !isNaN(teachersData.change)
              ? `${teachersData.change >= 0 ? '+' : ''}${teachersData.change.toFixed(2)}%`
              : undefined
          }
          changeType={teachersData?.changeType || 'positive'}
          gradient="from-blue-600 to-blue-700"
        />
        <StatCard
          title="Fees Collected"
          value={isLoading ? 'Loading...' : formatCurrency(feesData?.total, feesData?.currency)}
          change={
            feesData?.change !== undefined && !isNaN(feesData.change)
              ? `${feesData.change >= 0 ? '+' : ''}${feesData.change.toFixed(2)}%`
              : undefined
          }
          changeType={feesData?.changeType || 'positive'}
          gradient="from-cyan-500 to-cyan-600"
        />
        <StatCard
          title="Avg Attendance"
          value={isLoading ? 'Loading...' : formatPercentage(attendanceData?.average)}
          change={
            attendanceData?.change !== undefined && !isNaN(attendanceData.change)
              ? `${attendanceData.change >= 0 ? '+' : ''}${attendanceData.change.toFixed(2)}%`
              : undefined
          }
          changeType={attendanceData?.changeType || 'positive'}
          gradient="from-green-500 to-green-600"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart - Enhanced 3D Card */}
        <div className="lg:col-span-2 group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-1 opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-0.5 opacity-50"></div>

          <Card className="relative rounded-3xl p-8 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl text-gray-900 dark:text-white mb-1 tracking-tight">Revenue vs Expenses</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Monthly financial overview
                    {!isUsingApiData.revenue && !isLoading && (
                      <span className="ml-2 text-xs text-orange-500">(Sample Data)</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className={`text-sm font-medium ${revenueTrend >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                    {revenueTrend >= 0 ? '+' : ''}{revenueTrend.toFixed(1)}%
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueData} key={`revenue-${revenueData.length}-${isLoading}`}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" opacity={0.5} />
                  <XAxis
                    dataKey="month"
                    className="text-sm"
                    stroke="#9CA3AF"
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    tick={{ fill: '#6B7280' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: '20px' }}
                    iconType="circle"
                  />
                  <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="expenses" fill="url(#expensesGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0A66C2" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0A66C2" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E8F0FE" stopOpacity={1} />
                      <stop offset="100%" stopColor="#E8F0FE" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Class Distribution - Enhanced 3D Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-1 opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-0.5 opacity-50"></div>

          <Card className="relative rounded-3xl p-8 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="mb-6">
                <h3 className="text-xl text-gray-900 dark:text-white mb-1 tracking-tight">Class Distribution</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Student enrollment by grade
                  {!isUsingApiData.distribution && !isLoading && (
                    <span className="ml-2 text-xs text-orange-500">(Sample Data)</span>
                  )}
                </p>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart key={`distribution-${classDistribution.length}-${isLoading}`}>
                  <Pie
                    data={classDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {classDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-3 mt-4">
                {classDistribution.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shadow-sm"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{item.name}</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers - Enhanced 3D Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-1 opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-0.5 opacity-50"></div>

          <Card className="relative rounded-3xl p-8 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-amber-100 flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl text-gray-900 dark:text-white tracking-tight">Top Performers</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Highest achieving students</p>
                </div>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading top performers...
                  </div>
                ) : topPerformers.length > 0 ? (
                  topPerformers.map((student, index) => (
                    <div
                      key={student.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-100 dark:border-gray-800"
                    >
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-gray-800 shadow-lg">
                          <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-blue-600 text-white text-sm">
                            {student.avatar || getInitials(student.name)}
                          </AvatarFallback>
                        </Avatar>
                        {index === 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                            <span className="text-xs">🏆</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{student.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{student.class}</p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                          {formatPercentage(student.score)}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No top performers data available
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Activity - Enhanced 3D Card */}
        <div className="group relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-1 opacity-30"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-0.5 opacity-50"></div>

          <Card className="relative rounded-3xl p-8 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center shadow-lg">
                  <Activity className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl text-gray-900 dark:text-white tracking-tight">Recent Activity</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Latest system updates</p>
                </div>
              </div>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Loading recent activities...
                  </div>
                ) : recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-gray-100 dark:border-gray-800"
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 shadow-md ${
                        activity.type === 'student' ? 'bg-blue-500' :
                        activity.type === 'payment' ? 'bg-green-500' :
                        activity.type === 'teacher' ? 'bg-purple-500' :
                        activity.type === 'exam' ? 'bg-orange-500' :
                        activity.type === 'meeting' ? 'bg-indigo-500' :
                        'bg-gray-500'
                      }`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white mb-1">{activity.action}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{activity.user}</span>
                          <span>•</span>
                          <span>{activity.time}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No recent activities available
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Attendance Trend - Full Width Enhanced Card */}
      <div className="group relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-1 opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-3xl transform translate-y-0.5 opacity-50"></div>

        <Card className="relative rounded-3xl p-8 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white dark:bg-gray-900">
          <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent dark:from-white/5 rounded-3xl pointer-events-none"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl text-gray-900 dark:text-white mb-1 tracking-tight">Attendance Trend</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  6-month attendance overview
                  {!isUsingApiData.attendance && !isLoading && (
                    <span className="ml-2 text-xs text-orange-500">(Sample Data)</span>
                  )}
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-[#0A66C2] to-blue-500 text-white border-0 shadow-md px-4 py-2">
                Avg: {formatPercentage(avgAttendanceFromTrend)}
              </Badge>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={attendanceTrend} key={`attendance-${attendanceTrend.length}-${isLoading}`}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" opacity={0.5} />
                <XAxis
                  dataKey="month"
                  className="text-sm"
                  stroke="#9CA3AF"
                  tick={{ fill: '#6B7280' }}
                />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="attendance"
                  stroke="url(#attendanceGradient)"
                  strokeWidth={3}
                  dot={{ fill: '#0A66C2', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, strokeWidth: 2 }}
                />
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0A66C2" />
                    <stop offset="100%" stopColor="#4A90E2" />
                  </linearGradient>
                </defs>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
