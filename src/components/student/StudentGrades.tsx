import { useState } from 'react';
import { Award, TrendingUp, TrendingDown, Download, Eye, BookOpen, RefreshCw, Loader2 } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Progress } from '../ui/progress';
import { Skeleton } from '../ui/skeleton';
import { 
  useGrades, 
  usePerformanceOverview, 
  useSubjectPerformance, 
  useGradeDistribution,
  useExamReports,
  useDownloadReportCard 
} from '../../hooks/useStudentData';

// Skeleton loader
function GradesSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
        </div>
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

export function StudentGrades() {
  const [selectedTerm, setSelectedTerm] = useState('current');

  // API Hooks - Based on student-panel-apis.json
  // PROFILE_05: /student/grades
  const { data: grades, loading: gradesLoading, error: gradesError, refetch: refetchGrades } = useGrades();
  
  // EXAM_05: /student/exams/performance/overview
  const { data: performanceOverview, loading: performanceLoading } = usePerformanceOverview();
  
  // EXAM_06: /student/exams/performance/subjects
  const { data: subjectPerformance, loading: subjectLoading } = useSubjectPerformance();
  
  // EXAM_07: /student/exams/performance/distribution
  const { data: gradeDistribution, loading: distributionLoading } = useGradeDistribution();
  
  // EXAM_08: /student/exams/reports
  const { data: examReports, loading: reportsLoading } = useExamReports();
  
  // EXAM_09: Download Report Card
  const { download: downloadReportCard, loading: downloadLoading } = useDownloadReportCard();

  const loading = gradesLoading || performanceLoading || subjectLoading;

  // Calculate stats
  const overallStats = {
    gpa: performanceOverview?.currentGPA?.toFixed(2) || grades?.gpa?.toFixed(2) || '0.00',
    avgPercentage: subjectPerformance ? 
      Math.round(subjectPerformance.reduce((sum, g) => sum + g.total, 0) / subjectPerformance.length) : 0,
    aGrades: subjectPerformance?.filter(g => g.grade.startsWith('A')).length || 0,
    improving: subjectPerformance?.filter(g => g.trend === 'UP').length || 0,
    rank: performanceOverview?.rank,
    totalStudents: performanceOverview?.totalStudents,
  };

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/20 dark:text-yellow-400';
    if (grade.startsWith('D')) return 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/20 dark:text-orange-400';
    return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/20 dark:text-red-400';
  };

  const handleDownloadReport = async (examId: string) => {
    await downloadReportCard(examId);
  };

  if (loading) {
    return <GradesSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2">My Grades</h1>
          <p className="text-gray-600 dark:text-gray-400">
            View your academic performance and progress
          </p>
          {gradesError && (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Unable to load grades data. Please try again.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchGrades()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Select value={selectedTerm} onValueChange={setSelectedTerm}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current Term</SelectItem>
              {examReports?.map((report) => (
                <SelectItem key={report.examId} value={report.examId}>
                  {report.examName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download Report
          </Button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Current GPA</p>
              <p className="text-3xl text-blue-900 dark:text-blue-100">{overallStats.gpa}</p>
              {overallStats.rank && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Rank: {overallStats.rank}/{overallStats.totalStudents}
                </p>
              )}
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-600 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 dark:text-green-300 mb-1">Average</p>
              <p className="text-3xl text-green-900 dark:text-green-100">{overallStats.avgPercentage}%</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 dark:text-purple-300 mb-1">A Grades</p>
              <p className="text-3xl text-purple-900 dark:text-purple-100">{overallStats.aGrades}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-1">Improving</p>
              <p className="text-3xl text-orange-900 dark:text-orange-100">{overallStats.improving}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
        </Card>
      </div>

      {/* Subject-wise Grades */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl text-gray-900 dark:text-white">Subject-wise Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Subject</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Assignments</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Quizzes</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Midterm</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Total</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Grade</th>
                <th className="px-6 py-4 text-center text-xs text-gray-600 dark:text-gray-400 uppercase">Trend</th>
                <th className="px-6 py-4 text-right text-xs text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {subjectPerformance && subjectPerformance.length > 0 ? (
                subjectPerformance.map((grade) => (
                  <tr key={grade.subject.id} className="hover:bg-gray-50 dark:hover:bg-gray-900/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-900 dark:text-white">{grade.subject.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{grade.subject.teacher}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-white">{grade.assignments}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-white">{grade.quizzes}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-white">{grade.midterm}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-white">{grade.total}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className={getGradeColor(grade.grade)}>
                        {grade.grade}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {grade.trend === 'UP' && <TrendingUp className="w-5 h-5 text-green-600 mx-auto" />}
                      {grade.trend === 'DOWN' && <TrendingDown className="w-5 h-5 text-red-600 mx-auto" />}
                      {grade.trend === 'STABLE' && <div className="w-5 h-0.5 bg-gray-400 mx-auto" />}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button size="sm" variant="outline">
                        <Eye className="w-4 h-4 mr-2" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No grades data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Grade Distribution & Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grade Distribution */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <h3 className="text-lg text-gray-900 dark:text-white mb-4">Grade Distribution</h3>
          <div className="space-y-4">
            {gradeDistribution && gradeDistribution.length > 0 ? (
              gradeDistribution.map((item) => (
                <div key={item.grade} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`${getGradeColor(item.grade)} px-3 py-1`}>
                      Grade {item.grade}
                    </Badge>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {item.count} subjects ({item.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={item.percentage} className="h-2" />
                </div>
              ))
            ) : (
              ['A', 'B', 'C', 'D', 'F'].map((letter) => {
                const count = subjectPerformance?.filter(g => g.grade.startsWith(letter)).length || 0;
                const percentage = subjectPerformance ? (count / subjectPerformance.length) * 100 : 0;
                return (
                  <div key={letter} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${getGradeColor(letter)} px-3 py-1`}>
                        Grade {letter}
                      </Badge>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {count} subjects ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Previous Term Reports */}
        <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-gray-900 dark:text-white">Exam Reports</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {examReports && examReports.length > 0 ? (
              examReports.map((report) => (
                <Card key={report.examId} className="p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-sm text-gray-900 dark:text-white mb-1">{report.examName}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {report.student.class}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/20 dark:text-blue-400">
                      {report.grade}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total</p>
                      <p className="text-lg text-gray-900 dark:text-white">{report.obtainedTotal}/{report.totalMarks}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Percentage</p>
                      <p className="text-lg text-gray-900 dark:text-white">{report.percentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Rank</p>
                      <p className="text-lg text-gray-900 dark:text-white">{report.rank || '-'}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => handleDownloadReport(report.examId)}
                    disabled={downloadLoading}
                  >
                    {downloadLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Download Report Card
                  </Button>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No exam reports available
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
