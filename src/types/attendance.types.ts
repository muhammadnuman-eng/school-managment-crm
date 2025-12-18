/**
 * Attendance Types
 * TypeScript types for attendance-related API requests and responses
 */

import { ApiResponse } from './api.types';

/**
 * Attendance Status
 */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

/**
 * Leave Application Status
 */
export type LeaveApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

/**
 * Attendance Record
 */
export interface AttendanceRecord {
  id: string;
  schoolId: string;
  studentId: string;
  studentName?: string;
  rollNo?: string;
  classId: string;
  className?: string;
  sectionId: string;
  sectionName?: string;
  attendanceDate: string;
  status: AttendanceStatus;
  markedBy: string;
  markedByName?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Attendance Request
 */
export interface CreateAttendanceRequest {
  schoolId: string;
  studentId: string;
  classId: string;
  sectionId: string;
  attendanceDate: string;
  status: AttendanceStatus;
  markedBy: string;
  remarks?: string;
}

/**
 * Update Attendance Request
 */
export interface UpdateAttendanceRequest {
  attendanceDate?: string;
  status?: AttendanceStatus;
  remarks?: string;
}

/**
 * Get Attendance Request (Query Parameters)
 */
export interface GetAttendanceRequest {
  search?: string;
  schoolId?: string;
  studentId?: string;
  classId?: string;
  sectionId?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Attendance Response
 */
export interface AttendanceResponse {
  attendances: AttendanceRecord[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Attendance Report
 */
export interface AttendanceReport {
  classId: string;
  className?: string;
  sectionId?: string;
  sectionName?: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  attendanceRate: number;
  students?: Array<{
    studentId: string;
    studentName: string;
    rollNo?: string;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
    attendanceRate: number;
  }>;
}

/**
 * Leave Application
 */
export interface LeaveApplication {
  id: string;
  studentId: string;
  studentName?: string;
  rollNo?: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: LeaveApplicationStatus;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Leave Application Request
 */
export interface CreateLeaveApplicationRequest {
  studentId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status?: LeaveApplicationStatus;
}

/**
 * Update Leave Application Request
 */
export interface UpdateLeaveApplicationRequest {
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  status?: LeaveApplicationStatus;
}

/**
 * Get Leave Applications Request
 */
export interface GetLeaveApplicationsRequest {
  search?: string;
  studentId?: string;
  status?: LeaveApplicationStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Leave Applications Response
 */
export interface LeaveApplicationsResponse {
  leaveApplications: LeaveApplication[];
  total?: number;
  page?: number;
  limit?: number;
}


