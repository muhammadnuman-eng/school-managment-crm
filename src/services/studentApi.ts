import api, { ApiResponse } from './api';

// ==================== TYPE DEFINITIONS ====================

// Auth Types
export interface LoginPayload {
  email?: string;
  admissionNumber?: string;
  password: string;
  portal?: {
    role: 'STUDENT';
    schoolId: string;
  };
  device?: {
    deviceId: string;
    ipAddress?: string;
    userAgent?: string;
  };
  rememberMe?: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'STUDENT';
  schoolId?: string;
  phone?: string;
  device: {
    deviceId: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

export interface TwoFactorPayload {
  sessionId: string;
  userId: string;
  method: 'TOTP' | 'SMS';
  code: string;
  rememberDevice?: boolean;
}

// Profile Types
export interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  medicalInfo?: string;
  preferredLocale?: string;
  timezone?: string;
  avatar?: string;
  student: {
    admissionNumber: string;
    rollNumber: string;
    class?: string;
    section?: string;
  };
}

export interface UpdateProfilePayload {
  address?: string;
  medicalInfo?: string;
  phone?: string;
  preferredLocale?: string;
  timezone?: string;
}

// Dashboard Types
export interface DashboardData {
  student: {
    name: string;
    class: string;
    section: string;
    rollNumber: string;
  };
  stats: {
    attendancePercentage: number;
    gpa: number;
    pendingAssignments: number;
    pendingFees: number;
  };
  upcomingClasses: Array<{
    id: string;
    subject: string;
    teacher: string;
    time: string;
    room: string;
  }>;
  recentGrades: Array<{
    subject: string;
    score: number;
    maxScore: number;
    grade: string;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
  }>;
}

// Schedule Types
export interface ScheduleItem {
  id: string;
  day: string;
  subject: string;
  teacher: string;
  startTime: string;
  endTime: string;
  room: string;
}

// Assignment Types
export interface Assignment {
  id: string;
  title: string;
  description: string;
  subject: {
    id: string;
    name: string;
  };
  teacher: {
    id: string;
    name: string;
  };
  dueDate: string;
  assignedDate: string;
  totalMarks: number;
  status: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE';
  submittedAt?: string;
  obtainedMarks?: number;
  feedback?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface AssignmentStatistics {
  total: number;
  pending: number;
  submitted: number;
  graded: number;
  late: number;
  averageScore?: number;
}

export interface SubmitAssignmentPayload {
  assignmentId: string;
  submissionText?: string;
  fileUrl?: string;
  fileName?: string;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'LEAVE';
  subject?: {
    id: string;
    name: string;
  };
  remarks?: string;
}

export interface AttendanceSummary {
  totalDays: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
  percentage: number;
}

export interface AttendanceOverview {
  currentMonth: AttendanceSummary;
  overall: AttendanceSummary;
  monthlyTrend: Array<{
    month: string;
    percentage: number;
  }>;
}

export interface SubjectAttendance {
  subject: {
    id: string;
    name: string;
    teacher: string;
  };
  totalClasses: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface LeaveRequest {
  id: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

export interface CreateLeavePayload {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

// Communication Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: string;
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  author?: string;
}

export interface Message {
  id: string;
  subject: string;
  content: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  recipient: {
    id: string;
    name: string;
    role: string;
  };
  priority: 'HIGH' | 'NORMAL' | 'LOW';
  isRead: boolean;
  createdAt: string;
}

export interface SendMessagePayload {
  recipientUserId: string;
  subject?: string;
  content: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
}

// Exam Types
export interface ExamSchedule {
  id: string;
  examName: string;
  subject: {
    id: string;
    name: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  room: string;
  totalMarks: number;
}

export interface ExamMarks {
  id: string;
  exam: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  obtainedMarks: number;
  totalMarks: number;
  grade: string;
  percentage: number;
  rank?: number;
}

export interface ExamReportCard {
  examId: string;
  examName: string;
  student: {
    name: string;
    rollNumber: string;
    class: string;
  };
  subjects: Array<{
    name: string;
    obtainedMarks: number;
    totalMarks: number;
    grade: string;
  }>;
  totalMarks: number;
  obtainedTotal: number;
  percentage: number;
  grade: string;
  rank?: number;
  remarks?: string;
}

export interface PerformanceOverview {
  currentGPA: number;
  cumulativeGPA: number;
  totalCredits: number;
  rank?: number;
  totalStudents?: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface SubjectPerformance {
  subject: {
    id: string;
    name: string;
    teacher: string;
  };
  assignments: number;
  quizzes: number;
  midterm: number;
  final: number;
  total: number;
  grade: string;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface GradeDistribution {
  grade: string;
  count: number;
  percentage: number;
}

// Fee Types
export interface FeeOverview {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  currency: string;
}

export interface Fee {
  id: string;
  feeType: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  paidAmount: number;
  invoiceNumber?: string;
}

export interface Payment {
  id: string;
  feeId: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paidAt: string;
  receiptNumber?: string;
}

export interface PayFeePayload {
  amount?: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'OTHER';
}

// Logistics Types
export interface TransportInfo {
  vehicle: {
    id: string;
    number: string;
    type: string;
  };
  route: {
    id: string;
    name: string;
    stops: string[];
  };
  driver: {
    name: string;
    phone: string;
  };
  pickupTime: string;
  dropTime: string;
  pickupPoint: string;
}

export interface HostelInfo {
  room: {
    id: string;
    number: string;
    floor: string;
    building: string;
  };
  roommates: Array<{
    id: string;
    name: string;
  }>;
  warden: {
    name: string;
    phone: string;
  };
  mess: {
    timings: {
      breakfast: string;
      lunch: string;
      dinner: string;
    };
  };
}

// Document Types
export interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
  size: number;
}

// Grades Types (from profile)
export interface StudentGrades {
  gpa: number;
  subjects: SubjectPerformance[];
  recentExams: ExamMarks[];
}

// ==================== API FUNCTIONS ====================

// AUTH APIs (AUTH_01 to AUTH_12)
export const authApi = {
  // AUTH_01: Student Login
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload),

  // AUTH_02: Student Register
  register: (payload: RegisterPayload) =>
    api.post<AuthResponse>('/auth/register', payload),

  // AUTH_03: Discover Portals
  discoverPortals: (email: string) =>
    api.get<{ portals: Array<{ role: string; schoolId: string; schoolName: string }> }>('/auth/portals', { email }),

  // AUTH_04: Verify Two Factor
  verify2FA: (payload: TwoFactorPayload) =>
    api.post<AuthResponse>('/auth/2fa/verify', payload),

  // AUTH_05: Resend Two Factor Code
  resend2FA: (payload: Omit<TwoFactorPayload, 'code' | 'rememberDevice'>) =>
    api.post<{ message: string }>('/auth/2fa/resend', payload),

  // AUTH_06: Setup Two Factor
  setup2FA: (payload: { method?: 'TOTP' | 'SMS'; enable?: boolean; code?: string }) =>
    api.post<{ qrCode?: string; secret?: string }>('/auth/2fa/setup', payload),

  // AUTH_07: Refresh Token
  refreshToken: (refreshToken: string) =>
    api.post<AuthResponse>('/auth/refresh', { refreshToken }),

  // AUTH_08: Logout
  logout: (payload?: { sessionId?: string; allDevices?: boolean }) =>
    api.post<{ message: string }>('/auth/logout', payload),

  // AUTH_09: Forgot Password
  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/auth/forgot-password', { email }),

  // AUTH_10: Reset Password
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/reset-password', { token, newPassword }),

  // AUTH_11: Change Password
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword }),

  // AUTH_12: Switch Role
  switchRole: (role: string, schoolId?: string) =>
    api.post<AuthResponse>('/auth/switch-role', { role, schoolId }),
};

// PROFILE APIs (PROFILE_01 to PROFILE_05)
export const profileApi = {
  // PROFILE_01: Get Profile
  getProfile: () =>
    api.get<StudentProfile>('/student/profile'),

  // PROFILE_02: Update Profile
  updateProfile: (payload: UpdateProfilePayload) =>
    api.patch<StudentProfile>('/student/profile', payload),

  // PROFILE_03: Get Dashboard
  getDashboard: () =>
    api.get<DashboardData>('/student/dashboard'),

  // PROFILE_04: Get Schedule
  getSchedule: (weekOffset?: number) =>
    api.get<ScheduleItem[]>('/student/schedule', { weekOffset }),

  // PROFILE_05: Get Grades
  getGrades: () =>
    api.get<StudentGrades>('/student/grades'),
};

// ASSIGNMENT APIs (ASSIGNMENT_01 to ASSIGNMENT_04)
export const assignmentApi = {
  // ASSIGNMENT_01: Get Assignment Statistics
  getStatistics: () =>
    api.get<AssignmentStatistics>('/student/assignments/statistics'),

  // ASSIGNMENT_02: List Assignments
  list: (params?: {
    subjectId?: string;
    search?: string;
    status?: 'PENDING' | 'SUBMITTED' | 'GRADED' | 'LATE';
    filter?: 'pending' | 'submitted' | 'graded' | 'all';
    page?: number;
    limit?: number;
  }) =>
    api.get<{ assignments: Assignment[]; pagination: { page: number; limit: number; total: number } }>(
      '/student/assignments',
      params as Record<string, string | number | undefined>
    ),

  // ASSIGNMENT_03: Get Assignment Details
  getById: (id: string) =>
    api.get<Assignment>(`/student/assignments/${id}`),

  // ASSIGNMENT_04: Submit Assignment
  submit: (payload: SubmitAssignmentPayload) =>
    api.post<Assignment>('/student/assignments/submit', payload),
};

// ATTENDANCE APIs (ATTENDANCE_01 to ATTENDANCE_07)
export const attendanceApi = {
  // ATTENDANCE_01: List Attendance
  list: (params?: { startDate?: string; endDate?: string }) =>
    api.get<AttendanceRecord[]>('/student/attendance', params),

  // ATTENDANCE_02: Get Monthly Summary
  getSummary: () =>
    api.get<AttendanceSummary>('/student/attendance/summary'),

  // ATTENDANCE_03: List Leave Requests
  getLeaveRequests: () =>
    api.get<LeaveRequest[]>('/student/attendance/leave'),

  // ATTENDANCE_04: Create Leave Request
  createLeaveRequest: (payload: CreateLeavePayload) =>
    api.post<LeaveRequest>('/student/attendance/leave', payload),

  // ATTENDANCE_05: Get Attendance Overview
  getOverview: () =>
    api.get<AttendanceOverview>('/student/attendance/overview'),

  // ATTENDANCE_06: Get Subject-wise Attendance
  getSubjectWise: () =>
    api.get<SubjectAttendance[]>('/student/attendance/subjects'),

  // ATTENDANCE_07: Get Subject Detailed Attendance
  getSubjectDetail: (subjectId: string) =>
    api.get<{ subject: SubjectAttendance; records: AttendanceRecord[] }>(
      `/student/attendance/subjects/${subjectId}`
    ),
};

// COMMUNICATION APIs (COMM_01 to COMM_03)
export const communicationApi = {
  // COMM_01: Get Announcements
  getAnnouncements: () =>
    api.get<Announcement[]>('/student/communications/announcements'),

  // COMM_02: Get Messages
  getMessages: () =>
    api.get<Message[]>('/student/communications/messages'),

  // COMM_03: Send Message
  sendMessage: (payload: SendMessagePayload) =>
    api.post<Message>('/student/communications/messages', payload),
};

// DOCUMENTS APIs (DOC_01)
export const documentApi = {
  // DOC_01: List Documents
  list: () =>
    api.get<Document[]>('/student/documents'),
};

// EXAM APIs (EXAM_01 to EXAM_09)
export const examApi = {
  // EXAM_01: Get Exam Schedule
  getSchedule: () =>
    api.get<ExamSchedule[]>('/student/exams/schedule'),

  // EXAM_02: Download Exam Schedule
  downloadSchedule: () =>
    api.download('/student/exams/schedule/download', 'exam-schedule.json'),

  // EXAM_03: Get Exam Marks
  getMarks: (examId?: string) =>
    api.get<ExamMarks[]>('/student/exams/marks', { examId }),

  // EXAM_04: Get Exam Report Card
  getReportCard: (examId: string) =>
    api.get<ExamReportCard>(`/student/exams/${examId}/report`),

  // EXAM_05: Get Performance Overview
  getPerformanceOverview: () =>
    api.get<PerformanceOverview>('/student/exams/performance/overview'),

  // EXAM_06: Get Subject-wise Performance
  getSubjectPerformance: () =>
    api.get<SubjectPerformance[]>('/student/exams/performance/subjects'),

  // EXAM_07: Get Grade Distribution
  getGradeDistribution: () =>
    api.get<GradeDistribution[]>('/student/exams/performance/distribution'),

  // EXAM_08: Get Exam Reports
  getReports: () =>
    api.get<ExamReportCard[]>('/student/exams/reports'),

  // EXAM_09: Download Report Card
  downloadReportCard: (examId: string) =>
    api.download(`/student/exams/${examId}/report/download`, `report-card-${examId}.json`),
};

// FEE APIs (FEE_01 to FEE_06)
export const feeApi = {
  // FEE_01: Get Fee Overview
  getOverview: () =>
    api.get<FeeOverview>('/student/fees/overview'),

  // FEE_02: List Fees
  list: (status?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE') =>
    api.get<Fee[]>('/student/fees', { status }),

  // FEE_03: Get Payments
  getPayments: () =>
    api.get<Payment[]>('/student/fees/payments'),

  // FEE_04: Get Invoice
  getInvoice: (feeId: string) =>
    api.get<Fee>(`/student/fees/${feeId}`),

  // FEE_05: Download Invoice
  downloadInvoice: (feeId: string, invoiceNumber: string) =>
    api.download(`/student/fees/${feeId}/invoice/download`, `invoice-${invoiceNumber}.json`),

  // FEE_06: Pay Fee
  pay: (feeId: string, payload: PayFeePayload) =>
    api.post<Payment>(`/student/fees/${feeId}/pay`, payload),
};

// LOGISTICS APIs (LOG_01 to LOG_02)
export const logisticsApi = {
  // LOG_01: Get Transport Info
  getTransport: () =>
    api.get<TransportInfo>('/student/logistics/transport'),

  // LOG_02: Get Hostel Info
  getHostel: () =>
    api.get<HostelInfo>('/student/logistics/hostel'),
};

// Export all APIs
export const studentApi = {
  auth: authApi,
  profile: profileApi,
  assignments: assignmentApi,
  attendance: attendanceApi,
  communication: communicationApi,
  documents: documentApi,
  exams: examApi,
  fees: feeApi,
  logistics: logisticsApi,
};

export default studentApi;


