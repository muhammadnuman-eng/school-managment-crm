import { Calendar, FileText, DollarSign, TrendingUp, BookOpen, Award, Loader2 } from 'lucide-react';
import { StatCard } from '../dashboard/StatCard';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { useDashboard, useAnnouncements } from '../../hooks/useStudentData';

// Skeleton loader for dashboard
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

// Priority helper based on due date
function getPriorityFromDueDate(dueDate: string): { label: string; class: string } {
  const today = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 2) return { label: 'High', class: 'bg-red-50 text-red-700 border-red-200' };
  if (diffDays <= 5) return { label: 'Medium', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' };
  return { label: 'Low', class: 'bg-gray-50 text-gray-700 border-gray-200' };
}

export function StudentDashboard() {
  // API hooks - /student/dashboard
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard();
  // API hooks - /student/communications/announcements
  const { data: announcements, loading: announcementsLoading } = useAnnouncements();

  const loading = dashboardLoading;

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Extract data from API response
  const studentName = dashboardData?.student?.name || 'Student';
  const stats = dashboardData?.stats;
  const upcomingClasses = dashboardData?.upcomingClasses || [];
  const recentGrades = dashboardData?.recentGrades || [];
  const pendingAssignments = dashboardData?.upcomingClasses ? [] : []; // Will use separate assignments API

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Welcome back, {studentName.split(' ')[0]}!</h1>
        <p className="text-gray-600 dark:text-gray-400">Here's your academic overview for today</p>
        {dashboardError && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            Unable to connect to server. Please check your connection.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Attendance"
          value={`${stats?.attendancePercentage || 0}%`}
          change="This month"
          changeType="positive"
          icon={Calendar}
          iconColor="text-[#0A66C2]"
          iconBg="bg-[#E8F0FE]"
        />
        <StatCard
          title="Current GPA"
          value={stats?.gpa?.toFixed(2) || '0.00'}
          change="Current term"
          changeType="positive"
          icon={TrendingUp}
          iconColor="text-green-600"
          iconBg="bg-green-50"
        />
        <StatCard
          title="Pending Assignments"
          value={String(stats?.pendingAssignments || 0)}
          change="Due soon"
          changeType="neutral"
          icon={FileText}
          iconColor="text-orange-600"
          iconBg="bg-orange-50"
        />
        <StatCard
          title="Fee Due"
          value={`PKR ${(stats?.pendingFees || 0).toLocaleString()}`}
          change="Pending amount"
          changeType="neutral"
          icon={DollarSign}
          iconColor="text-red-600"
          iconBg="bg-red-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg text-gray-900 dark:text-white mb-4">Today's Schedule</h3>
          <div className="space-y-3">
            {upcomingClasses.length > 0 ? (
              upcomingClasses.map((classItem) => (
                <div key={classItem.id} className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#0A66C2] to-[#0052A3] flex items-center justify-center text-white flex-shrink-0">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h4 className="text-sm text-gray-900 dark:text-white">{classItem.subject}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{classItem.teacher}</p>
                      </div>
                      <Badge variant="outline" className="bg-[#E8F0FE] text-[#0A66C2] border-[#0A66C2]">
                        {classItem.time}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{classItem.room}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No classes scheduled for today
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg text-gray-900 dark:text-white mb-4">Announcements</h3>
          <div className="space-y-3">
            {announcementsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : announcements && announcements.length > 0 ? (
              announcements.slice(0, 5).map((announcement) => (
                <div key={announcement.id} className="pb-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                  <p className="text-sm text-gray-900 dark:text-white mb-1">{announcement.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(announcement.date).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                No announcements
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full mt-4">View All</Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg text-gray-900 dark:text-white mb-4">Recent Grades</h3>
          <div className="space-y-4">
            {recentGrades.length > 0 ? (
              recentGrades.map((grade, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{grade.subject}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900 dark:text-white">{grade.score}/{grade.maxScore}</span>
                      <Badge 
                        variant="outline" 
                        className={`${
                          grade.grade.startsWith('A') ? 'bg-green-50 text-green-700 border-green-200' :
                          grade.grade.startsWith('B') ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {grade.grade}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={(grade.score / grade.maxScore) * 100} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No recent grades
              </div>
            )}
          </div>
          <Button variant="outline" className="w-full mt-4">View All Grades</Button>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-gray-900 dark:text-white">Quick Actions</h3>
            <Award className="w-5 h-5 text-[#0A66C2]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <FileText className="w-5 h-5" />
              <span className="text-xs">Assignments</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Calendar className="w-5 h-5" />
              <span className="text-xs">Attendance</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Grades</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <DollarSign className="w-5 h-5" />
              <span className="text-xs">Fees</span>
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
