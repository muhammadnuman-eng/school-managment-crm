import { FileText, Calendar, Clock, Award, TrendingUp, Download, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { useExamSchedule, useExamMarks, useDownloadExamSchedule, useDownloadReportCard } from '../../hooks/useStudentData';

// Skeleton loader
function ExamsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

export function StudentExams() {
  // API Hooks - Based on student-panel-apis.json
  // EXAM_01: /student/exams/schedule
  const { data: examSchedule, loading: scheduleLoading, error: scheduleError, refetch: refetchSchedule } = useExamSchedule();
  
  // EXAM_03: /student/exams/marks
  const { data: examMarks, loading: marksLoading } = useExamMarks();
  
  // EXAM_02: /student/exams/schedule/download
  const { download: downloadSchedule, loading: downloadingSchedule } = useDownloadExamSchedule();
  
  // EXAM_09: /student/exams/:examId/report/download
  const { download: downloadReportCard, loading: downloadingReport } = useDownloadReportCard();

  const loading = scheduleLoading || marksLoading;

  // Filter exams
  const upcomingExams = examSchedule?.filter(exam => new Date(exam.date) >= new Date()) || [];
  const completedExams = examMarks || [];

  const stats = {
    upcoming: upcomingExams.length,
    completed: completedExams.length,
    avgScore: completedExams.length > 0 
      ? Math.round(completedExams.reduce((sum, e) => sum + e.percentage, 0) / completedExams.length)
      : 0,
    bestRank: completedExams.length > 0 && completedExams.some(e => e.rank)
      ? Math.min(...completedExams.filter(e => e.rank).map(e => e.rank!))
      : 0
  };

  const getTypeColor = (type: string) => {
    const types: Record<string, string> = {
      'midterm': 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400',
      'final': 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400',
      'quiz': 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400',
      'test': 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400',
    };
    return types[type?.toLowerCase()] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/20 dark:text-gray-400';
  };

  if (loading) {
    return <ExamsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Exams & Results</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your exam schedule and results
          </p>
          {scheduleError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Unable to load exam data. Please try again.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchSchedule()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => downloadSchedule()} disabled={downloadingSchedule}>
            {downloadingSchedule ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download Schedule
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Upcoming Exams</p>
              <p className="text-3xl text-blue-900 dark:text-blue-100">{stats.upcoming}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">Completed</p>
              <p className="text-3xl text-green-900 dark:text-green-100">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">Average Score</p>
              <p className="text-3xl text-purple-900 dark:text-purple-100">{stats.avgScore}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">Best Rank</p>
              <p className="text-3xl text-orange-900 dark:text-orange-100">
                {stats.bestRank ? `#${stats.bestRank}` : '-'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Exams Tabs */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <Tabs defaultValue="upcoming" className="w-full">
          <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-6">
            <TabsList className="w-full justify-start bg-transparent border-b-0 h-auto p-0 space-x-8">
              <TabsTrigger 
                value="upcoming"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
              >
                Upcoming ({upcomingExams.length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
              >
                Results ({completedExams.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-6">
            <TabsContent value="upcoming" className="mt-0">
              <div className="space-y-4">
                {upcomingExams.map((exam) => {
                  const daysUntil = Math.ceil((new Date(exam.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <Card key={exam.id} className="p-6 border-2 border-gray-200 dark:border-gray-700">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg text-gray-900 dark:text-white mb-1">{exam.examName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{exam.subject.name}</p>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <Badge variant="outline" className={getTypeColor(exam.examName.includes('Mid') ? 'midterm' : 'test')}>
                                {exam.examName.includes('Mid') ? 'MIDTERM' : 'TEST'}
                              </Badge>
                              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                {new Date(exam.date).toLocaleDateString()}
                                {daysUntil >= 0 && <span className={daysUntil <= 7 ? 'text-red-600 dark:text-red-400' : ''}>
                                  ({daysUntil} days)
                                </span>}
                              </span>
                              <span className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <Clock className="w-4 h-4" />
                                {exam.startTime} - {exam.endTime}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {exam.room}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl text-gray-900 dark:text-white">{exam.totalMarks}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">marks</p>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {upcomingExams.length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No upcoming exams</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="completed" className="mt-0">
              <div className="space-y-4">
                {completedExams.map((exam) => (
                  <Card key={exam.id} className="p-6 border-2 border-green-200 dark:border-green-800">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                          <Award className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg text-gray-900 dark:text-white mb-1">{exam.exam.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{exam.subject.name}</p>
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <Badge variant="outline" className={getTypeColor('test')}>
                              COMPLETED
                            </Badge>
                            {exam.rank && (
                              <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/20 dark:text-purple-400">
                                Rank: {exam.rank}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl text-gray-900 dark:text-white mb-1">
                          {exam.obtainedMarks}/{exam.totalMarks}
                        </p>
                        <Badge variant="outline" className={getGradeColor(exam.grade)}>
                          Grade {exam.grade}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Performance</span>
                        <span className="text-gray-900 dark:text-white">{exam.percentage.toFixed(1)}%</span>
                      </div>
                      <Progress value={exam.percentage} className="h-2" />
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => downloadReportCard(exam.exam.id)}
                        disabled={downloadingReport}
                      >
                        {downloadingReport ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-2" />
                        )}
                        Download Result Sheet
                      </Button>
                    </div>
                  </Card>
                ))}
                {completedExams.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No results available yet</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}
