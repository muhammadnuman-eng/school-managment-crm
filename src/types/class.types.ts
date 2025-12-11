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
  name: string;
  grade: number;
  academicYear: string;
  sections: CreateSectionRequest[];
  subjectIds?: string[];
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
  name?: string;
  grade?: number;
  academicYear?: string;
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

