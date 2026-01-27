import { Card } from '../ui/card';
import { BarChart3, TrendingUp, Users, GraduationCap, DollarSign, CalendarCheck } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const monthlyData = [
  { month: 'Jan', students: 450, teachers: 45, revenue: 420000 },
  { month: 'Feb', students: 465, teachers: 47, revenue: 435000 },
  { month: 'Mar', students: 478, teachers: 48, revenue: 448000 },
  { month: 'Apr', students: 492, teachers: 50, revenue: 462000 },
  { month: 'May', students: 505, teachers: 52, revenue: 475000 },
  { month: 'Jun', students: 518, teachers: 53, revenue: 488000 },
];

const attendanceData = [
  { name: 'Grade 1', attendance: 95 },
  { name: 'Grade 2', attendance: 92 },
  { name: 'Grade 3', attendance: 94 },
  { name: 'Grade 4', attendance: 89 },
  { name: 'Grade 5', attendance: 91 },
  { name: 'Grade 6', attendance: 93 },
  { name: 'Grade 7', attendance: 88 },
  { name: 'Grade 8', attendance: 90 },
];

const feeCollectionData = [
  { name: 'Collected', value: 4200000, color: '#10B981' },
  { name: 'Pending', value: 850000, color: '#F59E0B' },
  { name: 'Overdue', value: 120000, color: '#EF4444' },
];

const performanceData = [
  { subject: 'Math', avgScore: 85 },
  { subject: 'Science', avgScore: 88 },
  { subject: 'English', avgScore: 82 },
  { subject: 'History', avgScore: 79 },
  { subject: 'Geography', avgScore: 81 },
];

export function Analytics() {
  const [loading, setLoading] = useState(true);
  const [studentAnalytics, setStudentAnalytics] = useState<any>(null);
  const [teacherAnalytics, setTeacherAnalytics] = useState<any>(null);
  const [revenueTrend, setRevenueTrend] = useState<any>({ data: [], comparison: {} });
  const [attendanceTrend, setAttendanceTrend] = useState<any>({ data: [], comparison: {} });
  const [studentGrowthTrend, setStudentGrowthTrend] = useState<any>({ data: [], period: '' });
  const [classAttendance, setClassAttendance] = useState<any>({ data: [], summary: {} });
  const [financialStatements, setFinancialStatements] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>(null);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const schoolId = schoolStorage.getSchoolId();

      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      const [
        studentAnalyticsResponse,
        teacherAnalyticsResponse,
        revenueTrendResponse,
        attendanceTrendResponse,
        studentGrowthTrendResponse,
        classAttendanceResponse,
        financialStatementsResponse,
        dashboardStatsResponse,
      ] = await Promise.all([
        adminService.getStudentAnalytics(),
        adminService.getTeacherAnalytics(),
        adminService.getRevenueTrend(6),
        adminService.getAttendanceTrend(6),
        adminService.getStudentGrowthTrend(6),
        adminService.getClassAttendanceAnalytics('bar'),
        adminService.getFinancialStatements(),
        adminService.getDashboardStats(),
      ]);

      setStudentAnalytics(studentAnalyticsResponse);
      setTeacherAnalytics(teacherAnalyticsResponse);
      setRevenueTrend(revenueTrendResponse);
      setAttendanceTrend(attendanceTrendResponse);
      setStudentGrowthTrend(studentGrowthTrendResponse);
      setClassAttendance(classAttendanceResponse);
      setFinancialStatements(financialStatementsResponse);
      setDashboardStats(dashboardStatsResponse);
    } catch (error: any) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  };

  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `PKR ${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `PKR ${(amount / 1000).toFixed(2)}K`;
    }
    return `PKR ${amount.toFixed(2)}`;
  };

  // Default months for axis labels
  const defaultMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  
  // Prepare monthly data for charts (combining student growth and revenue)
  // If no data, use default months with zero values to show axis
  const monthlyData = (() => {
    if (studentGrowthTrend.data && studentGrowthTrend.data.length > 0) {
      return studentGrowthTrend.data.map((item: any, index: number) => {
        const revenueItem = revenueTrend.data?.[index];
        return {
          month: item.label || item.month || defaultMonths[index] || `Month ${index + 1}`,
          students: item.students || 0,
          revenue: revenueItem?.revenue || 0,
        };
      });
    }
    // Return default data with months and zero values to show axis
    return defaultMonths.map(month => ({
      month,
      students: 0,
      revenue: 0,
    }));
  })();

  // Prepare attendance data by class/grade
  // If no data, return empty array (will show axis with default handling)
  const attendanceData = classAttendance.data?.map((item: any) => ({
    name: item.className || `Grade ${item.gradeLevel || 'N/A'}`,
    attendance: item.percentage || 0,
  })) || [];
  
  // Prepare attendance trend data with default months if empty
  const attendanceTrendData = (() => {
    if (attendanceTrend.data && attendanceTrend.data.length > 0) {
      return attendanceTrend.data;
    }
    // Return default data with months and zero values to show axis
    return defaultMonths.map(month => ({
      label: month,
      average: 0,
    }));
  })();

  // Prepare fee collection data
  const feeCollectionData = financialStatements ? [
    {
      name: 'Collected',
      value: financialStatements.collected?.amount || 0,
      color: '#10B981',
    },
    {
      name: 'Pending',
      value: financialStatements.pending?.amount || 0,
      color: '#F59E0B',
    },
    {
      name: 'Overdue',
      value: financialStatements.overdue?.amount || 0,
      color: '#EF4444',
    },
  ] : [];

  const totalFeeAmount = financialStatements?.total?.amount || 0;

  // Get stats from dashboard or analytics
  const totalStudents = dashboardStats?.students?.total || studentAnalytics?.currentMonth?.total || 0;
  const studentChange = dashboardStats?.students?.change || studentAnalytics?.comparison?.change || 0;
  const studentChangePercentage = dashboardStats?.students?.changePercentage || studentAnalytics?.comparison?.changePercentage || 0;
  const isStudentIncrease = studentChange > 0;

  const totalTeachers = dashboardStats?.teachers?.total || teacherAnalytics?.currentMonth?.total || 0;
  const teacherChange = dashboardStats?.teachers?.change || teacherAnalytics?.comparison?.change || 0;
  const teacherChangePercentage = dashboardStats?.teachers?.changePercentage || teacherAnalytics?.comparison?.changePercentage || 0;
  const isTeacherIncrease = teacherChange > 0;

  const monthlyRevenue = revenueTrend.comparison?.currentMonth || 0;
  const revenueChange = revenueTrend.comparison?.change || 0;
  const revenueChangePercentage = revenueTrend.comparison?.changePercentage || 0;
  const isRevenueIncrease = revenueChange > 0;

  const avgAttendance = dashboardStats?.attendance?.average || attendanceTrend.comparison?.currentMonth || classAttendance.summary?.overallAverage || 0;
  const attendanceChange = dashboardStats?.attendance?.change || attendanceTrend.comparison?.change || 0;
  const attendanceChangePercentage = dashboardStats?.attendance?.changePercentage || attendanceTrend.comparison?.changePercentage || 0;
  const isAttendanceIncrease = attendanceChange > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Analytics & Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Comprehensive insights and performance metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Students</p>
              <p className="text-3xl text-gray-900 dark:text-white mb-1">518</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +5.2% from last month
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#0A66C2]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Teachers</p>
              <p className="text-3xl text-gray-900 dark:text-white mb-1">53</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +3.8% from last month
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-[#7C3AED]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Revenue</p>
              <p className="text-3xl text-gray-900 dark:text-white mb-1">PKR 4.88M</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +12.3% from last month
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#10B981]" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Attendance</p>
              <p className="text-3xl text-gray-900 dark:text-white mb-1">91.5%</p>
              <p className="text-sm text-green-600 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +2.1% from last month
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
              <CalendarCheck className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Student Growth Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    className="text-sm"
                    stroke="#9CA3AF"
                    tick={{ fill: '#6B7280' }}
                    ticks={defaultMonths}
                  />
                  <YAxis 
                    className="text-sm"
                    stroke="#9CA3AF"
                    tick={{ fill: '#6B7280' }}
                    domain={[0, 'auto']}
                    tickFormatter={(value) => value.toString()}
                    label={{ value: 'Students', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                  />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#0A66C2" strokeWidth={2} name="Students" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Revenue Trend (PKR)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" opacity={0.5} />
                  <XAxis 
                    dataKey="month" 
                    className="text-sm"
                    stroke="#9CA3AF"
                    tick={{ fill: '#6B7280' }}
                    ticks={defaultMonths}
                  />
                  <YAxis 
                    className="text-sm"
                    stroke="#9CA3AF"
                    tick={{ fill: '#6B7280' }}
                    domain={[0, 'auto']}
                    tickFormatter={(value) => {
                      if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
                      return value.toString();
                    }}
                    label={{ value: 'Amount (PKR)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                  />
                  <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} name="Revenue" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Attendance by Class</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={attendanceData.length > 0 ? attendanceData : [{ name: 'No Data', attendance: 0 }]}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" opacity={0.5} />
                  <XAxis 
                    dataKey="name" 
                    className="text-sm"
                    stroke="#9CA3AF"
                    tick={{ fill: '#6B7280' }}
                  />
                  <YAxis 
                    className="text-sm"
                    stroke="#9CA3AF"
                    tick={{ fill: '#6B7280' }}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    ticks={[0, 20, 40, 60, 80, 100]}
                    label={{ value: 'Attendance %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                  />
                  <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="attendance" fill="#0A66C2" name="Attendance %" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Attendance Summary</h3>
              <div className="space-y-4 mt-6">
                {attendanceData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#0A66C2]" 
                          style={{ width: `${item.attendance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white w-12 text-right">{item.attendance}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="p-6">
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Attendance Trend (Last 6 Months)</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={attendanceTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" opacity={0.5} />
                <XAxis 
                  dataKey="label" 
                  className="text-sm"
                  stroke="#9CA3AF"
                  tick={{ fill: '#6B7280' }}
                  ticks={defaultMonths}
                />
                <YAxis 
                  className="text-sm"
                  stroke="#9CA3AF"
                  tick={{ fill: '#6B7280' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  ticks={[0, 20, 40, 60, 80, 100]}
                  label={{ value: 'Attendance %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280' } }}
                />
                <Tooltip formatter={(value: any) => `${value.toFixed(1)}%`} />
                <Legend />
                <Bar dataKey="average" fill="#7C3AED" name="Average Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Fee Collection Status</h3>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={feeCollectionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: PKR ${(entry.value / 100000).toFixed(1)}L`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {feeCollectionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Collection Summary</h3>
              <div className="space-y-6 mt-8">
                {feeCollectionData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xl text-gray-900 dark:text-white">PKR {(item.value / 100000).toFixed(1)}L</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {((item.value / 5170000) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900 dark:text-white">Total</span>
                    <span className="text-xl text-gray-900 dark:text-white">PKR 5.17M</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
