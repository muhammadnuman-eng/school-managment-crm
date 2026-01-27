/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  apiPrefix: import.meta.env.VITE_API_PREFIX || 'v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

/**
 * Get full API URL with prefix
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseURL.replace(/\/$/, ''); // Remove trailing slash
  const prefix = API_CONFIG.apiPrefix.replace(/^\//, '').replace(/\/$/, ''); // Clean prefix
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}/${prefix}${cleanEndpoint}`;
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    adminLogin: '/auth/admin-login',
    schoolRegister: '/auth/school/register',
    schoolLogin: '/auth/school/login',
    register: '/auth/register',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verify2FA: '/auth/2fa/verify',
    setup2FA: '/auth/2fa/setup',
    resendOTP: '/auth/resend-otp',
    refreshToken: '/auth/refresh-token',
    verifyEmail: '/auth/verify-email',
    changePassword: '/auth/change-password',
  },
  // Admin
  admin: {
    dashboardStats: '/admin/dashboard/stats',
    students: '/admin/students',
    classes: '/admin/classes',
    sections: '/admin/sections',
    addClass: '/admin/classes',
    academicYears: '/admin/classes/academic-years',
    teachers: '/admin/teachers',
    
    // Attendance
    attendance: {
      base: '/admin/attendance',
      report: '/admin/attendance/report',
      leaveApplications: '/admin/attendance/leave-applications',
      getById: (id: string) => `/admin/attendance/${id}`,
      leaveApplicationById: (id: string) => `/admin/attendance/leave-applications/${id}`,
    },
    
    // Fees
    fees: {
      feeTypes: {
        base: '/admin/fees/fee-types',
        getById: (id: string) => `/admin/fees/fee-types/${id}`,
      },
      feeStructures: {
        base: '/admin/fees/fee-structures',
      },
      studentFees: {
        base: '/admin/fees/student-fees',
        getById: (id: string) => `/admin/fees/student-fees/${id}`,
        invoice: (id: string) => `/admin/fees/student-fees/${id}/invoice`,
      },
      overview: '/admin/fees/overview',
      payments: {
        base: '/admin/fees/payments',
      },
      expenses: {
        base: '/admin/fees/expenses',
        overview: '/admin/fees/expenses/overview',
        getById: (id: string) => `/admin/fees/expenses/${id}`,
      },
    },
    
    // Communication
    communication: {
      announcements: {
        base: '/admin/communication/announcements',
        sent: '/admin/communication/announcements/sent',
        getById: (id: string) => `/admin/communication/announcements/${id}`,
      },
      messages: {
        base: '/admin/communication/messages',
        bulk: '/admin/communication/messages/bulk',
        unreadCount: '/admin/communication/messages/unread-count',
        sent: '/admin/communication/messages/sent',
        getById: (id: string) => `/admin/communication/messages/${id}`,
        markRead: (id: string) => `/admin/communication/messages/${id}/read`,
      },
      templates: {
        base: '/admin/communication/templates',
        getById: (id: string) => `/admin/communication/templates/${id}`,
      },
      recipients: '/admin/communication/recipients',
      summary: '/admin/communication/summary',
    },
    
    // Examinations
    examinations: {
      base: '/admin/examinations',
      upcoming: '/admin/examinations/upcoming',
      ongoing: '/admin/examinations/ongoing',
      completed: '/admin/examinations/completed',
      calendar: '/admin/examinations/calendar',
      activities: '/admin/examinations/activities',
      getById: (id: string) => `/admin/examinations/${id}`,
      marks: '/admin/examinations/marks',
      gradeScales: {
        base: '/admin/examinations/grade-scales',
      },
      gradeConfigurations: {
        base: '/admin/examinations/grade-configurations',
      },
    },
    
    // Transport
    transport: {
      buses: {
        base: '/admin/transport/buses',
      },
      drivers: {
        base: '/admin/transport/drivers',
      },
      routes: {
        base: '/admin/transport/routes',
      },
      studentTransports: {
        base: '/admin/transport/student-transports',
      },
    },
    
    // Hostel
    hostel: {
      buildings: {
        base: '/admin/hostel/buildings',
      },
      rooms: {
        base: '/admin/hostel/rooms',
        getById: (id: string) => `/admin/hostel/rooms/${id}`,
      },
      overview: '/admin/hostel/overview',
      allocations: {
        base: '/admin/hostel/allocations',
        getById: (id: string) => `/admin/hostel/allocations/${id}`,
      },
      complaints: {
        base: '/admin/hostel/complaints',
        getById: (id: string) => `/admin/hostel/complaints/${id}`,
      },
    },
    
    // Inventory
    inventory: {
      categories: {
        base: '/admin/inventory/categories',
        getById: (id: string) => `/admin/inventory/categories/${id}`,
      },
      suppliers: {
        base: '/admin/inventory/suppliers',
        getById: (id: string) => `/admin/inventory/suppliers/${id}`,
      },
      items: {
        base: '/admin/inventory/items',
        getById: (id: string) => `/admin/inventory/items/${id}`,
      },
      overview: '/admin/inventory/overview',
      transactions: {
        base: '/admin/inventory/transactions',
      },
    },
    
    // Legacy endpoints (kept for backward compatibility)
    feeTypes: '/admin/fees/fee-types',
    studentFees: '/admin/fees/student-fees',
    expenses: '/admin/fees/expenses',
  },
  // Teacher
  teacher: {
    profile: '/teacher/profile',
    dashboard: '/teacher/dashboard',
    schedule: {
      weekly: '/teacher/schedule/weekly',
    },
    assignments: {
      base: '/teacher/assignments',
      statistics: '/teacher/assignments/statistics',
      getById: (id: string) => `/teacher/assignments/${id}`,
      grade: (id: string) => `/teacher/assignments/${id}/grade`,
      downloadAll: (id: string) => `/teacher/assignments/${id}/download`,
      downloadStudent: (assignmentId: string, studentId: string) => `/teacher/assignments/${assignmentId}/download/${studentId}`,
    },
    classes: {
      base: '/teacher/classes',
      getRoster: (classId: string) => `/teacher/classes/${classId}/students`,
      getAuxiliary: (classId: string) => `/teacher/classes/${classId}/auxiliary`,
    },
    timetable: '/teacher/timetable',
    exams: {
      schedule: '/teacher/exams/schedule',
      students: '/teacher/exams/students',
      getMarks: (examId: string, subjectId: string) => `/teacher/exams/${examId}/subjects/${subjectId}/marks`,
      submitMarks: (examId: string, subjectId: string) => `/teacher/exams/${examId}/subjects/${subjectId}/marks`,
    },
    communication: {
      messages: {
        base: '/teacher/communications/messages',
        getById: (id: string) => `/teacher/communications/messages/${id}`,
      },
      announcements: {
        base: '/teacher/communications/announcements',
      },
    },
    attendance: {
      base: '/teacher/attendance',
      students: '/teacher/attendance/students',
      getById: (id: string) => `/teacher/attendance/${id}`,
    },
  },
  // Schools
  schools: {
    create: '/schools',
    getById: (id: string) => `/schools/${id}`,
    update: (id: string) => `/schools/${id}`,
    delete: (id: string) => `/schools/${id}`,
  },
} as const;

