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
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="students" stroke="#0A66C2" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Revenue Trend (PKR)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="month" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg text-gray-900 dark:text-white mb-4">Attendance by Grade</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis dataKey="name" className="text-sm" />
                  <YAxis className="text-sm" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="attendance" fill="#0A66C2" />
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
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Average Performance by Subject</h3>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                <XAxis dataKey="subject" className="text-sm" />
                <YAxis className="text-sm" />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" fill="#7C3AED" />
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
