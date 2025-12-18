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
import { FeeType, FeeTypesResponse, StudentFee, StudentFeesResponse, GetStudentFeesRequest, CreateInvoiceRequest, Expense, ExpensesResponse, CreateExpenseRequest } from '../types/fee.types';
import { AcademicYear, CreateAcademicYearRequest, AcademicYearsResponse } from '../types/academic-year.types';
import { ApiResponse } from '../types/api.types';
import { schoolStorage } from '../utils/storage';
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
    const requestBody: any = { ...request };
    if (requestBody.sectionId) {
      requestBody.currentSectionId = requestBody.sectionId;
      delete requestBody.sectionId;
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

    // Ensure className is always in the request body (backend requirement when section is provided)
    const requestBody: AddStudentRequest = {
      ...trimmedRequest,
      // Ensure className is present and not empty
      className: trimmedRequest.className && trimmedRequest.className.trim() !== ''
        ? trimmedRequest.className.trim()
        : undefined,
    };

    // Validate that className is present when currentSectionId is provided
    if (requestBody.currentSectionId && (!requestBody.className || requestBody.className.trim() === '')) {
      throw new Error('className is required when currentSectionId is provided. Please select a class.');
    }

    if (import.meta.env.DEV) {
      console.log('🚀 Add Student API Call:', {
        endpoint: API_ENDPOINTS.admin.students,
        requestBody: {
          ...requestBody,
          className: requestBody.className,
          classId: requestBody.classId || 'not provided',
        },
        classUUIDHeader: classUUID || 'not provided',
        hasClassName: !!requestBody.className,
        className: requestBody.className,
        classNameLength: requestBody.className?.length || 0,
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

    const response = await apiClient.get<StudentFeesResponse>(url);

    if (import.meta.env.DEV) {
      console.log('Get Student Fees API Response:', { params, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response.data;
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
    const response = await apiClient.get<ExpensesResponse>(API_ENDPOINTS.admin.expenses);

    if (import.meta.env.DEV) {
      console.log('Get Expenses API Response:', response);
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response.data;
  }

  /**
   * Create Expense
   */
  async createExpense(request: CreateExpenseRequest): Promise<ApiResponse<Expense>> {
    const response = await apiClient.post<Expense>(
      API_ENDPOINTS.admin.expenses,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Expense API Response:', { request, response });
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
    const response = await apiClient.get<MessagesResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Messages API Response:', { params, response });
    }

    if (!response.data) {
      return { messages: [] };
    }

    return response.data;
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
    const response = await apiClient.get<RecipientsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Recipients API Response:', { params, response });
    }

    if (!response.data) {
      return { recipients: [] };
    }

    return response.data;
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
    const response = await apiClient.post<Examination>(
      API_ENDPOINTS.admin.examinations.base,
      request
    );

    if (import.meta.env.DEV) {
      console.log('Create Examination API Response:', { request, response });
    }

    if (!response.data) {
      throw new Error('Invalid response from server: No data received');
    }

    return response;
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
    const response = await apiClient.get<TransportRoutesResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Transport Routes API Response:', response);
    }

    if (!response.data) {
      return { routes: [] };
    }

    return response.data;
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
    const response = await apiClient.get<HostelBuildingsResponse>(
      API_ENDPOINTS.admin.hostel.buildings.base
    );

    if (import.meta.env.DEV) {
      console.log('Get Hostel Buildings API Response:', response);
    }

    if (!response.data) {
      return { buildings: [] };
    }

    return response.data;
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
    const response = await apiClient.get<HostelRoomsResponse>(endpoint);

    if (import.meta.env.DEV) {
      console.log('Get Hostel Rooms API Response:', response);
    }

    if (!response.data) {
      return { rooms: [] };
    }

    return response.data;
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
}

// Export singleton instance
export const adminService = new AdminService();

