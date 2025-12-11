/**
 * Dashboard Types
 * TypeScript types for dashboard-related API requests and responses
 */

/**
 * Dashboard Stats Response
 */
export interface DashboardStatsResponse {
  students: {
    total: number;
    change?: number;
    changeType?: 'positive' | 'negative';
  };
  teachers: {
    total: number;
    change?: number;
    changeType?: 'positive' | 'negative';
  };
  fees: {
    total: number;
    currency?: string;
    change?: number;
    changeType?: 'positive' | 'negative';
  };
  attendance: {
    average: number;
    change?: number;
    changeType?: 'positive' | 'negative';
  };
  topPerformers?: Array<{
    id: string;
    name: string;
    class: string;
    score: number;
    avatar?: string;
  }>;
  recentActivities?: Array<{
    id: string;
    action: string;
    user: string;
    time: string;
    type: 'student' | 'payment' | 'teacher' | 'exam' | 'meeting' | string;
  }>;
  // Graph data
  revenueData?: Array<{
    month: string;
    revenue: number;
    expenses: number;
  }>;
  attendanceTrend?: Array<{
    month: string;
    attendance: number;
  }>;
  classDistribution?: Array<{
    name: string;
    value: number;
    color?: string;
  }>;
}

