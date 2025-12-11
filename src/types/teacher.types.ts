export interface Teacher {
  id: string;
  name: string;
  employeeId: string;
  subject: string;
  qualification?: string;
  experience?: string;
  email?: string;
  phone?: string;
  classes?: number;
  performance?: number;
  status?: 'Active' | 'Inactive';
  specialization?: string;
  joiningDate?: string;
  address?: string;
}

export interface AddTeacherRequest {
  name?: string;
  firstName?: string;
  lastName?: string;
  employeeId: string;
  subject: string;
  qualification?: string;
  experience?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  joiningDate?: string;
  address?: string;
  password?: string;
  schoolId?: string;
}

export interface UpdateTeacherRequest extends Partial<AddTeacherRequest> {
  status?: 'Active' | 'Inactive';
}

export interface TeachersResponse {
  teachers: Teacher[];
}

export type TeacherResponse = Teacher;

