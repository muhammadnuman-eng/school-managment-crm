/**
 * Class Types
 * TypeScript types for class-related API requests and responses
 */

/**
 * Section for Class Creation
 */
export interface CreateSectionRequest {
  name: string;
  capacity: number;
  room?: string;
  classTeacherId?: string;
}

/**
 * Add Class Request
 */
export interface AddClassRequest {
  className: string; // Backend expects 'className' not 'name'
  grade?: number; // Optional based on backend
  academicYear: string; // REQUIRED - Name of academic year (e.g., "2024-2025")
  academicYearId?: string; // UUID of academic year (if available, optional)
  academicYearName?: string; // Name of academic year (alternative to academicYear)
  sections: CreateSectionRequest[];
  subjectIds?: string[];
  schoolId?: string; // Will be added from header, but can be included in body if needed
}

/**
 * Class Response
 */
export interface ClassResponse {
  id: string;
  uuid?: string;
  name: string;
  grade: number;
  academicYear: string;
  sections?: Array<{
    id: string;
    name: string;
    capacity: number;
    room?: string;
    classTeacherId?: string;
    enrolled?: number;
    classTeacher?: string;
  }>;
  subjects?: Array<{
    id: string;
    name: string;
    code: string;
    teacher?: string;
    teacherId?: string;
  }>;
  totalStudents?: number;
  totalCapacity?: number;
}

/**
 * Update Class Request
 */
export interface UpdateClassRequest {
  className?: string; // Backend expects 'className' not 'name'
  grade?: number;
  academicYear?: string; // REQUIRED - Name of academic year (e.g., "2024-2025")
  academicYearId?: string; // UUID of academic year (optional)
  academicYearName?: string; // Name of academic year (alternative to academicYear)
  sections?: CreateSectionRequest[];
  subjectIds?: string[];
}

/**
 * Classes List Response
 */
export interface ClassesListResponse {
  classes: ClassResponse[];
  total?: number;
  page?: number;
  limit?: number;
}

