/**
 * Examination Types
 * TypeScript types for examination-related API requests and responses
 */

import { ApiResponse } from './api.types';

/**
 * Exam Type
 */
export type ExamType = 'QUIZ' | 'MID_TERM' | 'FINAL' | 'ASSIGNMENT' | 'PROJECT';

/**
 * Exam Status
 */
export type ExamStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

/**
 * Examination
 */
export interface Examination {
  id: string;
  schoolId: string;
  examName: string;
  examType: ExamType;
  academicYearId: string;
  academicYearName?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationMinutes?: number;
  createdBy: string;
  createdByName?: string;
  status?: ExamStatus;
  examClasses?: Array<{
    classId: string;
    className?: string;
    sectionId?: string;
    sectionName?: string;
  }>;
  examSubjects?: Array<{
    subjectId: string;
    subjectName?: string;
    totalMarks: number;
    passingMarks?: number;
    weightage?: number;
  }>;
  examSchedules?: Array<{
    classId: string;
    className?: string;
    sectionId?: string;
    sectionName?: string;
    subjectId: string;
    subjectName?: string;
    examDate: string;
    startTime: string;
    endTime: string;
    roomNumber?: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Examination Request
 */
export interface CreateExaminationRequest {
  schoolId: string;
  examName: string;
  examType: ExamType;
  academicYearId: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationMinutes?: number;
  createdBy: string;
  examClasses?: Array<{
    classId: string;
    sectionId?: string;
  }>;
  examSubjects?: Array<{
    subjectId: string;
    totalMarks: number;
    passingMarks?: number;
    weightage?: number;
  }>;
  examSchedules?: Array<{
    classId: string;
    sectionId?: string;
    subjectId: string;
    examDate: string;
    startTime: string;
    endTime: string;
    roomNumber?: string;
  }>;
}

/**
 * Update Examination Request
 */
export interface UpdateExaminationRequest {
  examName?: string;
  examType?: ExamType;
  description?: string;
  startDate?: string;
  endDate?: string;
  durationMinutes?: number;
  status?: ExamStatus;
}

/**
 * Get Examinations Request
 */
export interface GetExaminationsRequest {
  search?: string;
  examType?: ExamType;
  academicYearId?: string;
  status?: ExamStatus;
  page?: number;
  limit?: number;
}

/**
 * Examinations Response
 */
export interface ExaminationsResponse {
  examinations: Examination[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Exam Marks Entry
 */
export interface ExamMarks {
  studentId: string;
  studentName?: string;
  rollNo?: string;
  subjectId: string;
  subjectName?: string;
  obtainedMarks?: number;
  totalMarks: number;
  status?: string;
}

/**
 * Create Exam Marks Request
 */
export interface CreateExamMarksRequest {
  examId: string;
  enteredBy: string;
  marks: Array<{
    studentId: string;
    subjectId: string;
    obtainedMarks?: number;
    totalMarks: number;
    status?: string;
  }>;
}

/**
 * Grade Range
 */
export interface GradeRange {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
}

/**
 * Grade Scale
 */
export interface GradeScale {
  id: string;
  schoolId: string;
  classId: string;
  className?: string;
  scaleName: string;
  gradeRanges: GradeRange[];
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Grade Scale Request
 */
export interface CreateGradeScaleRequest {
  schoolId: string;
  classId: string;
  scaleName: string;
  gradeRanges: GradeRange[];
}

/**
 * Get Grade Scales Request
 */
export interface GetGradeScalesRequest {
  classId?: string;
  scaleName?: string;
}

/**
 * Grade Scales Response
 */
export interface GradeScalesResponse {
  gradeScales: GradeScale[];
  total?: number;
}

/**
 * Grade Configuration
 */
export interface GradeConfiguration {
  id: string;
  schoolId: string;
  classId: string;
  className?: string;
  gradeScaleId: string;
  gradeScaleName?: string;
  passingPercentage: number;
  maxMarks: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Create Grade Configuration Request
 */
export interface CreateGradeConfigurationRequest {
  schoolId: string;
  classId: string;
  gradeScaleId: string;
  passingPercentage: number;
  maxMarks: number;
}

/**
 * Get Grade Configurations Request
 */
export interface GetGradeConfigurationsRequest {
  classId?: string;
}

/**
 * Grade Configurations Response
 */
export interface GradeConfigurationsResponse {
  gradeConfigurations: GradeConfiguration[];
  total?: number;
}


