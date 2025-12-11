/**
 * Student Types
 * TypeScript types for student-related API requests and responses
 */

/**
 * Student Interface
 */
export interface Student {
  id: string;
  name: string;
  rollNo: string;
  class: string;
  section: string;
  email: string;
  phone: string;
  status: 'Active' | 'Inactive';
  attendance?: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  parentPhone?: string;
  address?: string;
}

/**
 * Class Info Interface
 */
export interface ClassInfo {
  id: string;
  uuid: string;
  name: string;
  grade: number;
  sections?: SectionInfo[];
}

/**
 * Section Info Interface
 */
export interface SectionInfo {
  id: string;
  name: string;
  classId?: string;
}

/**
 * Add Student Request
 */
export interface AddStudentRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  phone: string;
  sectionId: string;
  parentPhone?: string;
}

/**
 * Get Students Request (Query Parameters)
 */
export interface GetStudentsRequest {
  class?: string;
  section?: string;
  status?: 'Active' | 'Inactive';
  search?: string;
}

/**
 * Students Response
 */
export interface StudentsResponse {
  students: Student[];
  total?: number;
  page?: number;
  limit?: number;
}

/**
 * Update Student Request
 */
export interface UpdateStudentRequest {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  address?: string;
  phone?: string;
  sectionId?: string;
  parentPhone?: string;
  status?: 'Active' | 'Inactive';
}

