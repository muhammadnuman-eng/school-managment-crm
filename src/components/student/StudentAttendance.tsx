import { useState } from 'react';
import { Calendar, Check, X, Clock, Download, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { useAttendanceList, useAttendanceSummary, useSubjectAttendance, useAttendanceOverview } from '../../hooks/useStudentData';

// Skeleton loader
function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-96" />
        <Skeleton className="h-96" />
      </div>
    </div>
  );
}

export function StudentAttendance() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // API Hooks - Based on student-panel-apis.json
  // ATTENDANCE_02: /student/attendance/summary
  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } = useAttendanceSummary();
  
  // ATTENDANCE_06: /student/attendance/subjects
  const { data: subjectAttendance, loading: subjectLoading } = useSubjectAttendance();
  
  // ATTENDANCE_01: /student/attendance
  const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
  const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];
  const { data: attendanceRecords, loading: recordsLoading } = useAttendanceList({ startDate, endDate });

  const loading = summaryLoading || subjectLoading || recordsLoading;

  // Stats from API
  const overallStats = summary || {
    totalDays: 0,
    present: 0,
    absent: 0,
    late: 0,
    leave: 0,
    percentage: 0,
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PRESENT': return 'bg-green-500';
      case 'ABSENT': return 'bg-red-500';
      case 'LATE': return 'bg-orange-500';
      case 'LEAVE': return 'bg-purple-500';
      default: return 'bg-gray-300';
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const getAttendanceForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return attendanceRecords?.find(r => r.date === dateStr);
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const weeks = [];
    let days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const attendance = getAttendanceForDate(date);
      const isToday = date.toDateString() === new Date().toDateString();

      days.push(
        <div
          key={day}
          className={`aspect-square border border-gray-200 dark:border-gray-700 rounded-lg p-2 flex flex-col items-center justify-center ${
            isToday ? 'ring-2 ring-blue-500' : ''
          } ${attendance ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/50'}`}
        >
          <span className="text-sm text-gray-900 dark:text-white mb-1">{day}</span>
          {attendance && (
            <div className={`w-2 h-2 rounded-full ${getStatusColor(attendance.status)}`} />
          )}
        </div>
      );

      if ((startingDayOfWeek + day) % 7 === 0 || day === daysInMonth) {
        weeks.push(
          <div key={`week-${weeks.length}`} className="grid grid-cols-7 gap-2">
            {days}
          </div>
        );
        days = [];
      }
    }

    return weeks;
  };

  if (loading) {
    return <AttendanceSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2">My Attendance</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your attendance record and history
          </p>
          {summaryError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Unable to load attendance data. Please try again.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchSummary()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Overall</p>
              <p className="text-3xl text-blue-900 dark:text-blue-100">{overallStats.percentage}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Present</p>
              <p className="text-3xl text-green-600 dark:text-green-400">{overallStats.present}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Absent</p>
              <p className="text-3xl text-red-600 dark:text-red-400">{overallStats.absent}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <X className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Late</p>
              <p className="text-3xl text-orange-600 dark:text-orange-400">{overallStats.late}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Leave</p>
              <p className="text-3xl text-purple-600 dark:text-purple-400">{overallStats.leave}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar View */}
        <Card className="lg:col-span-2 p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl text-gray-900 dark:text-white">
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm text-gray-600 dark:text-gray-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {renderCalendar()}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Present</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Absent</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Late</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Leave</span>
            </div>
          </div>
        </Card>

        {/* Subject-wise Attendance */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg text-gray-900 dark:text-white mb-4">Subject-wise Attendance</h3>
          <div className="space-y-4">
            {subjectAttendance && subjectAttendance.length > 0 ? (
              subjectAttendance.map((subject) => (
                <div key={subject.subject.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-900 dark:text-white">{subject.subject.name}</span>
                    <Badge variant="outline" className={
                      subject.percentage >= 90 ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400' :
                      subject.percentage >= 75 ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400' :
                      'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400'
                    }>
                      {subject.percentage}%
                    </Badge>
                  </div>
                  <Progress value={subject.percentage} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{subject.present}/{subject.totalClasses} classes</span>
                    <span>{subject.absent} absent</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No subject data available
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Detailed Subject Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl text-gray-900 dark:text-white">Detailed Attendance Record</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Subject</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Present</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Absent</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Late</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Total</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Percentage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {subjectAttendance && subjectAttendance.length > 0 ? (
                subjectAttendance.map((subject) => (
                  <tr key={subject.subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{subject.subject.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{subject.subject.teacher}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                        {subject.present}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                        {subject.absent}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                        {subject.late}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-white">{subject.totalClasses}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Progress value={subject.percentage} className="w-20" />
                        <span className="text-sm text-gray-900 dark:text-white">{subject.percentage}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No attendance records available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
