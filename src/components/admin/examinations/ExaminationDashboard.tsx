import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Users, Book, Filter, ChevronLeft, ChevronRight, Plus, MoreVertical, Eye, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Exam } from '../Examinations';
import { adminService } from '../../../services';
import { Examination } from '../../../types/examination.types';
import { toast } from 'sonner';

interface ExaminationDashboardProps {
  onCreateExam: () => void;
  onViewExam: (exam: Exam) => void;
  onViewList: () => void;
  onViewAnalytics: () => void;
}

// Helper function to convert Examination to Exam
function convertExaminationToExam(examination: Examination): Exam {
  return {
    id: examination.id,
    name: examination.examName,
    type: examination.examType,
    academicYear: examination.academicYearName || examination.academicYearId,
    startDate: examination.startDate || '',
    endDate: examination.endDate || '',
    classes: examination.examClasses?.map(ec => ec.className || ec.classId) || [],
    subjects: examination.examSubjects?.map(es => es.subjectName || es.subjectId) || [],
    status: examination.status === 'SCHEDULED' ? 'Scheduled' : 
            examination.status === 'ONGOING' ? 'Ongoing' :
            examination.status === 'COMPLETED' ? 'Completed' : 'Archived',
    totalStudents: 0, // This would need to be calculated from examClasses
    marksEntryProgress: 0, // This would need to be fetched separately
    resultsPublished: 0, // This would need to be fetched separately
  };
}

export function ExaminationDashboard({ onCreateExam, onViewExam, onViewList, onViewAnalytics }: ExaminationDashboardProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [ongoingExams, setOngoingExams] = useState<Exam[]>([]);
  const [completedExams, setCompletedExams] = useState<Exam[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<Array<{ date: number; title: string; type: string }>>([]);
  const [recentActivities, setRecentActivities] = useState<Array<{ id: number; title: string; time: string; icon: any; color: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentMonth, currentYear]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch all exams data
      const [allExamsResponse, calendar, activities] = await Promise.all([
        adminService.getExaminations(),
        adminService.getExamCalendar(currentMonth + 1, currentYear),
        adminService.getExamActivities(10),
      ]);

      const allExams = allExamsResponse.examinations || [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      today.setHours(0, 0, 0, 0);

      // Categorize exams based on dates and status
      const upcoming: Exam[] = [];
      const ongoing: Exam[] = [];
      const completed: Exam[] = [];

      allExams.forEach((exam: Examination) => {
        const examStartDate = exam.startDate ? new Date(exam.startDate) : null;
        const examEndDate = exam.endDate ? new Date(exam.endDate) : null;
        
        let startDateNormalized: Date | null = null;
        let endDateNormalized: Date | null = null;
        
        if (examStartDate) {
          // Handle UTC dates properly - use UTC methods to get the date regardless of timezone
          const year = examStartDate.getUTCFullYear();
          const month = examStartDate.getUTCMonth();
          const date = examStartDate.getUTCDate();
          startDateNormalized = new Date(year, month, date);
          startDateNormalized.setHours(0, 0, 0, 0);
        }
        if (examEndDate) {
          // Handle UTC dates properly
          const year = examEndDate.getUTCFullYear();
          const month = examEndDate.getUTCMonth();
          const date = examEndDate.getUTCDate();
          endDateNormalized = new Date(year, month, date);
          endDateNormalized.setHours(23, 59, 59, 999);
        }

        const convertedExam = convertExaminationToExam(exam);

        // Priority: Check dates first, then status
        // Completed: End date has passed
        if (endDateNormalized && endDateNormalized < today) {
          completed.push(convertedExam);
        }
        // Ongoing: Today is between start and end date (inclusive)
        else if (startDateNormalized && endDateNormalized && 
                 startDateNormalized <= today && endDateNormalized >= today) {
          ongoing.push(convertedExam);
        }
        // Upcoming: Start date is in the future (or today if start date is today but end date is future)
        else if (startDateNormalized) {
          if (startDateNormalized > today) {
            // Start date is in the future
            upcoming.push(convertedExam);
          } else if (startDateNormalized.getTime() === today.getTime() && endDateNormalized && endDateNormalized > today) {
            // Start date is today but end date is in future - consider it upcoming if not already ongoing
            upcoming.push(convertedExam);
          } else {
            // Fallback: Use status
            if (exam.status === 'COMPLETED') {
              completed.push(convertedExam);
            } else if (exam.status === 'ONGOING') {
              ongoing.push(convertedExam);
            } else {
              upcoming.push(convertedExam);
            }
          }
        }
        // Fallback: Use status if dates are missing
        else if (exam.status === 'COMPLETED') {
          completed.push(convertedExam);
        } else if (exam.status === 'ONGOING') {
          ongoing.push(convertedExam);
        } else {
          // Default to upcoming (SCHEDULED status means upcoming)
          upcoming.push(convertedExam);
        }
      });

      // Debug logging
      if (import.meta.env.DEV) {
        console.log('Exams Categorization:', {
          total: allExams.length,
          upcoming: upcoming.length,
          ongoing: ongoing.length,
          completed: completed.length,
          today: today.toISOString(),
          todayDate: today.getDate(),
          todayMonth: today.getMonth(),
          todayYear: today.getFullYear(),
          exams: allExams.map(exam => {
            const examStart = exam.startDate ? new Date(exam.startDate) : null;
            const examEnd = exam.endDate ? new Date(exam.endDate) : null;
            return {
              name: exam.examName,
              startDate: exam.startDate,
              startDateParsed: examStart ? {
                date: examStart.getDate(),
                month: examStart.getMonth(),
                year: examStart.getFullYear(),
                iso: examStart.toISOString(),
              } : null,
              endDate: exam.endDate,
              endDateParsed: examEnd ? {
                date: examEnd.getDate(),
                month: examEnd.getMonth(),
                year: examEnd.getFullYear(),
                iso: examEnd.toISOString(),
              } : null,
              status: exam.status,
            };
          }),
          categorized: {
            upcoming: upcoming.map(e => ({ name: e.name, startDate: e.startDate })),
            ongoing: ongoing.map(e => ({ name: e.name, startDate: e.startDate })),
            completed: completed.map(e => ({ name: e.name, startDate: e.startDate })),
          },
        });
      }

      setUpcomingExams(upcoming);
      setOngoingExams(ongoing);
      setCompletedExams(completed);

      // Process calendar events from all exams
      const calendarEventsMap: Map<number, { title: string; type: string }> = new Map();
      const todayForCalendar = new Date();
      todayForCalendar.setHours(0, 0, 0, 0);
      
      allExams.forEach((exam: Examination) => {
        const examStartDate = exam.startDate ? new Date(exam.startDate) : null;
        const examEndDate = exam.endDate ? new Date(exam.endDate) : null;
        
        // Process exam schedules if available
        if (exam.examSchedules && exam.examSchedules.length > 0) {
          exam.examSchedules.forEach((schedule) => {
            const scheduleDate = new Date(schedule.examDate);
            const scheduleDateNormalized = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate());
            
            if (scheduleDateNormalized.getMonth() === currentMonth && scheduleDateNormalized.getFullYear() === currentYear) {
              const day = scheduleDateNormalized.getDate();
              
              // Determine exam status for this specific date
              let type: string;
              if (examEndDate) {
                const endDateNormalized = new Date(examEndDate.getFullYear(), examEndDate.getMonth(), examEndDate.getDate());
                if (endDateNormalized < todayForCalendar) {
                  type = 'completed'; // Past exam - Red
                } else if (scheduleDateNormalized <= todayForCalendar && endDateNormalized >= todayForCalendar) {
                  type = 'ongoing'; // Ongoing exam - Green
                } else {
                  type = 'upcoming'; // Upcoming exam - Blue
                }
              } else {
                type = scheduleDateNormalized < todayForCalendar ? 'completed' : 
                       scheduleDateNormalized.getTime() === todayForCalendar.getTime() ? 'ongoing' : 'upcoming';
              }

              const title = exam.examName || 'Exam';

              // If multiple exams on same day, prioritize ongoing > upcoming > completed
              if (calendarEventsMap.has(day)) {
                const existing = calendarEventsMap.get(day)!;
                const priorityOrder = { 'ongoing': 3, 'upcoming': 2, 'completed': 1 };
                const newPriority = priorityOrder[type as keyof typeof priorityOrder] || 0;
                const existingPriority = priorityOrder[existing.type as keyof typeof priorityOrder] || 0;
                
                calendarEventsMap.set(day, {
                  title: `${existing.title}, ${title}`,
                  type: newPriority > existingPriority ? type : existing.type,
                });
              } else {
                calendarEventsMap.set(day, { title, type });
              }
            }
          });
        } else if (examStartDate && examEndDate) {
          // Process exam date range - mark all days in the range
          const startDateNormalized = new Date(examStartDate.getFullYear(), examStartDate.getMonth(), examStartDate.getDate());
          const endDateNormalized = new Date(examEndDate.getFullYear(), examEndDate.getMonth(), examEndDate.getDate());
          
          // Check if exam date range overlaps with current month
          const monthStart = new Date(currentYear, currentMonth, 1);
          const monthEnd = new Date(currentYear, currentMonth + 1, 0);
          
          if (endDateNormalized >= monthStart && startDateNormalized <= monthEnd) {
            // Determine exam status
            let type: string;
            if (endDateNormalized < todayForCalendar) {
              type = 'completed'; // Past exam - Red
            } else if (startDateNormalized <= todayForCalendar && endDateNormalized >= todayForCalendar) {
              type = 'ongoing'; // Ongoing exam - Green
            } else {
              type = 'upcoming'; // Upcoming exam - Blue
            }
            
            const title = exam.examName || 'Exam';
            
            // Mark each day in the exam range
            const currentDate = new Date(Math.max(startDateNormalized.getTime(), monthStart.getTime()));
            const lastDate = new Date(Math.min(endDateNormalized.getTime(), monthEnd.getTime()));
            
            while (currentDate <= lastDate) {
              if (currentDate.getMonth() === currentMonth && currentDate.getFullYear() === currentYear) {
                const day = currentDate.getDate();
                
                // For each day, determine if it's today (ongoing) or past/future
                let dayType = type;
                if (type === 'ongoing') {
                  const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                  if (dayDate < todayForCalendar) {
                    dayType = 'completed'; // Past days in ongoing exam range
                  } else if (dayDate.getTime() === todayForCalendar.getTime()) {
                    dayType = 'ongoing'; // Today - Green
                  } else {
                    dayType = 'upcoming'; // Future days in ongoing exam range
                  }
                }
                
                if (calendarEventsMap.has(day)) {
                  const existing = calendarEventsMap.get(day)!;
                  const priorityOrder = { 'ongoing': 3, 'upcoming': 2, 'completed': 1 };
                  const newPriority = priorityOrder[dayType as keyof typeof priorityOrder] || 0;
                  const existingPriority = priorityOrder[existing.type as keyof typeof priorityOrder] || 0;
                  
                  calendarEventsMap.set(day, {
                    title: existing.title.includes(title) ? existing.title : `${existing.title}, ${title}`,
                    type: newPriority > existingPriority ? dayType : existing.type,
                  });
                } else {
                  calendarEventsMap.set(day, { title, type: dayType });
                }
              }
              currentDate.setDate(currentDate.getDate() + 1);
            }
          }
        } else if (exam.startDate) {
          // Fallback: single start date
          const examDate = new Date(exam.startDate);
          const examDateNormalized = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate());
          
          if (examDateNormalized.getMonth() === currentMonth && examDateNormalized.getFullYear() === currentYear) {
            const day = examDateNormalized.getDate();
            
            let type: string;
            if (examEndDate) {
              const endDateNormalized = new Date(examEndDate.getFullYear(), examEndDate.getMonth(), examEndDate.getDate());
              if (endDateNormalized < todayForCalendar) {
                type = 'completed';
              } else if (examDateNormalized <= todayForCalendar && endDateNormalized >= todayForCalendar) {
                type = 'ongoing';
              } else {
                type = 'upcoming';
              }
            } else {
              type = examDateNormalized < todayForCalendar ? 'completed' : 
                     examDateNormalized.getTime() === todayForCalendar.getTime() ? 'ongoing' : 'upcoming';
            }
            
            const title = exam.examName || 'Exam';

            if (calendarEventsMap.has(day)) {
              const existing = calendarEventsMap.get(day)!;
              const priorityOrder = { 'ongoing': 3, 'upcoming': 2, 'completed': 1 };
              const newPriority = priorityOrder[type as keyof typeof priorityOrder] || 0;
              const existingPriority = priorityOrder[existing.type as keyof typeof priorityOrder] || 0;
              
              calendarEventsMap.set(day, {
                title: `${existing.title}, ${title}`,
                type: newPriority > existingPriority ? type : existing.type,
              });
            } else {
              calendarEventsMap.set(day, { title, type });
            }
          }
        }
      });

      // Convert map to array
      const events = Array.from(calendarEventsMap.entries()).map(([date, event]) => ({
        date,
        title: event.title,
        type: event.type,
      }));

      setCalendarEvents(events);

      // Process activities - use exam data if activities API doesn't return data
      if (activities && Array.isArray(activities) && activities.length > 0) {
        const mappedActivities = activities.map((activity: any, index: number) => ({
          id: index + 1,
          title: activity.description || activity.title || activity.examName || 'Exam activity',
          time: activity.createdAt ? formatTimeAgo(activity.createdAt) : 'Recently',
          icon: Book,
          color: 'text-blue-600',
        }));
        setRecentActivities(mappedActivities);
      } else {
        // Fallback: create activities from recent exams
        const recentExams = [...allExams]
          .sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
          })
          .slice(0, 10);

        const mappedActivities = recentExams.map((exam: Examination, index: number) => ({
          id: index + 1,
          title: `${exam.examName} - ${exam.status || 'Scheduled'}`,
          time: exam.createdAt ? formatTimeAgo(exam.createdAt) : 'Recently',
          icon: Book,
          color: exam.status === 'ONGOING' ? 'text-green-600' : 
                 exam.status === 'COMPLETED' ? 'text-gray-600' : 'text-blue-600',
        }));
        setRecentActivities(mappedActivities);
      }
    } catch (error: any) {
      console.error('Error fetching examination dashboard data:', error);
      toast.error('Failed to load examination data');
      // Set empty arrays on error
      setUpcomingExams([]);
      setOngoingExams([]);
      setCompletedExams([]);
      setCalendarEvents([]);
      setRecentActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
  const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

  const hasEvent = (day: number) => {
    return calendarEvents.find(e => e.date === day);
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const today = new Date();
  const isToday = (day: number) => {
    return day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-[32px] text-gray-900 dark:text-white tracking-tight">
              Examination Management
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Dashboard &gt; Examinations
            </p>
          </div>
          <Button 
            onClick={onCreateExam}
            className="bg-[#2563EB] hover:bg-[#1d4ed8] text-white shadow-sm"
          >
            <Calendar className="w-5 h-5 mr-2" />
            Create New Exam
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
                Upcoming Exams
              </p>
              <h3 className="text-3xl text-gray-900 dark:text-white tracking-tight">
                {isLoading ? '...' : upcomingExams.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#2563EB]" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
                Ongoing Exams
              </p>
              <h3 className="text-3xl text-gray-900 dark:text-white tracking-tight">
                {isLoading ? '...' : ongoingExams.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
                Completed Exams
              </p>
              <h3 className="text-3xl text-gray-900 dark:text-white tracking-tight">
                {isLoading ? '...' : completedExams.length}
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium uppercase tracking-wide">
                Total Students
              </p>
              <h3 className="text-3xl text-gray-900 dark:text-white tracking-tight">
                1,234
              </h3>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Calendar */}
        <div className="lg:col-span-2">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl text-gray-900 dark:text-white tracking-tight">
                Exam Schedule
              </h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>

            {/* Calendar Navigation */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="ghost" size="sm" onClick={handlePreviousMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h4 className="text-lg text-gray-900 dark:text-white">
                {monthName} {currentYear}
              </h4>
              <Button variant="ghost" size="sm" onClick={handleNextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
              {/* Weekday Headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center py-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {day}
                  </span>
                </div>
              ))}

              {/* Empty cells for first week */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {/* Calendar days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const event = hasEvent(day);
                const isTodayDate = isToday(day);

                // Determine background color based on event type
                let bgColor = '';
                let borderColor = '';
                let dotColor = '';
                
                if (event) {
                  if (event.type === 'ongoing') {
                    // Ongoing exam - Green (especially if today)
                    if (isTodayDate) {
                      bgColor = 'bg-green-600';
                    } else {
                      bgColor = 'bg-green-50 dark:bg-green-900/20';
                      borderColor = 'border border-green-300 dark:border-green-700';
                    }
                    dotColor = 'bg-green-500';
                  } else if (event.type === 'completed') {
                    // Past exam - Red
                    if (isTodayDate) {
                      bgColor = 'bg-red-600';
                    } else {
                      bgColor = 'bg-red-50 dark:bg-red-900/20';
                      borderColor = 'border border-red-300 dark:border-red-700';
                    }
                    dotColor = 'bg-red-500';
                  } else if (event.type === 'upcoming') {
                    // Upcoming exam - Blue
                    if (isTodayDate) {
                      bgColor = 'bg-blue-600';
                    } else {
                      bgColor = 'bg-blue-50 dark:bg-blue-900/20';
                      borderColor = 'border border-blue-300 dark:border-blue-700';
                    }
                    dotColor = 'bg-blue-500';
                  }
                }

                return (
                  <div
                    key={day}
                    className={`
                      aspect-square rounded-lg flex flex-col items-center justify-center text-sm cursor-pointer
                      transition-all duration-200
                      ${isTodayDate && !event ? 'bg-[#2563EB] text-white' : ''}
                      ${isTodayDate && event ? `${bgColor} text-white` : ''}
                      ${!isTodayDate && event ? `${bgColor} ${borderColor}` : ''}
                      ${!isTodayDate && !event ? 'hover:bg-gray-100 dark:hover:bg-gray-800' : ''}
                    `}
                  >
                    <span className={isTodayDate || (event && event.type === 'ongoing' && isTodayDate) ? 'text-white font-semibold' : 'text-gray-900 dark:text-white'}>
                      {day}
                    </span>
                    {event && (
                      <div className={`w-2 h-2 rounded-full mt-1 ${dotColor}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex items-center gap-4 mt-6 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-gray-600 dark:text-gray-400">Upcoming</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-gray-600 dark:text-gray-400">Ongoing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-gray-600 dark:text-gray-400">Completed</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - Upcoming Exams List (Next 3 Days) */}
        <div>
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl">
            <h3 className="text-xl text-gray-900 dark:text-white mb-4 tracking-tight">
              Upcoming Exams (Next 3 Days)
            </h3>

            <div className="space-y-3">
              {isLoading ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : (() => {
                // Filter exams for next 3 days
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                today.setHours(0, 0, 0, 0);
                
                const threeDaysLater = new Date(today);
                threeDaysLater.setDate(threeDaysLater.getDate() + 3);
                threeDaysLater.setHours(23, 59, 59, 999);

                if (import.meta.env.DEV) {
                  console.log('Filtering upcoming exams for next 3 days:', {
                    today: today.toISOString(),
                    threeDaysLater: threeDaysLater.toISOString(),
                    upcomingExamsCount: upcomingExams.length,
                    upcomingExams: upcomingExams.map(e => ({
                      name: e.name,
                      startDate: e.startDate,
                      endDate: e.endDate,
                    })),
                  });
                }

                const next3DaysExams = upcomingExams.filter((exam) => {
                  // Check exam startDate first
                  if (exam.startDate) {
                    const examStartDate = new Date(exam.startDate);
                    // Normalize to local date using UTC methods (to handle timezone correctly)
                    const examYear = examStartDate.getUTCFullYear();
                    const examMonth = examStartDate.getUTCMonth();
                    const examDay = examStartDate.getUTCDate();
                    const examStartDateNormalized = new Date(examYear, examMonth, examDay);
                    examStartDateNormalized.setHours(0, 0, 0, 0);
                    
                    // Check if exam start date is within next 3 days (inclusive of today)
                    const isWithinRange = examStartDateNormalized >= today && examStartDateNormalized <= threeDaysLater;
                    
                    if (import.meta.env.DEV) {
                      console.log('Filtering exam for next 3 days:', {
                        examName: exam.name,
                        examStartDate: exam.startDate,
                        examStartDateNormalized: examStartDateNormalized.toISOString(),
                        examDate: `${examYear}-${examMonth + 1}-${examDay}`,
                        today: today.toISOString(),
                        todayDate: `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`,
                        threeDaysLater: threeDaysLater.toISOString(),
                        isWithinRange,
                      });
                    }
                    
                    return isWithinRange;
                  }
                  
                  return false;
                }).sort((a, b) => {
                  const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
                  const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
                  return dateA - dateB;
                });

                if (import.meta.env.DEV) {
                  console.log('Next 3 days exams:', {
                    count: next3DaysExams.length,
                    exams: next3DaysExams.map(e => ({
                      name: e.name,
                      startDate: e.startDate,
                    })),
                  });
                }

                if (next3DaysExams.length === 0) {
                  return <div className="text-center py-8 text-gray-500">No upcoming exams in next 3 days</div>;
                }

                return next3DaysExams.slice(0, 5).map((exam, index) => (
                  <div
                    key={exam.id}
                    className={`p-4 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                      index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-900'
                    }`}
                    onClick={() => onViewExam(exam)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Book className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm text-gray-900 dark:text-white mb-1 font-medium">
                          {exam.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {exam.classes.length > 0 ? exam.classes.join(', ') : 'All Classes'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>
                            {exam.startDate 
                              ? new Date(exam.startDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Date TBD'}
                          </span>
                        </div>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs whitespace-nowrap">
                        {exam.status}
                      </Badge>
                    </div>
                  </div>
                ));
              })()}
            </div>

            <Button 
              variant="ghost" 
              className="w-full mt-4 text-[#2563EB] hover:text-[#1d4ed8] hover:bg-blue-50"
              onClick={onViewList}
            >
              View All
            </Button>
          </Card>
        </div>
      </div>

      {/* Recent Activities */}
      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-200 dark:border-gray-800 rounded-xl">
        <h3 className="text-xl text-gray-900 dark:text-white mb-6 tracking-tight">
          Recent Activities
        </h3>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading activities...</div>
          ) : recentActivities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No recent activities</div>
          ) : (
            recentActivities.map((activity, index) => (
            <div key={activity.id} className="flex items-start gap-4 relative">
              {/* Timeline connector */}
              {index < recentActivities.length - 1 && (
                <div className="absolute left-5 top-10 w-0.5 h-full bg-gray-200 dark:bg-gray-800" />
              )}
              
              <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                activity.color.includes('blue') ? 'bg-blue-100 dark:bg-blue-900/20' :
                activity.color.includes('green') ? 'bg-green-100 dark:bg-green-900/20' :
                activity.color.includes('amber') ? 'bg-amber-100 dark:bg-amber-900/20' :
                'bg-purple-100 dark:bg-purple-900/20'
              }`}>
                <activity.icon className={`w-5 h-5 ${activity.color}`} />
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white mb-1">
                  {activity.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {activity.time}
                </p>
              </div>
            </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
