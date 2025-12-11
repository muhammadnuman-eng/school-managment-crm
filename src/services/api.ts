// Base API Configuration - Based on student-panel-apis.json
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/v1';

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth token management
export const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken');
};

export const setAuthTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refreshToken');
};

export const clearAuthTokens = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

// Base fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 401 - try to refresh token
      if (response.status === 401) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          // Retry the request with new token
          return fetchApi<T>(endpoint, options);
        }
      }
      
      return {
        success: false,
        data: null as T,
        error: data.message || `HTTP error! status: ${response.status}`,
        statusCode: response.status,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
      statusCode: response.status,
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      success: false,
      data: null as T,
      error: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

// Try to refresh the access token
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      setAuthTokens(data.accessToken, data.refreshToken);
      return true;
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  clearAuthTokens();
  return false;
}

// HTTP Methods
export const api = {
  get: <T>(endpoint: string, params?: Record<string, string | number | undefined>) => {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }
    return fetchApi<T>(url, { method: 'GET' });
  },
  
  post: <T>(endpoint: string, body?: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  
  patch: <T>(endpoint: string, body: unknown) =>
    fetchApi<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  
  delete: <T>(endpoint: string) => 
    fetchApi<T>(endpoint, { method: 'DELETE' }),

  // For file downloads
  download: async (endpoint: string, filename: string) => {
    const token = getAuthToken();
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        return { success: true };
      }
      return { success: false, error: 'Download failed' };
    } catch (error) {
      return { success: false, error: 'Download failed' };
    }
  },
};

export default api;


