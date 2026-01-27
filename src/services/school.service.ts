/**
 * School Service
 * Handles all school-related API calls
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import { CreateSchoolRequest, CreateSchoolResponse, School } from '../types/school.types';
import { ApiResponse } from '../types/api.types';

/**
 * School Service Class
 */
class SchoolService {
  /**
   * Create School
   */
  async createSchool(request: CreateSchoolRequest): Promise<CreateSchoolResponse> {
    const response = await apiClient.post<CreateSchoolResponse>(
      API_ENDPOINTS.auth.schoolRegister,
      request
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  }

  /**
   * Get School by ID
   */
  async getSchoolById(schoolId: string): Promise<ApiResponse<School>> {
    const response = await apiClient.get<School>(
      API_ENDPOINTS.schools.getById(schoolId)
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response;
  }

  /**
   * Update School
   */
  async updateSchool(schoolId: string, request: Partial<CreateSchoolRequest>): Promise<ApiResponse<School>> {
    const response = await apiClient.patch<School>(
      API_ENDPOINTS.schools.update(schoolId),
      request
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response;
  }

  /**
   * Delete School
   */
  async deleteSchool(schoolId: string): Promise<ApiResponse<void>> {
    return apiClient.delete<void>(
      API_ENDPOINTS.schools.delete(schoolId)
    );
  }
}

// Export singleton instance
export const schoolService = new SchoolService();

