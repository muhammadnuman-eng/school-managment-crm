/**
 * Admin Service
 * Handles all admin-related API calls
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS, getApiUrl } from '../config/api.config';
import { tokenStorage, schoolStorage } from '../utils/storage';
import { DashboardStatsResponse } from '../types/dashboard.types';
import { AddStudentRequest, UpdateStudentRequest, GetStudentsRequest, StudentsResponse, Student, ClassInfo, SectionInfo } from '../types/student.types';
import { AddClassRequest, UpdateClassRequest, ClassResponse, ClassesListResponse } from '../types/class.types';
import { Teacher, TeachersResponse, AddTeacherRequest, UpdateTeacherRequest } from '../types/teacher.types';
import { FeeType, FeeTypesResponse, StudentFee, StudentFeesResponse, GetStudentFeesRequest, CreateInvoiceRequest, Expense, ExpensesResponse, CreateExpenseRequest } from '../types/fee.types';
import { AcademicYear, CreateAcademicYearRequest, AcademicYearsResponse } from '../types/academic-year.types';
import { ApiResponse } from '../types/api.types';
import {
  AttendanceRecord,
  CreateAttendanceRequest,
  UpdateAttendanceRequest,
  GetAttendanceRequest,
  AttendanceResponse,
  AttendanceReport,
  LeaveApplication,
  CreateLeaveApplicationRequest,
  UpdateLeaveApplicationRequest,
  GetLeaveApplicationsRequest,
  LeaveApplicationsResponse,
} from '../types/attendance.types';
import {
  Announcement,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
  GetAnnouncementsRequest,
  AnnouncementsResponse,
  Message,
  CreateMessageRequest,
  BulkMessageRequest,
  GetMessagesRequest,
  MessagesResponse,
  UnreadCountResponse,
  CommunicationTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  GetTemplatesRequest,
  TemplatesResponse,
  GetRecipientsRequest,
  RecipientsResponse,
  CommunicationSummary,
} from '../types/communication.types';
import {
  Examination,
  CreateExaminationRequest,
  UpdateExaminationRequest,
  GetExaminationsRequest,
  ExaminationsResponse,
  CreateExamMarksRequest,
  GradeScale,
  CreateGradeScaleRequest,
  GetGradeScalesRequest,
  GradeScalesResponse,
  GradeConfiguration,
  CreateGradeConfigurationRequest,
  GetGradeConfigurationsRequest,
  GradeConfigurationsResponse,
} from '../types/examination.types';
import {
  Bus,
  CreateBusRequest,
  GetBusesRequest,
  BusesResponse,
  Driver,
  CreateDriverRequest,
  DriversResponse,
  TransportRoute,
  CreateTransportRouteRequest,
  GetTransportRoutesRequest,
  TransportRoutesResponse,
  StudentTransport,
  CreateStudentTransportRequest,
  GetStudentTransportsRequest,
  StudentTransportsResponse,
} from '../types/transport.types';
import {
  HostelBuilding,
  CreateHostelBuildingRequest,
  HostelBuildingsResponse,
  HostelRoom,
  CreateHostelRoomRequest,
  UpdateHostelRoomRequest,
  GetHostelRoomsRequest,
  HostelRoomsResponse,
  HostelAllocation,
  CreateHostelAllocationRequest,
  UpdateHostelAllocationRequest,
  GetHostelAllocationsRequest,
  HostelAllocationsResponse,
  HostelComplaint,
  CreateHostelComplaintRequest,
  UpdateHostelComplaintRequest,
  GetHostelComplaintsRequest,
  HostelComplaintsResponse,
  HostelOverview,
} from '../types/hostel.types';
import {
  InventoryCategory,
  CreateInventoryCategoryRequest,
  UpdateInventoryCategoryRequest,
  InventoryCategoriesResponse,
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SuppliersResponse,
  InventoryItem,
  CreateInventoryItemRequest,
  UpdateInventoryItemRequest,
  GetInventoryItemsRequest,
  InventoryItemsResponse,
  InventoryTransaction,
  CreateInventoryTransactionRequest,
  GetInventoryTransactionsRequest,
  InventoryTransactionsResponse,
  InventoryOverview,
} from '../types/inventory.types';

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

    const response = await apiClient.get<any>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Students API Response:', {
        params,
        response,
        responseData: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    // Handle different response structures
    const data = response.data as any;

    // Case 1: Response has { data: [...], meta: {...} } structure (new API format)
    if (data.data && Array.isArray(data.data)) {
      return {
        students: data.data as Student[],
        total: data.meta?.total,
        page: data.meta?.page,
        limit: data.meta?.limit,
      };
    }

    // Case 2: Response has { students: [...] } structure (old format)
    if (data.students && Array.isArray(data.students)) {
      return data as StudentsResponse;
    }

    // Case 3: Response is directly an array
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

    // Convert sectionId to currentSectionId if present (backend expects currentSectionId)
    // Convert className to currentClassId if present (backend expects currentClassId, not className)
    const requestBody: any = { ...request };
    if (requestBody.sectionId) {
      requestBody.currentSectionId = requestBody.sectionId;
      delete requestBody.sectionId;
    }
    
    // IMPORTANT: Backend expects currentClassId (as class name string), not className
    if (requestBody.className) {
      requestBody.currentClassId = requestBody.className.trim();
      delete requestBody.className;
    }

    // Log for debugging
    if (import.meta.env.DEV) {
      console.log('📝 Update Student Request Body Conversion:', {
        originalRequest: request,
        convertedRequestBody: requestBody,
        hasCurrentClassId: !!requestBody.currentClassId,
        currentClassId: requestBody.currentClassId,
        hasCurrentSectionId: !!requestBody.currentSectionId,
        currentSectionId: requestBody.currentSectionId,
        classUUIDHeader: classUUID || 'not provided',
      });
    }

    const response = await apiClient.patch<Student>(
      `${API_ENDPOINTS.admin.students}/${studentId}`,
      requestBody,
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
   * Supports both "Class X" and "Grade X" formats
   */
  async getClassByName(className: string): Promise<ClassInfo> {
    // Extract grade/class number from className
    // Support both "Class X" and "Grade X" formats
    const classMatch = className.match(/(?:Class|Grade)\s+(\d+)/i);
    const grade = classMatch ? parseInt(classMatch[1], 10) : null;

    if (!grade) {
      // If format doesn't match, try to search by name directly
      if (import.meta.env.DEV) {
        console.warn(`Class name format not recognized: ${className}, trying name-based search...`);
      }
      // Try searching by name instead of grade
      // This allows backend to handle class lookup by name
      throw new Error(`Class name format not recognized: ${className}. Please use "Class X" or "Grade X" format.`);
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
  async addStudent(request: AddStudentRequest, classUUID?: string): Promise<ApiResponse<Student>> {
    // Prepare headers - only include X-Class-UUID if provided
    const headers: Record<string, string> = {};
    if (classUUID && classUUID.trim() !== '') {
      headers['X-Class-UUID'] = classUUID;
    }

    // Trim all string fields to ensure no whitespace issues
    const trimmedRequest: AddStudentRequest = {
      firstName: request.firstName?.trim() || '',
      lastName: request.lastName?.trim() || '',
      dateOfBirth: request.dateOfBirth?.trim() || '',
      address: request.address?.trim() || '',
      phone: request.phone?.trim() || '',
      currentSectionId: request.currentSectionId?.trim() || '',
      parentPhone: request.parentPhone?.trim() || undefined,
      className: request.className?.trim() || undefined,
      classId: request.classId?.trim() || undefined,
    };

    // Validate all required fields are present and not empty
    const missingFields: string[] = [];
    if (!trimmedRequest.firstName) missingFields.push('firstName');
    if (!trimmedRequest.lastName) missingFields.push('lastName');
    if (!trimmedRequest.dateOfBirth) missingFields.push('dateOfBirth');
    if (!trimmedRequest.address) missingFields.push('address');
    if (!trimmedRequest.phone) missingFields.push('phone');
    if (!trimmedRequest.currentSectionId) missingFields.push('currentSectionId');

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // IMPORTANT: Backend expects currentClassId (as class name string), not className
    // Convert className to currentClassId for backend compatibility
    const classNameValue = trimmedRequest.className?.trim() || '';
    const requestBody: any = {
      ...trimmedRequest,
      // Backend expects currentClassId (class name string like "Class 3"), not className
      currentClassId: classNameValue || undefined,
      // Remove className from request body (backend doesn't use it)
      className: undefined,
    };

    // Validate that currentClassId is present when currentSectionId is provided
    if (requestBody.currentSectionId && (!requestBody.currentClassId || requestBody.currentClassId.trim() === '')) {
      throw new Error('Class is required when section is provided. Please select a class.');
    }

    // Log for debugging
    if (import.meta.env.DEV) {
      console.log('📝 Add Student Request Body Conversion:', {
        originalClassName: trimmedRequest.className,
        convertedCurrentClassId: requestBody.currentClassId,
        currentSectionId: requestBody.currentSectionId,
        hasCurrentClassId: !!requestBody.currentClassId,
        hasCurrentSectionId: !!requestBody.currentSectionId,
      });
    }

    if (import.meta.env.DEV) {
      console.log('🚀 Add Student API Call:', {
        endpoint: API_ENDPOINTS.admin.students,
        requestBody: {
          ...requestBody,
          currentClassId: requestBody.currentClassId,
          classId: requestBody.classId || 'not provided',
        },
        classUUIDHeader: classUUID || 'not provided',
        hasCurrentClassId: !!requestBody.currentClassId,
        currentClassId: requestBody.currentClassId,
        currentClassIdLength: requestBody.currentClassId?.length || 0,
        headers: Object.keys(headers).length > 0 ? headers : 'no headers',
        fullPayload: JSON.stringify(requestBody, null, 2),
      });
    }

    const response = await apiClient.post<Student>(
      API_ENDPOINTS.admin.students,
      requestBody,
      Object.keys(headers).length > 0 ? { headers } : undefined
    );

    if (import.meta.env.DEV) {
      console.log('✅ Add Student API Response:', {
        success: !!response.data,
        student: response.data,
        studentClass: response.data?.class || response.data?.className || 'not found',
        responseStructure: response,
      });
    }

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
   * Academic Years
   */
  async getAcademicYears(): Promise<AcademicYearsResponse> {
    const response = await apiClient.get<AcademicYear[] | AcademicYearsResponse>(
      API_ENDPOINTS.admin.academicYears
    );

    if (import.meta.env.DEV) {
      console.log('Get Academic Years API Response:', {
        response,
        data: response.data,
      });
    }

    if (!response.data) {
      return { academicYears: [] };
    }

    // Handle different response structures
    if (Array.isArray(response.data)) {
      return { academicYears: response.data };
    } else if (response.data && typeof response.data === 'object' && 'academicYears' in response.data) {
      return response.data as AcademicYearsResponse;
    } else if (response.data && typeof response.data === 'object' && 'data' in response.data) {
      const data = (response.data as any).data;
      if (Array.isArray(data)) {
        return { academicYears: data };
      }
    }

    return { academicYears: [] };
  }

  async createAcademicYear(request: CreateAcademicYearRequest): Promise<ApiResponse<AcademicYear>> {
    // Get schoolId from storage
    const schoolId = schoolStorage.getSchoolId();
    if (schoolId) {
      request.schoolId = schoolId;
    }

    if (import.meta.env.DEV) {
      console.log('Create Academic Year Request:', {
        request,
        schoolId,
      });
    }

    const response = await apiClient.post<AcademicYear>(
      API_ENDPOINTS.admin.academicYears,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Academic Year API Response:', {
        request,
        response,
        academicYear: response.data,
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Teachers
   */
  async getTeachers(): Promise<TeachersResponse> {
    const response = await apiClient.get<TeachersResponse>(API_ENDPOINTS.admin.teachers);

    if (import.meta.env.DEV) {
      console.log('Get Teachers API Response:', {
        fullResponse: response,
        responseData: response.data,
        responseDataType: typeof response.data,
        isArray: Array.isArray(response.data),
        keys: response.data ? Object.keys(response.data) : [],
        teachersProperty: (response.data as any)?.teachers,
        teachersIsArray: Array.isArray((response.data as any)?.teachers),
      });
    }

    // Handle different response structures
    if (!response.data) {
      return { teachers: [] };
    }

    // If response.data is directly an array
    if (Array.isArray(response.data)) {
      return { teachers: response.data };
    }

    // If response.data has teachers property
    if ((response.data as any).teachers && Array.isArray((response.data as any).teachers)) {
      return { teachers: (response.data as any).teachers };
    }

    // If response.data is an object but no teachers property, return as is
    return response.data as TeachersResponse;
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
    // Log request data in development
    if (import.meta.env.DEV) {
      console.log('Add Teacher Request:', {
        request,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        schoolId: request.schoolId,
        allFields: request,
      });
    }

    // apiClient.post automatically stringifies the data, so pass it directly
    const response = await apiClient.post<Teacher>(API_ENDPOINTS.admin.teachers, request);

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    if (import.meta.env.DEV) {
      console.log('Add Teacher API Response:', { request, response });
    }

    return response;
  }

  async updateTeacher(teacherId: string, request: UpdateTeacherRequest): Promise<ApiResponse<Teacher>> {
    // Log request data in development
    if (import.meta.env.DEV) {
      console.log('Update Teacher Request:', {
        teacherId,
        request,
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        allFields: request,
      });
    }

    // apiClient.patch automatically stringifies the data, so pass it directly
    const response = await apiClient.patch<Teacher>(`${API_ENDPOINTS.admin.teachers}/${teacherId}`, request);

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

  /**
   * Get Fee Types
   */
  async getFeeTypes(): Promise<FeeTypesResponse> {
    const response = await apiClient.get<FeeTypesResponse>(API_ENDPOINTS.admin.feeTypes);

    if (import.meta.env.DEV) {
      console.log('Get Fee Types API Response:', {
        response,
        data: response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    // Handle different response structures
    const responseData = response.data as any;

    // Check if feeTypes is directly in data or nested
    let feeTypesArray: FeeType[] = [];

    if (Array.isArray(responseData)) {
      // Response is directly an array
      feeTypesArray = responseData;
    } else if (responseData.feeTypes && Array.isArray(responseData.feeTypes)) {
      // Response has feeTypes property
      feeTypesArray = responseData.feeTypes;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      // Response has nested data property
      feeTypesArray = responseData.data;
    } else if (responseData.feeTypesList && Array.isArray(responseData.feeTypesList)) {
      // Alternative property name
      feeTypesArray = responseData.feeTypesList;
    }

    if (import.meta.env.DEV) {
      console.log('Fee Types Extracted:', {
        feeTypesArray,
        count: feeTypesArray.length,
        sample: feeTypesArray[0],
      });
    }

    return {
      feeTypes: feeTypesArray,
    };
  }

  /**
   * Get Student Fees
   */
  async getStudentFees(params?: GetStudentFeesRequest): Promise<StudentFeesResponse> {
    let url = API_ENDPOINTS.admin.studentFees;

    // Build query string if params provided
    if (params) {
      const queryParams = new URLSearchParams();
      if (params.class) queryParams.append('class', params.class);
      if (params.status) queryParams.append('status', params.status);
      if (params.studentId) queryParams.append('studentId', params.studentId);
      if (params.feeTypeId) queryParams.append('feeTypeId', params.feeTypeId);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);

      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await apiClient.get<any>(url);

    if (import.meta.env.DEV) {
      console.log('Get Student Fees API Request:', { url, params });
      console.log('Get Student Fees API Response (Raw):', { 
        response, 
        responseKeys: response ? Object.keys(response) : [],
        data: response.data,
        dataType: typeof response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        hasData: !!response.data?.data,
        hasStudentFees: !!response.data?.studentFees,
        dataLength: response.data?.data?.length,
        studentFeesLength: response.data?.studentFees?.length,
        isArray: Array.isArray(response.data),
        fullResponseString: JSON.stringify(response, null, 2),
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    // Normalize backend response to frontend format
    // Backend returns: { data: [...], meta: {...} }
    // apiClient.handleResponse extracts data.data if exists, else returns data
    // So response.data could be:
    //   - The array directly: [...]
    //   - Or the object: { data: [...], meta: {...} }
    let rawFees: any[] = [];
    
    if (Array.isArray(response.data)) {
      // response.data is already the array
      rawFees = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      // response.data is { data: [...], meta: {...} }
      rawFees = response.data.data;
    } else if (response.data?.studentFees && Array.isArray(response.data.studentFees)) {
      // Alternative structure
      rawFees = response.data.studentFees;
    }
    
    if (import.meta.env.DEV) {
      console.log('Raw fees extracted:', {
        hasData: !!response.data?.data,
        hasStudentFees: !!response.data?.studentFees,
        dataLength: response.data?.data?.length,
        studentFeesLength: response.data?.studentFees?.length,
        rawFeesLength: rawFees.length,
        rawFees: rawFees,
        fullResponse: response.data,
      });
    }
    const normalizedFees: StudentFee[] = rawFees.map((fee: any) => {
      // Extract student name from nested structure (backend returns fee.student.name or fee.student.user)
      const studentName = fee.student?.name 
        || (fee.student?.user 
          ? `${fee.student.user.firstName || ''} ${fee.student.user.lastName || ''}`.trim()
          : null)
        || fee.studentName 
        || 'Unknown Student';

      // Extract roll number
      const rollNo = fee.student?.studentId || fee.student?.admissionNumber || fee.student?.rollNumber || fee.rollNo;

      // Extract class name (backend returns fee.class directly)
      const className = fee.class || 
        (fee.student?.currentClass?.className 
          ? `${fee.student.currentClass.className}${fee.student.currentSection?.sectionName || ''}`
          : 'N/A');

      // Get feeTypeId and feeTypeName from backend response
      const feeTypeId = fee.feeTypeId || '';
      const feeTypeName = fee.feeTypeName || 
        (() => {
          const feeTypeMapping: Record<string, string> = {
            'tuition-fee': 'Tuition Fee',
            'academic-fee': 'Academic Fee',
            'transport-fee': 'Transport Fee',
            'hostel-fee': 'Hostel Fee',
            'library-fee': 'Library Fee',
            'lab-fee': 'Lab Fee',
            'sports-fee': 'Sports Fee',
            'examination-fee': 'Examination Fee',
            'admission-fee': 'Admission Fee',
            'registration-fee': 'Registration Fee',
          };
          return feeTypeMapping[feeTypeId.toLowerCase()] || feeTypeId || 'Unknown Fee Type';
        })();

      // Convert status from backend format to frontend format
      const statusMap: Record<string, 'Paid' | 'Partial' | 'Pending'> = {
        'PAID': 'Paid',
        'PARTIAL': 'Partial',
        'PENDING': 'Pending',
      };
      const normalizedStatus = statusMap[fee.status?.toUpperCase()] || 'Pending';

      // Extract payment date (backend returns fee.paymentDate directly)
      const paidDate = fee.paymentDate || null;
      const paidTime = paidDate 
        ? new Date(paidDate).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
        : null;

      // Format dates
      const createdAt = fee.createdAt ? new Date(fee.createdAt).toISOString().split('T')[0] : null;
      const createdTime = fee.createdAt 
        ? new Date(fee.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
        : null;

      return {
        id: fee.id,
        studentId: fee.studentId || fee.student?.id,
        studentName,
        rollNo,
        class: className,
        section: fee.student?.currentSection?.sectionName,
        feeTypeId,
        feeTypeName,
        totalAmount: typeof fee.totalAmount === 'string' ? parseFloat(fee.totalAmount) : (fee.totalAmount || 0),
        paidAmount: typeof fee.paidAmount === 'string' ? parseFloat(fee.paidAmount) : (fee.paidAmount || 0),
        dueAmount: typeof fee.dueAmount === 'string' ? parseFloat(fee.dueAmount) : (fee.dueAmount || 0),
        status: normalizedStatus,
        dueDate: fee.dueDate ? new Date(fee.dueDate).toISOString().split('T')[0] : undefined,
        paidDate: paidDate ? new Date(paidDate).toISOString().split('T')[0] : undefined,
        paidTime,
        createdAt,
        createdTime,
      };
    });

    // Extract meta from response (could be in response.data.meta or response.meta)
    const meta = (Array.isArray(response.data) ? null : response.data?.meta) || response.meta || {};
    
    const normalizedResponse: StudentFeesResponse = {
      studentFees: normalizedFees,
      total: meta.total || normalizedFees.length,
      totalAmount: meta.totalAmount,
      totalPaid: meta.totalPaid,
      totalDue: meta.totalDue,
    };

    if (import.meta.env.DEV) {
      console.log('Get Student Fees API Response (Normalized):', { 
        rawCount: rawFees.length, 
        normalizedCount: normalizedFees.length,
        normalizedResponse,
        firstFee: normalizedFees[0],
      });
    }

    return normalizedResponse;
  }

  /**
   * Create Invoice (Student Fee)
   */
  async createInvoice(request: CreateInvoiceRequest): Promise<ApiResponse<StudentFee>> {
    const response = await apiClient.post<StudentFee>(
      API_ENDPOINTS.admin.studentFees,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Invoice API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Expenses
   */
  async getExpenses(): Promise<ExpensesResponse> {
    const response = await apiClient.get<any>(API_ENDPOINTS.admin.expenses);

    if (import.meta.env.DEV) {
      console.log('Get Expenses API Response (Raw):', { 
        response, 
        data: response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        isArray: Array.isArray(response.data),
      });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    // Normalize backend response to frontend format
    // Backend returns: { data: [...], meta: {...} }
    // apiClient.handleResponse extracts data.data if exists, else returns data
    let rawExpenses: any[] = [];
    
    if (Array.isArray(response.data)) {
      // response.data is already the array
      rawExpenses = response.data;
    } else if (response.data?.data && Array.isArray(response.data.data)) {
      // response.data is { data: [...], meta: {...} }
      rawExpenses = response.data.data;
    }

    const normalizedExpenses: Expense[] = rawExpenses.map((expense: any) => {
      // Backend returns expenseDate, frontend expects date
      const expenseDate = expense.expenseDate || expense.date;
      const dateStr = expenseDate ? new Date(expenseDate).toISOString().split('T')[0] : '';
      const timeStr = expenseDate 
        ? new Date(expenseDate).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
        : undefined;

      // Convert status from backend format to frontend format
      const statusMap: Record<string, 'Paid' | 'Pending' | 'Approved'> = {
        'PAID': 'Paid',
        'APPROVED': 'Approved',
        'PENDING': 'Pending',
      };
      const normalizedStatus = statusMap[expense.status?.toUpperCase()] || 'Pending';

      return {
        id: expense.id,
        category: expense.category,
        description: expense.description || '',
        amount: typeof expense.amount === 'string' ? parseFloat(expense.amount) : (expense.amount || 0),
        date: dateStr,
        time: timeStr,
        status: normalizedStatus,
        paymentMethod: expense.paymentMethod,
        approvedBy: expense.approvedBy || undefined,
        createdAt: expense.createdAt ? new Date(expense.createdAt).toISOString().split('T')[0] : undefined,
        createdTime: expense.createdAt 
          ? new Date(expense.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })
          : undefined,
      };
    });

    // Extract meta from response
    const meta = (Array.isArray(response.data) ? null : response.data?.meta) || response.meta || {};

    const normalizedResponse: ExpensesResponse = {
      expenses: normalizedExpenses,
      total: meta.total || normalizedExpenses.length,
      totalPaid: meta.totalPaid,
      totalPending: meta.totalPending,
    };

    if (import.meta.env.DEV) {
      console.log('Get Expenses API Response (Normalized):', { 
        rawCount: rawExpenses.length, 
        normalizedCount: normalizedExpenses.length,
        normalizedResponse,
        firstExpense: normalizedExpenses[0],
      });
    }

    return normalizedResponse;
  }

  /**
   * Create Expense
   */
  async createExpense(request: CreateExpenseRequest): Promise<ApiResponse<Expense>> {
    // Transform frontend request to backend DTO format
    // Backend expects: { schoolId?, category, amount, description?, expenseDate, approvedBy? }
    // Frontend sends: { category, description, amount, date, time?, paymentMethod?, status?, approvedBy? }
    // schoolId will be injected by backend from @CurrentSchool() decorator (from x-school-uuid header)
    const backendPayload: any = {
      category: request.category, // Already uppercase from frontend (SALARIES, UTILITIES, etc.)
      description: request.description,
      amount: request.amount, // Number (already validated and rounded in component)
      expenseDate: request.date, // Backend expects expenseDate (ISO 8601 format)
      // schoolId: Not included - will be injected by backend from @CurrentSchool() decorator (x-school-uuid header)
      // approvedBy will be handled below if provided (must be UUID)
    };

    // Only include approvedBy if it's a valid UUID
    if (request.approvedBy) {
      // Check if it's a UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(request.approvedBy)) {
        backendPayload.approvedBy = request.approvedBy;
      }
      // If not UUID, don't include it (approvedBy is optional)
    }

    if (import.meta.env.DEV) {
      console.log('Create Expense - Frontend Request:', request);
      console.log('Create Expense - Backend Payload:', backendPayload);
    }

    const response = await apiClient.post<Expense>(
      API_ENDPOINTS.admin.expenses,
      backendPayload
    );

    if (import.meta.env.DEV) {
      console.log('Create Expense API Response:', { request, backendPayload, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Expense
   */
  async updateExpense(expenseId: string, request: Partial<CreateExpenseRequest>): Promise<ApiResponse<Expense>> {
    const response = await apiClient.patch<Expense>(
      API_ENDPOINTS.admin.fees.expenses.getById(expenseId),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Expense API Response:', { expenseId, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Expense
   */
  async deleteExpense(expenseId: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.fees.expenses.getById(expenseId)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Expense API Response:', { expenseId, response });
    }

    return response;
  }

  /**
   * Get Fee Overview
   */
  async getFeeOverview(academicYearId?: string, startDate?: string, endDate?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (academicYearId) queryParams.append('academicYearId', academicYearId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const endpoint = `${API_ENDPOINTS.admin.fees.overview}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<any>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Fee Overview API Response:', response);
    }

    return response.data || {};
  }

  /**
   * Get Expense Overview
   */
  async getExpenseOverview(startDate?: string, endDate?: string): Promise<any> {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const endpoint = `${API_ENDPOINTS.admin.fees.expenses.overview}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<any>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Expense Overview API Response:', response);
    }

    return response.data || {};
  }

  // ==================== ATTENDANCE APIs ====================

  /**
   * Create Attendance Record
   */
  async createAttendance(request: CreateAttendanceRequest): Promise<ApiResponse<AttendanceRecord>> {
    const response = await apiClient.post<AttendanceRecord>(
      API_ENDPOINTS.admin.attendance.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Attendance API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Attendance Records
   */
  async getAttendance(params?: GetAttendanceRequest): Promise<AttendanceResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.schoolId) queryParams.append('schoolId', params.schoolId);
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.classId) queryParams.append('classId', params.classId);
    if (params?.sectionId) queryParams.append('sectionId', params.sectionId);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `${API_ENDPOINTS.admin.attendance.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<AttendanceResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Attendance API Response:', { params, response });
    }

    if (!response.data) {
      return { attendances: [] };
    }

    return response.data;
  }

  /**
   * Get Attendance Report
   */
  async getAttendanceReport(classId?: string, sectionId?: string, startDate?: string, endDate?: string): Promise<AttendanceReport> {
    const queryParams = new URLSearchParams();
    if (classId) queryParams.append('classId', classId);
    if (sectionId) queryParams.append('sectionId', sectionId);
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const endpoint = `${API_ENDPOINTS.admin.attendance.report}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<AttendanceReport>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Attendance Report API Response:', response);
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response.data;
  }

  /**
   * Get Single Attendance Record
   */
  async getAttendanceById(id: string): Promise<ApiResponse<AttendanceRecord>> {
    const response = await apiClient.get<AttendanceRecord>(
      API_ENDPOINTS.admin.attendance.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Attendance by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Attendance Record
   */
  async updateAttendance(id: string, request: UpdateAttendanceRequest): Promise<ApiResponse<AttendanceRecord>> {
    const response = await apiClient.patch<AttendanceRecord>(
      API_ENDPOINTS.admin.attendance.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Attendance API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Attendance Record
   */
  async deleteAttendance(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.attendance.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Attendance API Response:', { id, response });
    }

    return response;
  }

  /**
   * Create Leave Application
   */
  async createLeaveApplication(request: CreateLeaveApplicationRequest): Promise<ApiResponse<LeaveApplication>> {
    const response = await apiClient.post<LeaveApplication>(
      API_ENDPOINTS.admin.attendance.leaveApplications,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Leave Application API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Leave Applications
   */
  async getLeaveApplications(params?: GetLeaveApplicationsRequest): Promise<LeaveApplicationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.studentId) queryParams.append('studentId', params.studentId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `${API_ENDPOINTS.admin.attendance.leaveApplications}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<LeaveApplicationsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Leave Applications API Response:', { params, response });
    }

    if (!response.data) {
      return { leaveApplications: [] };
    }

    return response.data;
  }

  /**
   * Get Single Leave Application
   */
  async getLeaveApplicationById(id: string): Promise<ApiResponse<LeaveApplication>> {
    const response = await apiClient.get<LeaveApplication>(
      API_ENDPOINTS.admin.attendance.leaveApplicationById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Leave Application by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Leave Application
   */
  async updateLeaveApplication(id: string, request: UpdateLeaveApplicationRequest): Promise<ApiResponse<LeaveApplication>> {
    const response = await apiClient.patch<LeaveApplication>(
      API_ENDPOINTS.admin.attendance.leaveApplicationById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Leave Application API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Leave Application
   */
  async deleteLeaveApplication(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.attendance.leaveApplicationById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Leave Application API Response:', { id, response });
    }

    return response;
  }

  // ==================== REPORT DOWNLOAD APIs ====================

  /**
   * Download Fee Report (CSV or JSON)
   */
  async downloadFeeReport(format: 'csv' | 'json' = 'json'): Promise<void> {
    const url = `${API_ENDPOINTS.admin.fees.studentFees.reportDownload(format)}`;
    const response = await fetch(getApiUrl(url), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        'x-school-uuid': schoolStorage.getSchoolId() || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download fee report');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `fee-report-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Download Expense Report (CSV or JSON)
   */
  async downloadExpenseReport(format: 'csv' | 'json' = 'json'): Promise<void> {
    const url = `${API_ENDPOINTS.admin.fees.expenses.reportDownload(format)}`;
    const response = await fetch(getApiUrl(url), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenStorage.getAccessToken()}`,
        'x-school-uuid': schoolStorage.getSchoolId() || '',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download expense report');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `expense-report-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // ==================== COMMUNICATION APIs ====================

  /**
   * Create Announcement
   */
  async createAnnouncement(request: CreateAnnouncementRequest): Promise<ApiResponse<Announcement>> {
    const response = await apiClient.post<Announcement>(
      API_ENDPOINTS.admin.communication.announcements.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Announcement API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Announcements
   */
  async getAnnouncements(params?: GetAnnouncementsRequest): Promise<AnnouncementsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.targetAudience) queryParams.append('targetAudience', params.targetAudience);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `${API_ENDPOINTS.admin.communication.announcements.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<AnnouncementsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Announcements API Response:', { params, response });
    }

    if (!response.data) {
      return { announcements: [] };
    }

    return response.data;
  }

  /**
   * Get Single Announcement
   */
  async getAnnouncementById(id: string): Promise<ApiResponse<Announcement>> {
    const response = await apiClient.get<Announcement>(
      API_ENDPOINTS.admin.communication.announcements.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Announcement by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Announcement
   */
  async updateAnnouncement(id: string, request: UpdateAnnouncementRequest): Promise<ApiResponse<Announcement>> {
    const response = await apiClient.patch<Announcement>(
      API_ENDPOINTS.admin.communication.announcements.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Announcement API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Announcement
   */
  async deleteAnnouncement(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.communication.announcements.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Announcement API Response:', { id, response });
    }

    return response;
  }

  /**
   * Get Sent Announcements
   */
  async getSentAnnouncements(search?: string, category?: string, page?: number, limit?: number): Promise<AnnouncementsResponse> {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (category) queryParams.append('category', category);
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());

    const endpoint = `${API_ENDPOINTS.admin.communication.announcements.sent}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<AnnouncementsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Sent Announcements API Response:', response);
    }

    if (!response.data) {
      return { announcements: [] };
    }

    return response.data;
  }

  /**
   * Create Message
   */
  async createMessage(request: CreateMessageRequest): Promise<ApiResponse<Message>> {
    const response = await apiClient.post<Message>(
      API_ENDPOINTS.admin.communication.messages.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Message API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Messages
   */
  async getMessages(params?: GetMessagesRequest): Promise<MessagesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.senderId) queryParams.append('senderId', params.senderId);
    if (params?.recipientId) queryParams.append('recipientId', params.recipientId);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.isRead !== undefined) queryParams.append('isRead', params.isRead.toString());
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `${API_ENDPOINTS.admin.communication.messages.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    // Use apiClient.get but we need to access raw response to preserve meta
    // apiClient.get extracts data.data, losing meta, so we'll make a direct fetch
    const url = getApiUrl(endpoint);
    const token = tokenStorage.getAccessToken();
    const schoolId = schoolStorage.getSchoolId();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (schoolId) {
      headers['X-School-UUID'] = schoolId;
    }
    
    try {
      const fetchResponse = await fetch(url, { headers });
      
      if (!fetchResponse.ok) {
        if (fetchResponse.status === 401) {
          throw new Error('Unauthorized - Please login again');
        }
        const errorData = await fetchResponse.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${fetchResponse.status}`);
      }
      
      const rawResponse = await fetchResponse.json();
    
    if (import.meta.env.DEV) {
      console.log('Get Messages Raw API Response:', { params, rawResponse });
    }

    // Backend returns { data: [...], meta: {...} }
    if (!rawResponse || !rawResponse.data || !Array.isArray(rawResponse.data)) {
      return { messages: [] };
    }
    
    // Transform messages: backend has sender/recipient objects, frontend expects senderName/recipientName strings
    const transformedMessages = rawResponse.data.map((msg: any) => ({
      id: msg.id,
      schoolId: msg.schoolId,
      senderId: msg.senderId,
      senderName: msg.sender ? `${msg.sender.firstName || ''} ${msg.sender.lastName || ''}`.trim() : undefined,
      recipientId: msg.recipientId,
      recipientName: msg.recipient ? `${msg.recipient.firstName || ''} ${msg.recipient.lastName || ''}`.trim() : undefined,
      subject: msg.subject,
      content: msg.content,
      priority: msg.priority,
      isRead: msg.readAt !== null && msg.readAt !== undefined, // If readAt exists, message is read
      createdAt: msg.createdAt,
      updatedAt: msg.updatedAt,
    }));

      return {
        messages: transformedMessages,
        total: rawResponse.meta?.total || transformedMessages.length,
        page: rawResponse.meta?.page || 1,
        limit: rawResponse.meta?.limit || transformedMessages.length,
      };
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  /**
   * Get Single Message
   */
  async getMessageById(id: string): Promise<ApiResponse<Message>> {
    const response = await apiClient.get<Message>(
      API_ENDPOINTS.admin.communication.messages.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Message by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Mark Message as Read
   */
  async markMessageAsRead(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.patch<void>(
      API_ENDPOINTS.admin.communication.messages.markRead(id),
      {}
    );

    if (import.meta.env.DEV) {
      console.log('Mark Message as Read API Response:', { id, response });
    }

    return response;
  }

  /**
   * Delete Message
   */
  async deleteMessage(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.communication.messages.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Message API Response:', { id, response });
    }

    return response;
  }

  /**
   * Get Unread Messages Count
   */
  async getUnreadMessagesCount(): Promise<UnreadCountResponse> {
    const response = await apiClient.get<UnreadCountResponse>(
      API_ENDPOINTS.admin.communication.messages.unreadCount
    );

    if (import.meta.env.DEV) {
      console.log('Get Unread Messages Count API Response:', response);
    }

    if (!response.data) {
      return { count: 0 };
    }

    return response.data;
  }

  /**
   * Get Sent Messages
   */
  async getSentMessages(search?: string, recipientId?: string, page?: number, limit?: number): Promise<MessagesResponse> {
    const queryParams = new URLSearchParams();
    if (search) queryParams.append('search', search);
    if (recipientId) queryParams.append('recipientId', recipientId);
    if (page) queryParams.append('page', page.toString());
    if (limit) queryParams.append('limit', limit.toString());

    const endpoint = `${API_ENDPOINTS.admin.communication.messages.sent}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<MessagesResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Sent Messages API Response:', response);
    }

    if (!response.data) {
      return { messages: [] };
    }

    return response.data;
  }

  /**
   * Send Bulk Messages
   */
  async sendBulkMessages(request: BulkMessageRequest): Promise<ApiResponse<Message[]>> {
    const response = await apiClient.post<Message[]>(
      API_ENDPOINTS.admin.communication.messages.bulk,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Send Bulk Messages API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Create Communication Template
   */
  async createTemplate(request: CreateTemplateRequest): Promise<ApiResponse<CommunicationTemplate>> {
    const response = await apiClient.post<CommunicationTemplate>(
      API_ENDPOINTS.admin.communication.templates.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Template API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Templates
   */
  async getTemplates(templateType?: string): Promise<TemplatesResponse> {
    const queryParams = new URLSearchParams();
    if (templateType) queryParams.append('templateType', templateType);

    const endpoint = `${API_ENDPOINTS.admin.communication.templates.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<TemplatesResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Templates API Response:', response);
    }

    if (!response.data) {
      return { templates: [] };
    }

    return response.data;
  }

  /**
   * Get Single Template
   */
  async getTemplateById(id: string): Promise<ApiResponse<CommunicationTemplate>> {
    const response = await apiClient.get<CommunicationTemplate>(
      API_ENDPOINTS.admin.communication.templates.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Template by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Template
   */
  async updateTemplate(id: string, request: UpdateTemplateRequest): Promise<ApiResponse<CommunicationTemplate>> {
    const response = await apiClient.patch<CommunicationTemplate>(
      API_ENDPOINTS.admin.communication.templates.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Template API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Template
   */
  async deleteTemplate(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.communication.templates.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Template API Response:', { id, response });
    }

    return response;
  }

  /**
   * Get Recipients
   */
  async getRecipients(params: GetRecipientsRequest): Promise<RecipientsResponse> {
    const queryParams = new URLSearchParams();
    queryParams.append('role', params.role);
    if (params.classId) queryParams.append('classId', params.classId);
    if (params.sectionId) queryParams.append('sectionId', params.sectionId);

    const endpoint = `${API_ENDPOINTS.admin.communication.recipients}?${queryParams.toString()}`;
    const response = await apiClient.get<any>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Recipients API Response:', { params, response });
    }

    if (!response.data || !response.data.recipients) {
      return { recipients: [] };
    }

    // Backend returns userId, frontend expects id - transform the response
    const transformedRecipients = response.data.recipients.map((r: any) => ({
      id: r.userId || r.id, // Map userId to id
      name: r.name,
      email: r.email,
      phone: r.phone,
      role: r.role,
    }));

    return { recipients: transformedRecipients };
  }

  /**
   * Get Communication Summary
   */
  async getCommunicationSummary(): Promise<CommunicationSummary> {
    const response = await apiClient.get<CommunicationSummary>(
      API_ENDPOINTS.admin.communication.summary
    );

    if (import.meta.env.DEV) {
      console.log('Get Communication Summary API Response:', response);
    }

    if (!response.data) {
      return {
        totalMessages: 0,
        unreadMessages: 0,
        totalAnnouncements: 0,
        recentAnnouncements: 0,
        totalTemplates: 0,
      };
    }

    return response.data;
  }

  // ==================== EXAMINATIONS APIs ====================

  /**
   * Create Examination
   */
  async createExamination(request: CreateExaminationRequest): Promise<ApiResponse<Examination>> {
    // Clean up the request - remove undefined values and ensure proper formatting
    const cleanedRequest: any = {
      schoolId: request.schoolId,
      examName: request.examName,
      examType: request.examType,
      academicYearId: request.academicYearId,
      createdBy: request.createdBy,
    };
    
    // Add optional fields only if they have values
    if (request.description) {
      cleanedRequest.description = request.description;
    }
    if (request.startDate) {
      cleanedRequest.startDate = request.startDate;
    }
    if (request.endDate) {
      cleanedRequest.endDate = request.endDate;
    }
    if (request.durationMinutes) {
      cleanedRequest.durationMinutes = request.durationMinutes;
    }
    
    // Clean examClasses - remove undefined sectionName
    if (request.examClasses && request.examClasses.length > 0) {
      cleanedRequest.examClasses = request.examClasses.map(ec => {
        const cleaned: any = { classId: ec.classId };
        if (ec.sectionName) {
          cleaned.sectionName = ec.sectionName;
        }
        return cleaned;
      });
    }
    
    // Clean examSubjects
    if (request.examSubjects && request.examSubjects.length > 0) {
      cleanedRequest.examSubjects = request.examSubjects.map(es => {
        const cleaned: any = {
          subjectName: es.subjectName,
          totalMarks: es.totalMarks,
        };
        if (es.passingMarks !== undefined) {
          cleaned.passingMarks = es.passingMarks;
        }
        if (es.weightage !== undefined) {
          cleaned.weightage = es.weightage;
        }
        return cleaned;
      });
    }
    
    // Clean examSchedules - ensure proper format
    if (request.examSchedules && request.examSchedules.length > 0) {
      cleanedRequest.examSchedules = request.examSchedules.map(schedule => {
        // Validate and clean each field
        const cleaned: any = {
          classId: schedule.classId?.trim(),
          subjectName: schedule.subjectName?.trim(),
          examDate: schedule.examDate?.trim(),
          startTime: schedule.startTime?.trim(),
          endTime: schedule.endTime?.trim(),
        };
        
        // Validate required fields
        if (!cleaned.classId) {
          throw new Error('Class ID is required for exam schedule');
        }
        if (!cleaned.subjectName) {
          throw new Error('Subject name is required for exam schedule');
        }
        if (!cleaned.examDate) {
          throw new Error('Exam date is required for exam schedule');
        }
        if (!cleaned.startTime) {
          throw new Error('Start time is required for exam schedule');
        }
        if (!cleaned.endTime) {
          throw new Error('End time is required for exam schedule');
        }
        
        // Validate time format (should be HH:mm)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(cleaned.startTime)) {
          throw new Error(`Invalid start time format: ${cleaned.startTime}. Expected HH:mm format (e.g., "10:00")`);
        }
        if (!timeRegex.test(cleaned.endTime)) {
          throw new Error(`Invalid end time format: ${cleaned.endTime}. Expected HH:mm format (e.g., "11:00")`);
        }
        
        // Validate date format (should be YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(cleaned.examDate)) {
          throw new Error(`Invalid exam date format: ${cleaned.examDate}. Expected YYYY-MM-DD format`);
        }
        
        // Only include sectionName if it has a value
        if (schedule.sectionName && schedule.sectionName.trim()) {
          cleaned.sectionName = schedule.sectionName.trim();
        }
        // Only include roomNumber if it has a value
        if (schedule.roomNumber && schedule.roomNumber.trim()) {
          cleaned.roomNumber = schedule.roomNumber.trim();
        }
        
        return cleaned;
      });
    }

    if (import.meta.env.DEV) {
      console.log('Create Examination Request (cleaned):', cleanedRequest);
    }

    try {
      const response = await apiClient.post<Examination>(
        API_ENDPOINTS.admin.examinations.base,
        cleanedRequest
      );

      if (import.meta.env.DEV) {
        console.log('Create Examination API Response:', { request: cleanedRequest, response });
      }

      if (!response.data) {
        throw new Error('Invalid response from server: No data received');
      }

      return response;
    } catch (error: any) {
      // Enhanced error logging for debugging
      if (import.meta.env.DEV) {
        console.error('Create Examination API Error:', {
          error,
          errorType: error?.constructor?.name,
          message: error?.message,
          statusCode: error?.statusCode,
          code: error?.code,
          details: error?.details,
          originalData: error?.details?.originalData,
          response: error?.response,
          data: error?.data,
          request: cleanedRequest,
        });
      }
      throw error;
    }
  }

  /**
   * Get Examinations
   */
  async getExaminations(params?: GetExaminationsRequest): Promise<ExaminationsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.examType) queryParams.append('examType', params.examType);
    if (params?.academicYearId) queryParams.append('academicYearId', params.academicYearId);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `${API_ENDPOINTS.admin.examinations.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ExaminationsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Examinations API Response:', { params, response });
    }

    if (!response.data) {
      return { examinations: [] };
    }

    return response.data;
  }

  /**
   * Get Upcoming Exams
   */
  async getUpcomingExams(academicYearId?: string): Promise<ExaminationsResponse> {
    const queryParams = new URLSearchParams();
    if (academicYearId) queryParams.append('academicYearId', academicYearId);

    const endpoint = `${API_ENDPOINTS.admin.examinations.upcoming}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ExaminationsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Upcoming Exams API Response:', response);
    }

    if (!response.data) {
      return { examinations: [] };
    }

    return response.data;
  }

  /**
   * Get Ongoing Exams
   */
  async getOngoingExams(): Promise<ExaminationsResponse> {
    const response = await apiClient.get<ExaminationsResponse>(
      API_ENDPOINTS.admin.examinations.ongoing
    );

    if (import.meta.env.DEV) {
      console.log('Get Ongoing Exams API Response:', response);
    }

    if (!response.data) {
      return { examinations: [] };
    }

    return response.data;
  }

  /**
   * Get Completed Exams
   */
  async getCompletedExams(academicYearId?: string, year?: number): Promise<ExaminationsResponse> {
    const queryParams = new URLSearchParams();
    if (academicYearId) queryParams.append('academicYearId', academicYearId);
    if (year) queryParams.append('year', year.toString());

    const endpoint = `${API_ENDPOINTS.admin.examinations.completed}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<ExaminationsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Completed Exams API Response:', response);
    }

    if (!response.data) {
      return { examinations: [] };
    }

    return response.data;
  }

  /**
   * Get Exam Calendar
   */
  async getExamCalendar(month?: number, year?: number): Promise<any> {
    const queryParams = new URLSearchParams();
    if (month) queryParams.append('month', month.toString());
    if (year) queryParams.append('year', year.toString());

    const endpoint = `${API_ENDPOINTS.admin.examinations.calendar}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<any>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Exam Calendar API Response:', response);
    }

    return response.data || {};
  }

  /**
   * Get Exam Activities
   */
  async getExamActivities(limit?: number): Promise<any> {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append('limit', limit.toString());

    const endpoint = `${API_ENDPOINTS.admin.examinations.activities}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<any>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Exam Activities API Response:', response);
    }

    return response.data || [];
  }

  /**
   * Get Single Examination
   */
  async getExaminationById(id: string): Promise<ApiResponse<Examination>> {
    const response = await apiClient.get<Examination>(
      API_ENDPOINTS.admin.examinations.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Examination by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Examination
   */
  async updateExamination(id: string, request: UpdateExaminationRequest): Promise<ApiResponse<Examination>> {
    const response = await apiClient.patch<Examination>(
      API_ENDPOINTS.admin.examinations.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Examination API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Examination
   */
  async deleteExamination(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.examinations.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Examination API Response:', { id, response });
    }

    return response;
  }

  /**
   * Create Exam Marks
   */
  async createExamMarks(request: CreateExamMarksRequest): Promise<ApiResponse<any>> {
    const response = await apiClient.post<any>(
      API_ENDPOINTS.admin.examinations.marks,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Exam Marks API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Create Grade Scale
   */
  async createGradeScale(request: CreateGradeScaleRequest): Promise<ApiResponse<GradeScale>> {
    const response = await apiClient.post<GradeScale>(
      API_ENDPOINTS.admin.examinations.gradeScales.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Grade Scale API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Grade Scales
   */
  async getGradeScales(params?: GetGradeScalesRequest): Promise<GradeScalesResponse> {
    const queryParams = new URLSearchParams();
    if (params?.classId) queryParams.append('classId', params.classId);
    if (params?.scaleName) queryParams.append('scaleName', params.scaleName);

    const endpoint = `${API_ENDPOINTS.admin.examinations.gradeScales.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<GradeScalesResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Grade Scales API Response:', { params, response });
    }

    if (!response.data) {
      return { gradeScales: [] };
    }

    return response.data;
  }

  /**
   * Create Grade Configuration
   */
  async createGradeConfiguration(request: CreateGradeConfigurationRequest): Promise<ApiResponse<GradeConfiguration>> {
    const response = await apiClient.post<GradeConfiguration>(
      API_ENDPOINTS.admin.examinations.gradeConfigurations.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Grade Configuration API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Grade Configurations
   */
  async getGradeConfigurations(classId?: string): Promise<GradeConfigurationsResponse> {
    const queryParams = new URLSearchParams();
    if (classId) queryParams.append('classId', classId);

    const endpoint = `${API_ENDPOINTS.admin.examinations.gradeConfigurations.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<GradeConfigurationsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Grade Configurations API Response:', response);
    }

    if (!response.data) {
      return { gradeConfigurations: [] };
    }

    return response.data;
  }

  // ==================== TRANSPORT APIs ====================

  /**
   * Create Bus
   */
  async createBus(request: CreateBusRequest): Promise<ApiResponse<Bus>> {
    const response = await apiClient.post<Bus>(
      API_ENDPOINTS.admin.transport.buses.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Bus API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Buses
   */
  async getBuses(status?: string): Promise<BusesResponse> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);

    const endpoint = `${API_ENDPOINTS.admin.transport.buses.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<BusesResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Buses API Response:', response);
    }

    if (!response.data) {
      return { buses: [] };
    }

    return response.data;
  }

  /**
   * Create Driver
   */
  async createDriver(request: CreateDriverRequest): Promise<ApiResponse<Driver>> {
    const response = await apiClient.post<Driver>(
      API_ENDPOINTS.admin.transport.drivers.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Driver API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Drivers
   */
  async getDrivers(): Promise<DriversResponse> {
    const response = await apiClient.get<DriversResponse>(
      API_ENDPOINTS.admin.transport.drivers.base
    );

    if (import.meta.env.DEV) {
      console.log('Get Drivers API Response:', response);
    }

    if (!response.data) {
      return { drivers: [] };
    }

    return response.data;
  }

  /**
   * Create Transport Route
   */
  async createTransportRoute(request: CreateTransportRouteRequest): Promise<ApiResponse<TransportRoute>> {
    const response = await apiClient.post<TransportRoute>(
      API_ENDPOINTS.admin.transport.routes.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Transport Route API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Transport Routes
   */
  async getTransportRoutes(status?: string): Promise<TransportRoutesResponse> {
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);

    const endpoint = `${API_ENDPOINTS.admin.transport.routes.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<any>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Transport Routes API Response:', response);
    }

    // Handle both array and object responses
    if (!response.data) {
      return { routes: [] };
    }

    // If response is an array, wrap it in routes property
    if (Array.isArray(response.data)) {
      return { routes: response.data };
    }

    // If response already has routes property, return as is
    if (response.data.routes) {
      return response.data;
    }

    // Fallback: return empty routes
    return { routes: [] };
  }

  /**
   * Get Transport Route by ID
   */
  async getTransportRouteById(routeId: string): Promise<TransportRoute> {
    const endpoint = `${API_ENDPOINTS.admin.transport.routes.base}/${routeId}`;
    const response = await apiClient.get<TransportRoute>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Transport Route by ID API Response:', response);
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response.data;
  }

  /**
   * Update Transport Route
   */
  async updateTransportRoute(routeId: string, request: Partial<CreateTransportRouteRequest>): Promise<ApiResponse<TransportRoute>> {
    const endpoint = `${API_ENDPOINTS.admin.transport.routes.base}/${routeId}`;
    const response = await apiClient.patch<TransportRoute>(endpoint, request);

    if (import.meta.env.DEV) {
      console.log('Update Transport Route API Response:', response);
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Transport Route Status
   */
  async updateTransportRouteStatus(routeId: string, status: 'ACTIVE' | 'INACTIVE'): Promise<void> {
    const endpoint = `${API_ENDPOINTS.admin.transport.routes.base}/${routeId}/status`;
    await apiClient.patch(endpoint, { status });

    if (import.meta.env.DEV) {
      console.log('Update Transport Route Status:', routeId, status);
    }
  }

  /**
   * Delete Transport Route
   */
  async deleteTransportRoute(routeId: string): Promise<void> {
    const endpoint = `${API_ENDPOINTS.admin.transport.routes.base}/${routeId}`;
    await apiClient.delete(endpoint);

    if (import.meta.env.DEV) {
      console.log('Delete Transport Route:', routeId);
    }
  }

  /**
   * Create Student Transport
   */
  async createStudentTransport(request: CreateStudentTransportRequest): Promise<ApiResponse<StudentTransport>> {
    const response = await apiClient.post<StudentTransport>(
      API_ENDPOINTS.admin.transport.studentTransports.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Student Transport API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Student Transports
   */
  async getStudentTransports(routeId?: string, studentId?: string): Promise<StudentTransportsResponse> {
    const queryParams = new URLSearchParams();
    if (routeId) queryParams.append('routeId', routeId);
    if (studentId) queryParams.append('studentId', studentId);

    const endpoint = `${API_ENDPOINTS.admin.transport.studentTransports.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<StudentTransportsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Student Transports API Response:', response);
    }

    if (!response.data) {
      return { studentTransports: [] };
    }

    return response.data;
  }

  // ==================== HOSTEL APIs ====================

  /**
   * Create Hostel Building
   */
  async createHostelBuilding(request: CreateHostelBuildingRequest): Promise<ApiResponse<HostelBuilding>> {
    const response = await apiClient.post<HostelBuilding>(
      API_ENDPOINTS.admin.hostel.buildings.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Hostel Building API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Hostel Buildings
   */
  async getHostelBuildings(): Promise<HostelBuildingsResponse> {
    const response = await apiClient.get<any>(
      API_ENDPOINTS.admin.hostel.buildings.base
    );

    if (import.meta.env.DEV) {
      console.log('Get Hostel Buildings API Response:', response);
    }

    // Handle both array and object responses
    if (!response.data) {
      return { buildings: [] };
    }

    // If response is an array, wrap it in buildings property
    if (Array.isArray(response.data)) {
      return { buildings: response.data };
    }

    // If response already has buildings property, return as is
    if (response.data.buildings) {
      return response.data;
    }

    // Fallback: return empty buildings
    return { buildings: [] };
  }

  /**
   * Create Hostel Room
   */
  async createHostelRoom(request: CreateHostelRoomRequest): Promise<ApiResponse<HostelRoom>> {
    const response = await apiClient.post<HostelRoom>(
      API_ENDPOINTS.admin.hostel.rooms.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Hostel Room API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Hostel Rooms
   */
  async getHostelRooms(buildingId?: string, status?: string): Promise<HostelRoomsResponse> {
    const queryParams = new URLSearchParams();
    if (buildingId) queryParams.append('buildingId', buildingId);
    if (status) queryParams.append('status', status);

    const endpoint = `${API_ENDPOINTS.admin.hostel.rooms.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<any>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Hostel Rooms API Response:', response);
    }

    // Handle both array and object responses
    if (!response.data) {
      return { rooms: [] };
    }

    // If response is an array, wrap it in rooms property
    if (Array.isArray(response.data)) {
      return { rooms: response.data };
    }

    // If response already has rooms property, return as is
    if (response.data.rooms) {
      return response.data;
    }

    // Fallback: return empty rooms
    return { rooms: [] };
  }

  /**
   * Get Single Hostel Room
   */
  async getHostelRoomById(id: string): Promise<ApiResponse<HostelRoom>> {
    const response = await apiClient.get<HostelRoom>(
      API_ENDPOINTS.admin.hostel.rooms.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Hostel Room by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Hostel Room
   */
  async updateHostelRoom(id: string, request: UpdateHostelRoomRequest): Promise<ApiResponse<HostelRoom>> {
    const response = await apiClient.patch<HostelRoom>(
      API_ENDPOINTS.admin.hostel.rooms.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Hostel Room API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Hostel Room
   */
  async deleteHostelRoom(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.hostel.rooms.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Hostel Room API Response:', { id, response });
    }

    return response;
  }

  /**
   * Get Hostel Overview
   */
  async getHostelOverview(): Promise<HostelOverview> {
    const response = await apiClient.get<HostelOverview>(
      API_ENDPOINTS.admin.hostel.overview
    );

    if (import.meta.env.DEV) {
      console.log('Get Hostel Overview API Response:', response);
    }

    if (!response.data) {
      return {
        totalBuildings: 0,
        totalRooms: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        availableBeds: 0,
        totalStudents: 0,
        pendingComplaints: 0,
        maintenanceRooms: 0,
      };
    }

    return response.data;
  }

  /**
   * Create Hostel Allocation
   */
  async createHostelAllocation(request: CreateHostelAllocationRequest): Promise<ApiResponse<HostelAllocation>> {
    const response = await apiClient.post<HostelAllocation>(
      API_ENDPOINTS.admin.hostel.allocations.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Hostel Allocation API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Hostel Allocations
   */
  async getHostelAllocations(buildingId?: string, roomId?: string, studentId?: string, status?: string): Promise<HostelAllocationsResponse> {
    const queryParams = new URLSearchParams();
    if (buildingId) queryParams.append('buildingId', buildingId);
    if (roomId) queryParams.append('roomId', roomId);
    if (studentId) queryParams.append('studentId', studentId);
    if (status) queryParams.append('status', status);

    const endpoint = `${API_ENDPOINTS.admin.hostel.allocations.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<HostelAllocationsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Hostel Allocations API Response:', response);
    }

    if (!response.data) {
      return { allocations: [] };
    }

    return response.data;
  }

  /**
   * Get Single Hostel Allocation
   */
  async getHostelAllocationById(id: string): Promise<ApiResponse<HostelAllocation>> {
    const response = await apiClient.get<HostelAllocation>(
      API_ENDPOINTS.admin.hostel.allocations.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Hostel Allocation by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Hostel Allocation
   */
  async updateHostelAllocation(id: string, request: UpdateHostelAllocationRequest): Promise<ApiResponse<HostelAllocation>> {
    const response = await apiClient.patch<HostelAllocation>(
      API_ENDPOINTS.admin.hostel.allocations.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Hostel Allocation API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Hostel Allocation
   */
  async deleteHostelAllocation(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.hostel.allocations.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Hostel Allocation API Response:', { id, response });
    }

    return response;
  }

  /**
   * Create Hostel Complaint
   */
  async createHostelComplaint(request: CreateHostelComplaintRequest): Promise<ApiResponse<HostelComplaint>> {
    const response = await apiClient.post<HostelComplaint>(
      API_ENDPOINTS.admin.hostel.complaints.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Hostel Complaint API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Hostel Complaints
   */
  async getHostelComplaints(studentId?: string, status?: string): Promise<HostelComplaintsResponse> {
    const queryParams = new URLSearchParams();
    if (studentId) queryParams.append('studentId', studentId);
    if (status) queryParams.append('status', status);

    const endpoint = `${API_ENDPOINTS.admin.hostel.complaints.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<HostelComplaintsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Hostel Complaints API Response:', response);
    }

    if (!response.data) {
      return { complaints: [] };
    }

    return response.data;
  }

  /**
   * Update Hostel Complaint
   */
  async updateHostelComplaint(id: string, request: UpdateHostelComplaintRequest): Promise<ApiResponse<HostelComplaint>> {
    const response = await apiClient.patch<HostelComplaint>(
      API_ENDPOINTS.admin.hostel.complaints.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Hostel Complaint API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  // ==================== INVENTORY APIs ====================

  /**
   * Create Inventory Category
   */
  async createInventoryCategory(request: CreateInventoryCategoryRequest): Promise<ApiResponse<InventoryCategory>> {
    const response = await apiClient.post<InventoryCategory>(
      API_ENDPOINTS.admin.inventory.categories.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Inventory Category API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Inventory Categories
   */
  async getInventoryCategories(): Promise<InventoryCategoriesResponse> {
    const response = await apiClient.get<InventoryCategoriesResponse>(
      API_ENDPOINTS.admin.inventory.categories.base
    );

    if (import.meta.env.DEV) {
      console.log('Get Inventory Categories API Response:', response);
    }

    if (!response.data) {
      return { categories: [] };
    }

    return response.data;
  }

  /**
   * Get Single Inventory Category
   */
  async getInventoryCategoryById(id: string): Promise<ApiResponse<InventoryCategory>> {
    const response = await apiClient.get<InventoryCategory>(
      API_ENDPOINTS.admin.inventory.categories.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Inventory Category by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Inventory Category
   */
  async updateInventoryCategory(id: string, request: UpdateInventoryCategoryRequest): Promise<ApiResponse<InventoryCategory>> {
    const response = await apiClient.patch<InventoryCategory>(
      API_ENDPOINTS.admin.inventory.categories.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Inventory Category API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Inventory Category
   */
  async deleteInventoryCategory(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.inventory.categories.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Inventory Category API Response:', { id, response });
    }

    return response;
  }

  /**
   * Create Supplier
   */
  async createSupplier(request: CreateSupplierRequest): Promise<ApiResponse<Supplier>> {
    const response = await apiClient.post<Supplier>(
      API_ENDPOINTS.admin.inventory.suppliers.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Supplier API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Suppliers
   */
  async getSuppliers(): Promise<SuppliersResponse> {
    const response = await apiClient.get<SuppliersResponse>(
      API_ENDPOINTS.admin.inventory.suppliers.base
    );

    if (import.meta.env.DEV) {
      console.log('Get Suppliers API Response:', response);
    }

    if (!response.data) {
      return { suppliers: [] };
    }

    return response.data;
  }

  /**
   * Get Single Supplier
   */
  async getSupplierById(id: string): Promise<ApiResponse<Supplier>> {
    const response = await apiClient.get<Supplier>(
      API_ENDPOINTS.admin.inventory.suppliers.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Supplier by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Supplier
   */
  async updateSupplier(id: string, request: UpdateSupplierRequest): Promise<ApiResponse<Supplier>> {
    const response = await apiClient.patch<Supplier>(
      API_ENDPOINTS.admin.inventory.suppliers.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Supplier API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Supplier
   */
  async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.inventory.suppliers.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Supplier API Response:', { id, response });
    }

    return response;
  }

  /**
   * Create Inventory Item
   */
  async createInventoryItem(request: CreateInventoryItemRequest): Promise<ApiResponse<InventoryItem>> {
    const response = await apiClient.post<InventoryItem>(
      API_ENDPOINTS.admin.inventory.items.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Inventory Item API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Inventory Items
   */
  async getInventoryItems(categoryId?: string, status?: string): Promise<InventoryItemsResponse> {
    const queryParams = new URLSearchParams();
    if (categoryId) queryParams.append('categoryId', categoryId);
    if (status) queryParams.append('status', status);

    const endpoint = `${API_ENDPOINTS.admin.inventory.items.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<InventoryItemsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Inventory Items API Response:', response);
    }

    if (!response.data) {
      return { items: [] };
    }

    return response.data;
  }

  /**
   * Get Single Inventory Item
   */
  async getInventoryItemById(id: string): Promise<ApiResponse<InventoryItem>> {
    const response = await apiClient.get<InventoryItem>(
      API_ENDPOINTS.admin.inventory.items.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Get Inventory Item by ID API Response:', { id, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Update Inventory Item
   */
  async updateInventoryItem(id: string, request: UpdateInventoryItemRequest): Promise<ApiResponse<InventoryItem>> {
    const response = await apiClient.patch<InventoryItem>(
      API_ENDPOINTS.admin.inventory.items.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update Inventory Item API Response:', { id, request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Delete Inventory Item
   */
  async deleteInventoryItem(id: string): Promise<ApiResponse<void>> {
    const response = await apiClient.delete<void>(
      API_ENDPOINTS.admin.inventory.items.getById(id)
    );

    if (import.meta.env.DEV) {
      console.log('Delete Inventory Item API Response:', { id, response });
    }

    return response;
  }

  /**
   * Get Inventory Overview
   */
  async getInventoryOverview(): Promise<InventoryOverview> {
    const response = await apiClient.get<InventoryOverview>(
      API_ENDPOINTS.admin.inventory.overview
    );

    if (import.meta.env.DEV) {
      console.log('Get Inventory Overview API Response:', response);
    }

    if (!response.data) {
      return {
        totalItems: 0,
        totalCategories: 0,
        totalSuppliers: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        recentTransactions: 0,
      };
    }

    return response.data;
  }

  /**
   * Create Inventory Transaction
   */
  async createInventoryTransaction(request: CreateInventoryTransactionRequest): Promise<ApiResponse<InventoryTransaction>> {
    const response = await apiClient.post<InventoryTransaction>(
      API_ENDPOINTS.admin.inventory.transactions.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Inventory Transaction API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }

  /**
   * Get Inventory Transactions
   */
  async getInventoryTransactions(itemId?: string, transactionType?: string): Promise<InventoryTransactionsResponse> {
    const queryParams = new URLSearchParams();
    if (itemId) queryParams.append('itemId', itemId);
    if (transactionType) queryParams.append('transactionType', transactionType);

    const endpoint = `${API_ENDPOINTS.admin.inventory.transactions.base}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await apiClient.get<InventoryTransactionsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Inventory Transactions API Response:', response);
    }

    if (!response.data) {
      return { transactions: [] };
    }

    return response.data;
  }

  /**
   * Get Student Analytics
   */
  async getStudentAnalytics(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.admin.analytics.students);

    if (import.meta.env.DEV) {
      console.log('Get Student Analytics API Response:', response);
    }

    return response.data || {};
  }

  /**
   * Get Teacher Analytics
   */
  async getTeacherAnalytics(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.admin.analytics.teachers);

    if (import.meta.env.DEV) {
      console.log('Get Teacher Analytics API Response:', response);
    }

    return response.data || {};
  }

  /**
   * Get Revenue Trend
   */
  async getRevenueTrend(months: number = 6): Promise<any> {
    const endpoint = `${API_ENDPOINTS.admin.analytics.revenueTrend}?months=${months}`;
    const response = await apiClient.get(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Revenue Trend API Response:', response);
    }

    return response.data || { data: [], comparison: {} };
  }

  /**
   * Get Attendance Trend
   */
  async getAttendanceTrend(months: number = 6): Promise<any> {
    const endpoint = `${API_ENDPOINTS.admin.analytics.attendanceTrend}?months=${months}`;
    const response = await apiClient.get(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Attendance Trend API Response:', response);
    }

    return response.data || { data: [], comparison: {} };
  }

  /**
   * Get Student Growth Trend
   */
  async getStudentGrowthTrend(months: number = 6): Promise<any> {
    const endpoint = `${API_ENDPOINTS.admin.analytics.studentGrowthTrend}?months=${months}`;
    const response = await apiClient.get(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Student Growth Trend API Response:', response);
    }

    return response.data || { data: [], period: '' };
  }

  /**
   * Get Class Attendance Analytics
   */
  async getClassAttendanceAnalytics(format: 'bar' | 'line' | 'pie' = 'bar'): Promise<any> {
    const endpoint = `${API_ENDPOINTS.admin.analytics.classAttendance}?format=${format}`;
    const response = await apiClient.get(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Class Attendance Analytics API Response:', response);
    }

    return response.data || { data: [] };
  }

  /**
   * Get Financial Statements
   */
  async getFinancialStatements(): Promise<any> {
    const response = await apiClient.get(API_ENDPOINTS.admin.analytics.financialStatements);

    if (import.meta.env.DEV) {
      console.log('Get Financial Statements API Response:', response);
    }

    return response.data || {};
  }

  /**
   * Get System Settings
   */
  async getSystemSettings(category?: string): Promise<any> {
    try {
      const endpoint = category 
        ? `${API_ENDPOINTS.admin.settings.systemSettings.base}?category=${category}`
        : API_ENDPOINTS.admin.settings.systemSettings.base;
      const response = await apiClient.get(endpoint);

      if (import.meta.env.DEV) {
        console.log('Get System Settings API Response:', response);
      }

      // Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      } else if (response.data && Array.isArray(response.data.settings)) {
        return response.data.settings;
      } else if (Array.isArray(response)) {
        return response;
      }
      
      return [];
    } catch (error: any) {
      console.error('Error fetching system settings:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  }

  /**
   * Create System Setting
   */
  async createSystemSetting(request: any): Promise<any> {
    const response = await apiClient.post(
      API_ENDPOINTS.admin.settings.systemSettings.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create System Setting API Response:', response);
    }

    return response.data;
  }

  /**
   * Update System Setting
   */
  async updateSystemSetting(id: string, request: any): Promise<any> {
    const response = await apiClient.patch(
      API_ENDPOINTS.admin.settings.systemSettings.getById(id),
      request
    );

    if (import.meta.env.DEV) {
      console.log('Update System Setting API Response:', response);
    }

    return response.data;
  }

  /**
   * Get User Notifications
   */
  async getNotifications(limit?: number): Promise<ApiResponse<any[]>> {
    const endpoint = `${API_ENDPOINTS.admin.notifications.base}${limit ? `?limit=${limit}` : ''}`;
    const response = await apiClient.get<any[]>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Notifications API Response:', response);
    }

    return response;
  }

  /**
   * Get Unread Notifications Count
   */
  async getUnreadNotificationsCount(): Promise<ApiResponse<{ unreadCount: number }>> {
    const endpoint = API_ENDPOINTS.admin.notifications.unreadCount;
    const response = await apiClient.get<{ unreadCount: number }>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Unread Notifications Count API Response:', response);
    }

    return response;
  }

  /**
   * Mark Notification as Read
   */
  async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
    const endpoint = API_ENDPOINTS.admin.notifications.markAsRead(notificationId);
    const response = await apiClient.patch<void>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Mark Notification as Read API Response:', response);
    }

    return response;
  }

  /**
   * Mark All Notifications as Read
   */
  async markAllNotificationsAsRead(): Promise<ApiResponse<{ updatedCount: number }>> {
    const endpoint = API_ENDPOINTS.admin.notifications.markAllAsRead;
    const response = await apiClient.patch<{ updatedCount: number }>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Mark All Notifications as Read API Response:', response);
    }

    return response;
  }

  /**
   * Get School by ID
   */
  async getSchoolById(schoolId: string): Promise<ApiResponse<any>> {
    const endpoint = API_ENDPOINTS.admin.schools.getById(schoolId);
    const response = await apiClient.get<any>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get School by ID API Response:', { schoolId, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
  }
}

// Export singleton instance
export const adminService = new AdminService();