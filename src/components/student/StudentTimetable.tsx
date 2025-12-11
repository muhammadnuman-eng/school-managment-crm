import { useState } from 'react';
import { Calendar, Clock, MapPin, User, ChevronLeft, ChevronRight, Download, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useSchedule } from '../../hooks/useStudentData';

// Skeleton loader
function TimetableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-20" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-[500px]" />
    </div>
  );
}

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'
];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export function StudentTimetable() {
  const [weekOffset, setWeekOffset] = useState(0);

  // API Hook - Based on student-panel-apis.json
  // PROFILE_04: /student/schedule
  const { data: schedule, loading, error, refetch } = useSchedule(weekOffset);

  // Group schedule by day
  const scheduleByDay = weekDays.reduce((acc, day) => {
    acc[day] = schedule?.filter(item => item.day === day) || [];
    return acc;
  }, {} as Record<string, typeof schedule>);

  // Calculate stats
  const totalClasses = schedule?.length || 0;
  const uniqueSubjects = new Set(schedule?.map(item => item.subject) || []).size;
  const todayClasses = scheduleByDay[new Date().toLocaleDateString('en-US', { weekday: 'long' })]?.length || 0;

  // Get week dates
  const getWeekDates = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + (weekOffset * 7));
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return {
      start: monday,
      end: friday,
      label: `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    };
  };

  const weekDates = getWeekDates();

  const getColorClasses = (subject: string) => {
    const colors: Record<string, string> = {
      'Mathematics': 'bg-blue-100 border-blue-300 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700 dark:text-blue-200',
      'Physics': 'bg-green-100 border-green-300 text-green-900 dark:bg-green-900/20 dark:border-green-700 dark:text-green-200',
      'Chemistry': 'bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-200',
      'Biology': 'bg-teal-100 border-teal-300 text-teal-900 dark:bg-teal-900/20 dark:border-teal-700 dark:text-teal-200',
      'English': 'bg-purple-100 border-purple-300 text-purple-900 dark:bg-purple-900/20 dark:border-purple-700 dark:text-purple-200',
      'History': 'bg-pink-100 border-pink-300 text-pink-900 dark:bg-pink-900/20 dark:border-pink-700 dark:text-pink-200',
      'Computer Science': 'bg-indigo-100 border-indigo-300 text-indigo-900 dark:bg-indigo-900/20 dark:border-indigo-700 dark:text-indigo-200',
    };
    return colors[subject] || 'bg-gray-100 border-gray-300 text-gray-900 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-200';
  };

  if (loading) {
    return <TimetableSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2">My Timetable</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your weekly class schedule
          </p>
          {error && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Unable to load schedule. Please try again.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Week Navigation */}
      <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(prev => prev - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="text-center">
              <p className="text-lg text-gray-900 dark:text-white">Week of {weekDates.label}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {weekOffset === 0 ? 'Current Week' : weekOffset > 0 ? `${weekOffset} week(s) ahead` : `${Math.abs(weekOffset)} week(s) ago`}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset(prev => prev + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setWeekOffset(0)}>
            Today
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Classes This Week</p>
              <p className="text-3xl text-blue-900 dark:text-blue-100">{totalClasses}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">Total Subjects</p>
              <p className="text-3xl text-green-900 dark:text-green-100">{uniqueSubjects}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Today's Classes</p>
              <p className="text-3xl text-purple-900 dark:text-purple-100">{todayClasses}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Timetable Grid */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl text-gray-900 dark:text-white mb-4">Weekly Schedule</h2>

          {/* Desktop View - Grid */}
          <div className="hidden lg:block overflow-x-auto">
            <div className="grid grid-cols-6 gap-4 min-w-max">
              {/* Header */}
              <div className="col-span-1">
                <div className="h-16 flex items-center justify-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Time</span>
                </div>
              </div>
              {weekDays.map((day, idx) => {
                const dayDate = new Date(weekDates.start);
                dayDate.setDate(dayDate.getDate() + idx);
                return (
                  <div key={day} className="col-span-1">
                    <div className="h-16 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <span className="text-sm text-gray-900 dark:text-white">{day}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {dayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Time Slots */}
              {timeSlots.map((time) => (
                <div key={time} className="col-span-6 grid grid-cols-6 gap-4">
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{time}</span>
                  </div>
                  {weekDays.map((day) => {
                    const period = scheduleByDay[day]?.find(p => p.startTime === time);
                    return (
                      <div key={`${day}-${time}`} className="col-span-1">
                        {period ? (
                          <Card className={`p-3 border-2 ${getColorClasses(period.subject)} h-full`}>
                            <div className="space-y-1">
                              <p className="text-sm font-medium">{period.subject}</p>
                              <p className="text-xs opacity-80">{period.teacher}</p>
                              <div className="flex items-center gap-1 text-xs opacity-80">
                                <MapPin className="w-3 h-3" />
                                {period.room}
                              </div>
                            </div>
                          </Card>
                        ) : (
                          <div className="h-full bg-gray-50 dark:bg-gray-900/30 rounded border border-dashed border-gray-200 dark:border-gray-700 min-h-[80px]"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Mobile View - List */}
          <div className="lg:hidden space-y-4">
            {weekDays.map((day, idx) => {
              const dayDate = new Date(weekDates.start);
              dayDate.setDate(dayDate.getDate() + idx);
              const daySchedule = scheduleByDay[day] || [];
              
              return (
                <div key={day}>
                  <div className="mb-3">
                    <h3 className="text-lg text-gray-900 dark:text-white">{day}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dayDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {daySchedule.length > 0 ? (
                      daySchedule.map((period) => (
                        <Card key={period.id} className={`p-4 border-2 ${getColorClasses(period.subject)}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-medium mb-1">{period.subject}</p>
                              <p className="text-xs opacity-80">{period.teacher}</p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {period.startTime} - {period.endTime}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1 text-xs opacity-80">
                            <MapPin className="w-3 h-3" />
                            {period.room}
                          </div>
                        </Card>
                      ))
                    ) : (
                      <Card className="p-4 bg-gray-50 dark:bg-gray-900/30 border-dashed">
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No classes scheduled</p>
                      </Card>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}
