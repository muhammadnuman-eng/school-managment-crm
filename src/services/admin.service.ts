/**
 * Admin Service
 * Handles all admin-related API calls
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { DashboardStatsResponse } from '../types/dashboard.types';
import { AddStudentRequest, UpdateStudentRequest, GetStudentsRequest, StudentsResponse, Student, ClassInfo, SectionInfo } from '../types/student.types';
import { AddClassRequest, UpdateClassRequest, ClassResponse, ClassesListResponse } from '../types/class.types';
import { Teacher, TeachersResponse, AddTeacherRequest, UpdateTeacherRequest } from '../types/teacher.types';
import { ApiResponse } from '../types/api.types';

/**
 * Admin Service Class
 */
class AdminService {
  /**
   * Get Dashboard Stats
   */
  async getDashboardStats(): Promise<DashboardStatsResponse> {
    const response = await apiClient.get<DashboardStatsResponse>(
      API_ENDPOINTS.admin.dashboardStats
    );

    // Log full response for debugging
    if (import.meta.env.DEV) {
      console.log('Dashboard Stats API Response (Raw):', {
        fullResponse: response,
        responseData: response.data,
        responseDataType: typeof response.data,
        responseDataKeys: response.data ? Object.keys(response.data) : [],
        responseDataString: JSON.stringify(response.data, null, 2),
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    // Handle different response structures
    // Backend might return data directly or nested in data.data
    const statsData = response.data as any;
    
    // Check for nested data structure
    let finalData = statsData;
    if (statsData.data && typeof statsData.data === 'object' && !Array.isArray(statsData.data)) {
      finalData = statsData.data;
    }
    
    // Log extracted data structure
    if (import.meta.env.DEV) {
      console.log('Dashboard Stats Extracted Data:', {
        finalData,
        finalDataKeys: Object.keys(finalData || {}),
        hasRevenueData: !!finalData?.revenueData,
        hasAttendanceTrend: !!finalData?.attendanceTrend,
        hasClassDistribution: !!finalData?.classDistribution,
        revenueDataLength: Array.isArray(finalData?.revenueData) ? finalData.revenueData.length : 0,
        attendanceTrendLength: Array.isArray(finalData?.attendanceTrend) ? finalData.attendanceTrend.length : 0,
        classDistributionLength: Array.isArray(finalData?.classDistribution) ? finalData.classDistribution.length : 0,
      });
    }
    
    // Ensure graph data arrays are properly formatted
    const result: DashboardStatsResponse = {
      students: finalData.students || { total: 0 },
      teachers: finalData.teachers || { total: 0 },
      fees: finalData.fees || { total: 0, currency: 'PKR' },
      attendance: finalData.attendance || { average: 0 },
      topPerformers: Array.isArray(finalData.topPerformers) ? finalData.topPerformers : [],
      recentActivities: Array.isArray(finalData.recentActivities) ? finalData.recentActivities : [],
      // Graph data - check multiple possible property names
      revenueData: Array.isArray(finalData.revenueData) ? finalData.revenueData :
                  Array.isArray(finalData.revenue) ? finalData.revenue :
                  Array.isArray(finalData.financialData) ? finalData.financialData :
                  undefined,
      attendanceTrend: Array.isArray(finalData.attendanceTrend) ? finalData.attendanceTrend :
                       Array.isArray(finalData.attendance) ? finalData.attendance :
                       Array.isArray(finalData.attendanceData) ? finalData.attendanceData :
                       undefined,
      classDistribution: Array.isArray(finalData.classDistribution) ? finalData.classDistribution :
                         Array.isArray(finalData.classes) ? finalData.classes :
                         Array.isArray(finalData.distribution) ? finalData.distribution :
                         undefined,
    };
    
    if (import.meta.env.DEV) {
      console.log('Dashboard Stats Final Result:', {
        result,
        revenueDataCount: result.revenueData?.length || 0,
        attendanceTrendCount: result.attendanceTrend?.length || 0,
        classDistributionCount: result.classDistribution?.length || 0,
      });
    }
    
    return result;
  }

  /**
   * Get Students
   */
  async getStudents(params?: GetStudentsRequest): Promise<StudentsResponse> {
    // Build query string
    const queryParams = new URLSearchParams();
    if (params?.class) queryParams.append('class', params.class);
    if (params?.section) queryParams.append('section', params.section);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);

    const endpoint = `${API_ENDPOINTS.admin.students}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const response = await apiClient.get<StudentsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Students API Response:', {
        params,
        response,
        students: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    // Handle different response structures
    const data = response.data as any;
    if (data.students && Array.isArray(data.students)) {
      return data as StudentsResponse;
    }
    if (Array.isArray(data)) {
      return { students: data as Student[] };
    }

    return { students: [] };
  }

  /**
   * Get Student by ID
   */
  async getStudentById(studentId: string): Promise<ApiResponse<Student>> {
    const response = await apiClient.get<Student>(
      `${API_ENDPOINTS.admin.students}/${studentId}`
    );

    if (import.meta.env.DEV) {
      console.log('Get Student by ID API Response:', {
        studentId,
        response,
        student: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Student
   */
  async updateStudent(studentId: string, request: UpdateStudentRequest, classUUID?: string): Promise<ApiResponse<Student>> {
    const headers: Record<string, string> = {};
    if (classUUID) {
      headers['X-Class-UUID'] = classUUID;
    }

    const response = await apiClient.patch<Student>(
      `${API_ENDPOINTS.admin.students}/${studentId}`,
      request,
      {
        headers,
      }
    );

    if (import.meta.env.DEV) {
      console.log('Update Student API Response:', {
        studentId,
        request,
        classUUID,
        response,
        student: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Student
   */
  async deleteStudent(studentId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      `${API_ENDPOINTS.admin.students}/${studentId}`
    );

    if (import.meta.env.DEV) {
      console.log('Delete Student API Response:', {
        studentId,
        response,
      });
    }

    return response;
  }

  /**
   * Get Class by Name/Grade
   */
  async getClassByName(className: string): Promise<ClassInfo> {
    // Extract grade number from className (e.g., "Grade 10" -> 10)
    const gradeMatch = className.match(/Grade\s+(\d+)/i);
    const grade = gradeMatch ? parseInt(gradeMatch[1]) : null;
    
    if (!grade) {
      throw new Error(`Invalid class name format: ${className}`);
    }

    const response = await apiClient.get<ClassInfo | ClassInfo[]>(
      `${API_ENDPOINTS.admin.classes}?grade=${grade}`
    );

    if (import.meta.env.DEV) {
      console.log('Get Class API Response:', {
        className,
        grade,
        response,
        data: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    // Handle different response structures
    let classData: any = null;
    
    // Check if response.data is an array
    if (Array.isArray(response.data)) {
      classData = response.data.length > 0 ? response.data[0] : null;
    } else if (response.data && typeof response.data === 'object') {
      // Check if it's a single object or nested structure
      if (response.data.uuid || response.data.id) {
        classData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        classData = response.data.data.length > 0 ? response.data.data[0] : null;
      } else if (response.data.data && response.data.data.uuid) {
        classData = response.data.data;
      }
    }
    
    if (import.meta.env.DEV) {
      console.log('Class data extracted:', {
        classData,
        hasUUID: !!classData?.uuid,
        hasId: !!classData?.id,
        keys: classData ? Object.keys(classData) : [],
      });
    }
    
    if (!classData) {
      throw new Error(`Class not found for ${className}`);
    }
    
    // Ensure UUID exists - check multiple possible properties
    // Backend might use: uuid, id, classId, _id, etc.
    const classUUID = classData.uuid || classData.id || classData.classId || classData._id;
    
    if (import.meta.env.DEV && !classUUID) {
      console.warn('Class UUID not found, available properties:', {
        classData,
        allKeys: Object.keys(classData),
      });
    }
    
    if (!classUUID) {
      // If UUID is not found, try to use the first available ID field
      const fallbackId = classData.id || classData.classId || classData._id;
      if (fallbackId) {
        if (import.meta.env.DEV) {
          console.warn(`Using fallback ID as UUID for ${className}:`, fallbackId);
        }
        return {
          id: fallbackId,
          uuid: fallbackId, // Use same value for both
          name: classData.name || classData.className || classData.gradeName || className,
          grade: classData.grade || grade || null,
          sections: classData.sections || undefined,
        } as ClassInfo;
      }
      throw new Error(`Class UUID not found for ${className}. Available properties: ${Object.keys(classData).join(', ')}`);
    }

    return {
      id: classData.id || classData.classId || classData._id || classUUID,
      uuid: classUUID,
      name: classData.name || classData.className || classData.gradeName || className,
      grade: classData.grade || grade || null,
      sections: classData.sections || undefined,
    } as ClassInfo;
  }

  /**
   * Get Sections for a Class
   */
  async getSectionsByClass(classId: string): Promise<SectionInfo[]> {
    const response = await apiClient.get<SectionInfo[]>(
      `${API_ENDPOINTS.admin.sections}?classId=${classId}`
    );

    if (import.meta.env.DEV) {
      console.log('Get Sections API Response:', {
        classId,
        response,
        sections: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    // Handle array response
    const sections = Array.isArray(response.data) ? response.data : [];
    return sections;
  }

  /**
   * Add Student
   */
  async addStudent(request: AddStudentRequest, classUUID: string): Promise<ApiResponse<Student>> {
    // Add class UUID to request headers
    const response = await apiClient.post<Student>(
      API_ENDPOINTS.admin.students,
      request,
      {
        headers: {
          'X-Class-UUID': classUUID,
        },
      }
    );

    if (import.meta.env.DEV) {
      console.log('Add Student API Response:', {
        request,
        classUUID,
        response,
        student: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get All Classes
   */
  async getClasses(): Promise<ClassesListResponse> {
    const response = await apiClient.get<ClassResponse[] | ClassesListResponse>(
      API_ENDPOINTS.admin.classes
    );

    if (import.meta.env.DEV) {
      console.log('Get Classes API Response:', {
        response,
        data: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    // Handle different response structures
    if (Array.isArray(response.data)) {
      return { classes: response.data };
    } else if (response.data && typeof response.data === 'object' && 'classes' in response.data) {
      return response.data as ClassesListResponse;
    } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      const data = (response.data as any).data;
      if (Array.isArray(data)) {
        return { classes: data };
      }
    }

    return { classes: [] };
  }

  /**
   * Get Class by ID
   */
  async getClassById(classId: string): Promise<ApiResponse<ClassResponse>> {
    const response = await apiClient.get<ClassResponse>(
      `${API_ENDPOINTS.admin.classes}/${classId}`
    );

    if (import.meta.env.DEV) {
      console.log('Get Class by ID API Response:', {
        classId,
        response,
        class: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Add Class
   */
  async addClass(request: AddClassRequest): Promise<ApiResponse<ClassResponse>> {
    const response = await apiClient.post<ClassResponse>(
      API_ENDPOINTS.admin.addClass,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Add Class API Response:', {
        request,
        response,
        class: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Class
   */
  async updateClass(classId: string, request: UpdateClassRequest): Promise<ApiResponse<ClassResponse>> {
    const response = await apiClient.patch<ClassResponse>(
      `${API_ENDPOINTS.admin.classes}/${classId}`,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Class API Response:', {
        classId,
        request,
        response,
        class: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Class
   */
  async deleteClass(classId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      `${API_ENDPOINTS.admin.classes}/${classId}`
    );

    if (import.meta.env.DEV) {
      console.log('Delete Class API Response:', {
        classId,
        response,
      });
    }

    return response;
  }

  /**
   * Teachers
   */
  async getTeachers(): Promise<TeachersResponse> {
    const response = await apiClient.get<TeachersResponse>(API_ENDPOINTS.admin.teachers);

    if (import.meta.env.DEV) {
      console.log('Get Teachers API Response:', response);
    }

    return response.data || { teachers: [] };
  }

  async getTeacherById(teacherId: string): Promise<ApiResponse<Teacher>> {
    const response = await apiClient.get<Teacher>(`${API_ENDPOINTS.admin.teachers}/${teacherId}`);

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    if (import.meta.env.DEV) {
      console.log('Get Teacher By Id API Response:', { teacherId, response });
    }

    return response;
  }

  async addTeacher(request: AddTeacherRequest): Promise<ApiResponse<Teacher>> {
    const response = await apiClient.post<Teacher>(API_ENDPOINTS.admin.teachers, {
      body: JSON.stringify(request),
    });

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    if (import.meta.env.DEV) {
      console.log('Add Teacher API Response:', { request, response });
    }

    return response;
  }

  async updateTeacher(teacherId: string, request: UpdateTeacherRequest): Promise<ApiResponse<Teacher>> {
    const response = await apiClient.patch<Teacher>(`${API_ENDPOINTS.admin.teachers}/${teacherId}`, {
      body: JSON.stringify(request),
    });

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    if (import.meta.env.DEV) {
      console.log('Update Teacher API Response:', { teacherId, request, response });
    }

    return response;
  }

  async deleteTeacher(teacherId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(`${API_ENDPOINTS.admin.teachers}/${teacherId}`);

    if (import.meta.env.DEV) {
      console.log('Delete Teacher API Response:', { teacherId, response });
    }

    return response;
  }
}

// Export singleton instance
export const adminService = new AdminService();

