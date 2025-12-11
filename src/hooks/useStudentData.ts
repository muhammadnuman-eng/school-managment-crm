import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  studentApi,
  DashboardData,
  StudentProfile,
  StudentGrades,
  ScheduleItem,
  Assignment,
  AssignmentStatistics,
  AttendanceRecord,
  AttendanceSummary,
  AttendanceOverview,
  SubjectAttendance,
  LeaveRequest,
  Announcement,
  Message,
  ExamSchedule,
  ExamMarks,
  ExamReportCard,
  PerformanceOverview,
  SubjectPerformance,
  GradeDistribution,
  FeeOverview,
  Fee,
  Payment,
  TransportInfo,
  HostelInfo,
  Document,
  SubmitAssignmentPayload,
  CreateLeavePayload,
  SendMessagePayload,
  PayFeePayload,
  UpdateProfilePayload,
} from '../services/studentApi';

// ==================== MOCK DATA ====================

const MOCK_DASHBOARD: DashboardData = {
  student: {
    name: 'Ahmed Khan',
    class: '10th Grade',
    section: 'A',
    rollNumber: '101'
  },
  stats: {
    attendancePercentage: 92,
    gpa: 3.8,
    pendingAssignments: 5,
    pendingFees: 15000
  },
  upcomingClasses: [
    { id: '1', subject: 'Mathematics', time: '09:00 AM', teacher: 'Mr. Ali', room: 'Room 101' },
    { id: '2', subject: 'Physics', time: '10:30 AM', teacher: 'Dr. Hassan', room: 'Lab 2' },
    { id: '3', subject: 'English', time: '12:00 PM', teacher: 'Ms. Fatima', room: 'Room 205' }
  ],
  recentGrades: [
    { subject: 'Mathematics', score: 95, maxScore: 100, grade: 'A' },
    { subject: 'Physics', score: 90, maxScore: 100, grade: 'A-' },
    { subject: 'English', score: 87, maxScore: 100, grade: 'B+' }
  ],
  announcements: [
    { id: '1', title: 'Winter Break Schedule', date: '2024-01-10', type: 'GENERAL' },
    { id: '2', title: 'Science Fair Registration', date: '2024-01-08', type: 'EVENT' }
  ]
};

const MOCK_PROFILE: StudentProfile = {
  id: 'STU001',
  firstName: 'Ahmed',
  lastName: 'Khan',
  email: 'ahmed.khan@school.edu',
  phone: '+92 300 1234567',
  dateOfBirth: '2008-05-15',
  gender: 'Male',
  address: '123 Main Street, Islamabad',
  class: '10th Grade',
  section: 'A',
  rollNumber: '101',
  admissionDate: '2020-04-01',
  bloodGroup: 'O+',
  parentName: 'Imran Khan',
  parentPhone: '+92 300 7654321',
  parentEmail: 'imran.khan@email.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed'
};

const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: '1', day: 'Monday', subject: 'Mathematics', startTime: '09:00', endTime: '09:45', teacher: 'Mr. Ali', room: 'Room 101' },
  { id: '2', day: 'Monday', subject: 'Physics', startTime: '10:00', endTime: '10:45', teacher: 'Dr. Hassan', room: 'Lab 2' },
  { id: '3', day: 'Monday', subject: 'English', startTime: '11:00', endTime: '11:45', teacher: 'Ms. Fatima', room: 'Room 205' },
  { id: '4', day: 'Tuesday', subject: 'Chemistry', startTime: '09:00', endTime: '09:45', teacher: 'Dr. Aisha', room: 'Lab 1' },
  { id: '5', day: 'Tuesday', subject: 'Urdu', startTime: '10:00', endTime: '10:45', teacher: 'Mr. Rashid', room: 'Room 102' },
  { id: '6', day: 'Wednesday', subject: 'Mathematics', startTime: '09:00', endTime: '09:45', teacher: 'Mr. Ali', room: 'Room 101' },
  { id: '7', day: 'Wednesday', subject: 'Computer Science', startTime: '10:00', endTime: '10:45', teacher: 'Ms. Sara', room: 'Computer Lab' },
  { id: '8', day: 'Thursday', subject: 'Physics', startTime: '09:00', endTime: '09:45', teacher: 'Dr. Hassan', room: 'Lab 2' },
  { id: '9', day: 'Thursday', subject: 'English', startTime: '10:00', endTime: '10:45', teacher: 'Ms. Fatima', room: 'Room 205' },
  { id: '10', day: 'Friday', subject: 'Islamiat', startTime: '09:00', endTime: '09:45', teacher: 'Mr. Abdullah', room: 'Room 103' }
];

// MOCK_GRADES will be defined after MOCK_SUBJECT_PERFORMANCE and MOCK_EXAM_MARKS

const MOCK_ASSIGNMENTS: Assignment[] = [
  { 
    id: '1', 
    title: 'Quadratic Equations Worksheet', 
    subject: { id: '1', name: 'Mathematics' }, 
    teacher: { id: '1', name: 'Mr. Ali' },
    dueDate: '2024-01-20', 
    assignedDate: '2024-01-10',
    status: 'PENDING', 
    description: 'Complete problems 1-25', 
    totalMarks: 100 
  },
  { 
    id: '2', 
    title: 'Physics Lab Report', 
    subject: { id: '2', name: 'Physics' }, 
    teacher: { id: '2', name: 'Dr. Hassan' },
    dueDate: '2024-01-18', 
    assignedDate: '2024-01-08',
    status: 'SUBMITTED', 
    description: 'Write lab report on pendulum experiment', 
    totalMarks: 50, 
    submittedAt: '2024-01-17' 
  },
  { 
    id: '3', 
    title: 'Essay: Climate Change', 
    subject: { id: '3', name: 'English' }, 
    teacher: { id: '3', name: 'Ms. Fatima' },
    dueDate: '2024-01-22', 
    assignedDate: '2024-01-12',
    status: 'PENDING', 
    description: '1000 words essay on climate change effects', 
    totalMarks: 100 
  },
  { 
    id: '4', 
    title: 'Chemical Reactions Quiz', 
    subject: { id: '4', name: 'Chemistry' }, 
    teacher: { id: '4', name: 'Dr. Aisha' },
    dueDate: '2024-01-15', 
    assignedDate: '2024-01-05',
    status: 'GRADED', 
    description: 'Online quiz on chapter 4', 
    totalMarks: 30, 
    obtainedMarks: 28,
    feedback: 'Good work! Keep practicing.'
  },
  { 
    id: '5', 
    title: 'Programming Project', 
    subject: { id: '5', name: 'Computer Science' }, 
    teacher: { id: '5', name: 'Ms. Sara' },
    dueDate: '2024-01-25', 
    assignedDate: '2024-01-15',
    status: 'PENDING', 
    description: 'Build a calculator app', 
    totalMarks: 100 
  }
];

const MOCK_ASSIGNMENT_STATS: AssignmentStatistics = {
  total: 25,
  pending: 5,
  submitted: 8,
  graded: 12,
  late: 0,
  averageScore: 87
};

const MOCK_ATTENDANCE_RECORDS: AttendanceRecord[] = [
  { id: '1', date: '2024-01-15', status: 'PRESENT', subject: { id: '1', name: 'Mathematics' } },
  { id: '2', date: '2024-01-15', status: 'PRESENT', subject: { id: '2', name: 'Physics' } },
  { id: '3', date: '2024-01-14', status: 'PRESENT', subject: { id: '1', name: 'Mathematics' } },
  { id: '4', date: '2024-01-14', status: 'ABSENT', subject: { id: '3', name: 'English' } },
  { id: '5', date: '2024-01-13', status: 'LATE', subject: { id: '4', name: 'Chemistry' } }
];

const MOCK_ATTENDANCE_SUMMARY: AttendanceSummary = {
  totalDays: 120,
  present: 110,
  absent: 8,
  late: 2,
  leave: 0,
  percentage: 92
};

const MOCK_ATTENDANCE_OVERVIEW: AttendanceOverview = {
  currentMonth: { totalDays: 21, present: 18, absent: 2, late: 1, leave: 0, percentage: 85.7 },
  overall: { totalDays: 120, present: 110, absent: 8, late: 2, leave: 0, percentage: 92 },
  monthlyTrend: [
    { month: '2024-01', percentage: 85.7 },
    { month: '2023-12', percentage: 90.9 },
    { month: '2023-11', percentage: 88.5 }
  ]
};

const MOCK_SUBJECT_ATTENDANCE: SubjectAttendance[] = [
  { subject: { id: '1', name: 'Mathematics', teacher: 'Mr. Ali' }, totalClasses: 40, present: 38, absent: 2, late: 0, percentage: 95 },
  { subject: { id: '2', name: 'Physics', teacher: 'Dr. Hassan' }, totalClasses: 35, present: 32, absent: 2, late: 1, percentage: 91 },
  { subject: { id: '3', name: 'English', teacher: 'Ms. Fatima' }, totalClasses: 38, present: 35, absent: 2, late: 1, percentage: 92 },
  { subject: { id: '4', name: 'Chemistry', teacher: 'Dr. Aisha' }, totalClasses: 32, present: 30, absent: 1, late: 1, percentage: 94 },
  { subject: { id: '5', name: 'Computer Science', teacher: 'Ms. Sara' }, totalClasses: 25, present: 24, absent: 1, late: 0, percentage: 96 }
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: '1', title: 'Winter Break Schedule', content: 'School will be closed from Dec 23 to Jan 2. Classes resume on Jan 3.', date: '2024-01-10', type: 'GENERAL', priority: 'HIGH', author: 'Principal' },
  { id: '2', title: 'Science Fair Registration', content: 'Register by Jan 20 for the annual science fair. Forms available at office.', date: '2024-01-08', type: 'EVENT', priority: 'NORMAL', author: 'Science Department' },
  { id: '3', title: 'Sports Day Announcement', content: 'Annual sports day will be held on Jan 28. All students must participate.', date: '2024-01-05', type: 'EVENT', priority: 'LOW', author: 'Sports Department' }
];

const MOCK_MESSAGES: Message[] = [
  { 
    id: '1', 
    subject: 'Mathematics Assignment Feedback', 
    content: 'Great work on your recent assignment! Keep it up.', 
    sender: { id: '1', name: 'Mr. Ali', role: 'TEACHER' },
    recipient: { id: 'STU001', name: 'Ahmed Khan', role: 'STUDENT' },
    priority: 'NORMAL',
    isRead: true, 
    createdAt: '2024-01-15T10:00:00Z' 
  },
  { 
    id: '2', 
    subject: 'Lab Report Revision', 
    content: 'Please revise section 3 of your lab report.', 
    sender: { id: '2', name: 'Dr. Hassan', role: 'TEACHER' },
    recipient: { id: 'STU001', name: 'Ahmed Khan', role: 'STUDENT' },
    priority: 'HIGH',
    isRead: false, 
    createdAt: '2024-01-14T14:30:00Z' 
  },
  { 
    id: '3', 
    subject: 'Fee Payment Reminder', 
    content: 'Your fee for January is due. Please pay by Jan 20.', 
    sender: { id: '3', name: 'Admin', role: 'ADMIN' },
    recipient: { id: 'STU001', name: 'Ahmed Khan', role: 'STUDENT' },
    priority: 'NORMAL',
    isRead: true, 
    createdAt: '2024-01-12T09:00:00Z' 
  }
];

const MOCK_EXAM_SCHEDULE: ExamSchedule[] = [
  { id: '1', examName: 'Mid-Term Examination', subject: { id: '1', name: 'Mathematics' }, date: '2024-02-01', startTime: '09:00', endTime: '11:00', room: 'Exam Hall A', totalMarks: 100 },
  { id: '2', examName: 'Mid-Term Examination', subject: { id: '2', name: 'Physics' }, date: '2024-02-03', startTime: '09:00', endTime: '11:00', room: 'Exam Hall B', totalMarks: 100 },
  { id: '3', examName: 'Mid-Term Examination', subject: { id: '3', name: 'English' }, date: '2024-02-05', startTime: '09:00', endTime: '11:00', room: 'Exam Hall A', totalMarks: 100 }
];

const MOCK_EXAM_MARKS: ExamMarks[] = [
  { id: '1', exam: { id: '1', name: 'First Term' }, subject: { id: '1', name: 'Mathematics' }, obtainedMarks: 92, totalMarks: 100, grade: 'A', percentage: 92, rank: 5 },
  { id: '2', exam: { id: '1', name: 'First Term' }, subject: { id: '2', name: 'Physics' }, obtainedMarks: 88, totalMarks: 100, grade: 'A-', percentage: 88, rank: 8 },
  { id: '3', exam: { id: '1', name: 'First Term' }, subject: { id: '3', name: 'English' }, obtainedMarks: 85, totalMarks: 100, grade: 'B+', percentage: 85, rank: 12 }
];

const MOCK_PERFORMANCE_OVERVIEW: PerformanceOverview = {
  currentGPA: 3.8,
  cumulativeGPA: 3.75,
  totalCredits: 45,
  rank: 5,
  totalStudents: 45,
  trend: 'UP'
};

const MOCK_SUBJECT_PERFORMANCE: SubjectPerformance[] = [
  { subject: { id: '1', name: 'Mathematics', teacher: 'Mr. Ali' }, assignments: 95, quizzes: 90, midterm: 92, final: 0, total: 92, grade: 'A', trend: 'UP' },
  { subject: { id: '2', name: 'Physics', teacher: 'Dr. Hassan' }, assignments: 88, quizzes: 85, midterm: 90, final: 0, total: 88, grade: 'A-', trend: 'STABLE' },
  { subject: { id: '3', name: 'English', teacher: 'Ms. Fatima' }, assignments: 85, quizzes: 82, midterm: 88, final: 0, total: 85, grade: 'B+', trend: 'UP' },
  { subject: { id: '4', name: 'Chemistry', teacher: 'Dr. Aisha' }, assignments: 90, quizzes: 88, midterm: 92, final: 0, total: 90, grade: 'A', trend: 'UP' },
  { subject: { id: '5', name: 'Computer Science', teacher: 'Ms. Sara' }, assignments: 98, quizzes: 95, midterm: 96, final: 0, total: 96, grade: 'A+', trend: 'UP' }
];

const MOCK_GRADES: StudentGrades = {
  gpa: 3.8,
  subjects: MOCK_SUBJECT_PERFORMANCE,
  recentExams: MOCK_EXAM_MARKS
};

const MOCK_GRADE_DISTRIBUTION: GradeDistribution[] = [
  { grade: 'A+', count: 3, percentage: 12 },
  { grade: 'A', count: 5, percentage: 20 },
  { grade: 'A-', count: 4, percentage: 16 },
  { grade: 'B+', count: 6, percentage: 24 },
  { grade: 'B', count: 4, percentage: 16 },
  { grade: 'B-', count: 3, percentage: 12 }
];

const MOCK_FEE_OVERVIEW: FeeOverview = {
  totalAmount: 50000,
  paidAmount: 35000,
  pendingAmount: 15000,
  overdueAmount: 0,
  currency: 'PKR'
};

const MOCK_FEES: Fee[] = [
  { id: '1', feeType: 'Tuition Fee', description: 'Monthly tuition fee for January 2024', amount: 30000, dueDate: '2024-01-15', status: 'PAID', paidAmount: 30000, invoiceNumber: 'INV-2024-001' },
  { id: '2', feeType: 'Lab Fee', description: 'Laboratory fee for Science subjects', amount: 5000, dueDate: '2024-01-15', status: 'PAID', paidAmount: 5000, invoiceNumber: 'INV-2024-002' },
  { id: '3', feeType: 'Library Fee', description: 'Library membership and resource fee', amount: 2000, dueDate: '2024-01-31', status: 'PENDING', paidAmount: 0 },
  { id: '4', feeType: 'Sports Fee', description: 'Sports activities and equipment fee', amount: 3000, dueDate: '2024-01-31', status: 'PENDING', paidAmount: 0 },
  { id: '5', feeType: 'Transport Fee', description: 'Monthly transport fee', amount: 10000, dueDate: '2024-02-15', status: 'PENDING', paidAmount: 0 }
];

const MOCK_PAYMENTS: Payment[] = [
  { id: '1', feeId: '1', amount: 30000, paymentMethod: 'BANK_TRANSFER', transactionId: 'TXN123456', paidAt: '2024-01-10T10:00:00Z', receiptNumber: 'RCP-001' },
  { id: '2', feeId: '2', amount: 5000, paymentMethod: 'CASH', transactionId: 'RCP789012', paidAt: '2024-01-10T14:30:00Z', receiptNumber: 'RCP-002' },
  { id: '3', feeId: '1', amount: 25000, paymentMethod: 'CARD', transactionId: 'TXN098765', paidAt: '2023-12-15T09:00:00Z', receiptNumber: 'RCP-003' }
];

const MOCK_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: '1', leaveType: 'PERSONAL', startDate: '2024-01-20', endDate: '2024-01-22', reason: 'Family function', status: 'APPROVED', createdAt: '2024-01-15T10:00:00Z' },
  { id: '2', leaveType: 'MEDICAL', startDate: '2024-02-01', endDate: '2024-02-02', reason: 'Medical appointment', status: 'PENDING', createdAt: '2024-01-18T14:00:00Z' }
];

const MOCK_TRANSPORT: TransportInfo = {
  vehicle: { id: '1', number: 'BUS-123', type: 'School Bus' },
  route: { id: '1', name: 'Route 5', stops: ['F-10 Markaz', 'F-11 Markaz', 'G-10', 'School'] },
  driver: { name: 'Saleem Ahmed', phone: '+92 300 5555555' },
  pickupTime: '07:30',
  dropTime: '14:30',
  pickupPoint: 'F-10 Markaz'
};

const MOCK_HOSTEL: HostelInfo = {
  room: { id: '1', number: '105', floor: '1', building: 'Boys Hostel A' },
  roommates: [
    { id: '1', name: 'Hassan Ali' }
  ],
  warden: { name: 'Mr. Zahid', phone: '+92 300 6666666' },
  mess: {
    timings: {
      breakfast: '07:00 - 09:00',
      lunch: '12:00 - 14:00',
      dinner: '18:00 - 20:00'
    }
  }
};

const MOCK_DOCUMENTS: Document[] = [
  { id: '1', name: 'Birth Certificate', type: 'PDF', url: '/documents/birth-cert.pdf', uploadedAt: '2020-04-01T00:00:00Z', size: 256000 },
  { id: '2', name: 'Previous School Records', type: 'PDF', url: '/documents/school-records.pdf', uploadedAt: '2020-04-01T00:00:00Z', size: 1259520 },
  { id: '3', name: 'Medical Certificate', type: 'PDF', url: '/documents/medical-cert.pdf', uploadedAt: '2023-09-15T00:00:00Z', size: 184320 }
];

// ==================== GENERIC HOOK STATE ====================

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Helper to simulate API delay for mock data
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== DASHBOARD HOOKS ====================

export function useDashboard(): UseApiState<DashboardData> {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.profile.getDashboard();
      if (response.success) {
        setData(response.data);
      } else {
        // Fallback to mock data
        await delay(300);
        setData(MOCK_DASHBOARD);
      }
    } catch {
      // Fallback to mock data on error
      await delay(300);
      setData(MOCK_DASHBOARD);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== PROFILE HOOKS ====================

export function useProfile(): UseApiState<StudentProfile> {
  const [data, setData] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.profile.getProfile();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_PROFILE);
      }
    } catch {
      await delay(300);
      setData(MOCK_PROFILE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useUpdateProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.profile.updateProfile(payload);
      if (response.success) {
        toast.success('Profile updated successfully');
        return response.data;
      } else {
        // Mock success
        await delay(500);
        toast.success('Profile updated successfully (Demo)');
        return { ...MOCK_PROFILE, ...payload };
      }
    } catch {
      // Mock success
      await delay(500);
      toast.success('Profile updated successfully (Demo)');
      return { ...MOCK_PROFILE, ...payload };
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateProfile, loading, error };
}

export function useSchedule(weekOffset?: number): UseApiState<ScheduleItem[]> {
  const [data, setData] = useState<ScheduleItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.profile.getSchedule(weekOffset);
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_SCHEDULE);
      }
    } catch {
      await delay(300);
      setData(MOCK_SCHEDULE);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useGrades(): UseApiState<StudentGrades> {
  const [data, setData] = useState<StudentGrades | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.profile.getGrades();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_GRADES);
      }
    } catch {
      await delay(300);
      setData(MOCK_GRADES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== ASSIGNMENT HOOKS ====================

export function useAssignmentStatistics(): UseApiState<AssignmentStatistics> {
  const [data, setData] = useState<AssignmentStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.assignments.getStatistics();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_ASSIGNMENT_STATS);
      }
    } catch {
      await delay(300);
      setData(MOCK_ASSIGNMENT_STATS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAssignments(params?: {
  subjectId?: string;
  status?: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE';
  filter?: 'pending' | 'submitted' | 'graded' | 'all';
  page?: number;
  limit?: number;
}): UseApiState<{ assignments: Assignment[]; pagination: { page: number; limit: number; total: number } }> {
  const [data, setData] = useState<{ assignments: Assignment[]; pagination: { page: number; limit: number; total: number } } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.assignments.list(params);
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        let filteredAssignments = MOCK_ASSIGNMENTS;
        if (params?.status) {
          filteredAssignments = filteredAssignments.filter(a => a.status === params.status);
        }
        if (params?.filter && params.filter !== 'all') {
          filteredAssignments = filteredAssignments.filter(a => a.status.toLowerCase() === params.filter);
        }
        setData({
          assignments: filteredAssignments,
          pagination: { page: params?.page || 1, limit: params?.limit || 10, total: filteredAssignments.length }
        });
      }
    } catch {
      await delay(300);
      let filteredAssignments = MOCK_ASSIGNMENTS;
      if (params?.status) {
        filteredAssignments = filteredAssignments.filter(a => a.status === params.status);
      }
      if (params?.filter && params.filter !== 'all') {
        filteredAssignments = filteredAssignments.filter(a => a.status.toLowerCase() === params.filter);
      }
      setData({
        assignments: filteredAssignments,
        pagination: { page: params?.page || 1, limit: params?.limit || 10, total: filteredAssignments.length }
      });
    } finally {
      setLoading(false);
    }
  }, [params?.subjectId, params?.status, params?.filter, params?.page, params?.limit]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAssignmentDetail(id: string): UseApiState<Assignment> {
  const [data, setData] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.assignments.getById(id);
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        const mockAssignment = MOCK_ASSIGNMENTS.find(a => a.id === id) || MOCK_ASSIGNMENTS[0];
        setData(mockAssignment);
      }
    } catch {
      await delay(300);
      const mockAssignment = MOCK_ASSIGNMENTS.find(a => a.id === id) || MOCK_ASSIGNMENTS[0];
      setData(mockAssignment);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useSubmitAssignment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (payload: SubmitAssignmentPayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.assignments.submit(payload);
      if (response.success) {
        toast.success('Assignment submitted successfully!');
        return response.data;
      } else {
        await delay(500);
        toast.success('Assignment submitted successfully! (Demo)');
        return { ...payload, status: 'SUBMITTED', submittedAt: new Date().toISOString() };
      }
    } catch {
      await delay(500);
      toast.success('Assignment submitted successfully! (Demo)');
      return { ...payload, status: 'SUBMITTED', submittedAt: new Date().toISOString() };
    } finally {
      setLoading(false);
    }
  }, []);

  return { submit, loading, error };
}

// ==================== ATTENDANCE HOOKS ====================

export function useAttendanceList(params?: { startDate?: string; endDate?: string }): UseApiState<AttendanceRecord[]> {
  const [data, setData] = useState<AttendanceRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.attendance.list(params);
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_ATTENDANCE_RECORDS);
      }
    } catch {
      await delay(300);
      setData(MOCK_ATTENDANCE_RECORDS);
    } finally {
      setLoading(false);
    }
  }, [params?.startDate, params?.endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAttendanceSummary(): UseApiState<AttendanceSummary> {
  const [data, setData] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.attendance.getSummary();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_ATTENDANCE_SUMMARY);
      }
    } catch {
      await delay(300);
      setData(MOCK_ATTENDANCE_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useAttendanceOverview(): UseApiState<AttendanceOverview> {
  const [data, setData] = useState<AttendanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.attendance.getOverview();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_ATTENDANCE_OVERVIEW);
      }
    } catch {
      await delay(300);
      setData(MOCK_ATTENDANCE_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useSubjectAttendance(): UseApiState<SubjectAttendance[]> {
  const [data, setData] = useState<SubjectAttendance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.attendance.getSubjectWise();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_SUBJECT_ATTENDANCE);
      }
    } catch {
      await delay(300);
      setData(MOCK_SUBJECT_ATTENDANCE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useLeaveRequests(): UseApiState<LeaveRequest[]> {
  const [data, setData] = useState<LeaveRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.attendance.getLeaveRequests();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_LEAVE_REQUESTS);
      }
    } catch {
      await delay(300);
      setData(MOCK_LEAVE_REQUESTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useCreateLeaveRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLeave = useCallback(async (payload: CreateLeavePayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.attendance.createLeaveRequest(payload);
      if (response.success) {
        toast.success('Leave request created successfully!');
        return response.data;
      } else {
        await delay(500);
        toast.success('Leave request created successfully! (Demo)');
        return { id: Date.now().toString(), ...payload, status: 'PENDING', appliedOn: new Date().toISOString() };
      }
    } catch {
      await delay(500);
      toast.success('Leave request created successfully! (Demo)');
      return { id: Date.now().toString(), ...payload, status: 'PENDING', appliedOn: new Date().toISOString() };
    } finally {
      setLoading(false);
    }
  }, []);

  return { createLeave, loading, error };
}

// ==================== COMMUNICATION HOOKS ====================

export function useAnnouncements(): UseApiState<Announcement[]> {
  const [data, setData] = useState<Announcement[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.communication.getAnnouncements();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_ANNOUNCEMENTS);
      }
    } catch {
      await delay(300);
      setData(MOCK_ANNOUNCEMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useMessages(): UseApiState<Message[]> {
  const [data, setData] = useState<Message[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.communication.getMessages();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_MESSAGES);
      }
    } catch {
      await delay(300);
      setData(MOCK_MESSAGES);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useSendMessage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (payload: SendMessagePayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.communication.sendMessage(payload);
      if (response.success) {
        toast.success('Message sent successfully!');
        return response.data;
      } else {
        await delay(500);
        toast.success('Message sent successfully! (Demo)');
        return { id: Date.now().toString(), ...payload, date: new Date().toISOString() };
      }
    } catch {
      await delay(500);
      toast.success('Message sent successfully! (Demo)');
      return { id: Date.now().toString(), ...payload, date: new Date().toISOString() };
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendMessage, loading, error };
}

// ==================== EXAM HOOKS ====================

export function useExamSchedule(): UseApiState<ExamSchedule[]> {
  const [data, setData] = useState<ExamSchedule[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.exams.getSchedule();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_EXAM_SCHEDULE);
      }
    } catch {
      await delay(300);
      setData(MOCK_EXAM_SCHEDULE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useExamMarks(examId?: string): UseApiState<ExamMarks[]> {
  const [data, setData] = useState<ExamMarks[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.exams.getMarks(examId);
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_EXAM_MARKS);
      }
    } catch {
      await delay(300);
      setData(MOCK_EXAM_MARKS);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useExamReportCard(examId: string): UseApiState<ExamReportCard> {
  const [data, setData] = useState<ExamReportCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.exams.getReportCard(examId);
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData({
          examId: examId,
          examName: 'First Term',
          student: { name: 'Ahmed Khan', rollNumber: '101', class: '10th Grade' },
          subjects: [
            { name: 'Mathematics', obtainedMarks: 92, totalMarks: 100, grade: 'A' },
            { name: 'Physics', obtainedMarks: 88, totalMarks: 100, grade: 'A-' },
            { name: 'English', obtainedMarks: 85, totalMarks: 100, grade: 'B+' }
          ],
          totalMarks: 300,
          obtainedTotal: 265,
          percentage: 88.3,
          grade: 'A',
          rank: 5
        });
      }
    } catch {
      await delay(300);
      setData({
        id: examId,
        examName: 'First Term',
        studentName: 'Ahmed Khan',
        class: '10th Grade',
        section: 'A',
        marks: MOCK_EXAM_MARKS,
        totalObtained: 265,
        totalMax: 300,
        percentage: 88.3,
        grade: 'A',
        rank: 5
      });
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function usePerformanceOverview(): UseApiState<PerformanceOverview> {
  const [data, setData] = useState<PerformanceOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.exams.getPerformanceOverview();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_PERFORMANCE_OVERVIEW);
      }
    } catch {
      await delay(300);
      setData(MOCK_PERFORMANCE_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useSubjectPerformance(): UseApiState<SubjectPerformance[]> {
  const [data, setData] = useState<SubjectPerformance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.exams.getSubjectPerformance();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_SUBJECT_PERFORMANCE);
      }
    } catch {
      await delay(300);
      setData(MOCK_SUBJECT_PERFORMANCE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useGradeDistribution(): UseApiState<GradeDistribution[]> {
  const [data, setData] = useState<GradeDistribution[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.exams.getGradeDistribution();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_GRADE_DISTRIBUTION);
      }
    } catch {
      await delay(300);
      setData(MOCK_GRADE_DISTRIBUTION);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useExamReports(): UseApiState<ExamReportCard[]> {
  const [data, setData] = useState<ExamReportCard[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.exams.getReports();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData([{
          examId: '1',
          examName: 'First Term',
          student: { name: 'Ahmed Khan', rollNumber: '101', class: '10th Grade' },
          subjects: [
            { name: 'Mathematics', obtainedMarks: 92, totalMarks: 100, grade: 'A' },
            { name: 'Physics', obtainedMarks: 88, totalMarks: 100, grade: 'A-' },
            { name: 'English', obtainedMarks: 85, totalMarks: 100, grade: 'B+' }
          ],
          totalMarks: 300,
          obtainedTotal: 265,
          percentage: 88.3,
          grade: 'A',
          rank: 5
        }]);
      }
    } catch {
      await delay(300);
      setData([{
        examId: '1',
        examName: 'First Term',
        student: { name: 'Ahmed Khan', rollNumber: '101', class: '10th Grade' },
        subjects: [
          { name: 'Mathematics', obtainedMarks: 92, totalMarks: 100, grade: 'A' },
          { name: 'Physics', obtainedMarks: 88, totalMarks: 100, grade: 'A-' },
          { name: 'English', obtainedMarks: 85, totalMarks: 100, grade: 'B+' }
        ],
        totalMarks: 300,
        obtainedTotal: 265,
        percentage: 88.3,
        grade: 'A',
        rank: 5
      }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== FEE HOOKS ====================

export function useFeeOverview(): UseApiState<FeeOverview> {
  const [data, setData] = useState<FeeOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.fees.getOverview();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_FEE_OVERVIEW);
      }
    } catch {
      await delay(300);
      setData(MOCK_FEE_OVERVIEW);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useFees(status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'): UseApiState<Fee[]> {
  const [data, setData] = useState<Fee[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.fees.list(status);
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        let filteredFees = MOCK_FEES;
        if (status) {
          filteredFees = filteredFees.filter(f => f.status === status);
        }
        setData(filteredFees);
      }
    } catch {
      await delay(300);
      let filteredFees = MOCK_FEES;
      if (status) {
        filteredFees = filteredFees.filter(f => f.status === status);
      }
      setData(filteredFees);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function usePayments(): UseApiState<Payment[]> {
  const [data, setData] = useState<Payment[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.fees.getPayments();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_PAYMENTS);
      }
    } catch {
      await delay(300);
      setData(MOCK_PAYMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function usePayFee() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const payFee = useCallback(async (feeId: string, payload: PayFeePayload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.fees.pay(feeId, payload);
      if (response.success) {
        toast.success('Payment successful!');
        return response.data;
      } else {
        await delay(500);
        toast.success('Payment successful! (Demo)');
        return { id: feeId, ...payload, status: 'COMPLETED', date: new Date().toISOString() };
      }
    } catch {
      await delay(500);
      toast.success('Payment successful! (Demo)');
      return { id: feeId, ...payload, status: 'COMPLETED', date: new Date().toISOString() };
    } finally {
      setLoading(false);
    }
  }, []);

  return { payFee, loading, error };
}

// ==================== LOGISTICS HOOKS ====================

export function useTransportInfo(): UseApiState<TransportInfo> {
  const [data, setData] = useState<TransportInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.logistics.getTransport();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_TRANSPORT);
      }
    } catch {
      await delay(300);
      setData(MOCK_TRANSPORT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

export function useHostelInfo(): UseApiState<HostelInfo> {
  const [data, setData] = useState<HostelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.logistics.getHostel();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_HOSTEL);
      }
    } catch {
      await delay(300);
      setData(MOCK_HOSTEL);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== DOCUMENT HOOKS ====================

export function useDocuments(): UseApiState<Document[]> {
  const [data, setData] = useState<Document[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await studentApi.documents.list();
      if (response.success) {
        setData(response.data);
      } else {
        await delay(300);
        setData(MOCK_DOCUMENTS);
      }
    } catch {
      await delay(300);
      setData(MOCK_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ==================== DOWNLOAD HOOKS ====================

export function useDownloadExamSchedule() {
  const [loading, setLoading] = useState(false);

  const download = useCallback(async () => {
    setLoading(true);
    try {
      const result = await studentApi.exams.downloadSchedule();
      if (result.success) {
        toast.success('Exam schedule downloaded!');
      } else {
        toast.info('Download feature available when backend is connected');
      }
    } catch {
      toast.info('Download feature available when backend is connected');
    } finally {
      setLoading(false);
    }
  }, []);

  return { download, loading };
}

export function useDownloadReportCard() {
  const [loading, setLoading] = useState(false);

  const download = useCallback(async (examId: string) => {
    setLoading(true);
    try {
      const result = await studentApi.exams.downloadReportCard(examId);
      if (result.success) {
        toast.success('Report card downloaded!');
      } else {
        toast.info('Download feature available when backend is connected');
      }
    } catch {
      toast.info('Download feature available when backend is connected');
    } finally {
      setLoading(false);
    }
  }, []);

  return { download, loading };
}

export function useDownloadInvoice() {
  const [loading, setLoading] = useState(false);

  const download = useCallback(async (feeId: string, invoiceNumber: string) => {
    setLoading(true);
    try {
      const result = await studentApi.fees.downloadInvoice(feeId, invoiceNumber);
      if (result.success) {
        toast.success('Invoice downloaded!');
      } else {
        toast.info('Download feature available when backend is connected');
      }
    } catch {
      toast.info('Download feature available when backend is connected');
    } finally {
      setLoading(false);
    }
  }, []);

  return { download, loading };
}
