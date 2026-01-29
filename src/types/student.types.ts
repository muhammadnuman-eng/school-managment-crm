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
  currentSectionId: string; // Backend expects 'currentSectionId' not 'sectionId' - should be section name (e.g., "A", "B")
  parentPhone?: string;
  className?: string; // Class name (e.g., "Grade 10") - required by backend
  classId?: string; // Class ID/UUID - optional, can be used instead of className
  currentClassId?: string; // Class name (e.g., "Class 3") - required by backend when section exists in multiple classes
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
  currentSectionId?: string; // Backend expects 'currentSectionId' not 'sectionId'
  parentPhone?: string;
  status?: 'Active' | 'Inactive';
  className?: string; // Class name (e.g., "Grade 10") - required by backend when updating section
  classId?: string; // Class ID/UUID - optional, can be used instead of className
}

