import axios, { AxiosInstance, AxiosError } from 'axios';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest.headers['X-Retry']) {
      originalRequest.headers['X-Retry'] = 'true';

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
        if (refreshToken) {
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const { access_token, refresh_token } = response.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/auth/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Typed API methods
export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/api/v1/auth/login', { email, password }),
    register: (data: { email: string; username: string; full_name: string; password: string }) =>
      apiClient.post('/api/v1/auth/register', data),
    refresh: () => apiClient.post('/api/v1/auth/refresh'),
    getCurrentUser: () => apiClient.get('/api/v1/auth/me'),
  },

  organizations: {
    list: (skip = 0, limit = 10) =>
      apiClient.get(`/api/v1/organizations?skip=${skip}&limit=${limit}`),
    get: (id: number) => apiClient.get(`/api/v1/organizations/${id}`),
    create: (data: any) => apiClient.post('/api/v1/organizations', data),
    update: (id: number, data: any) =>
      apiClient.put(`/api/v1/organizations/${id}`, data),
    delete: (id: number) => apiClient.delete(`/api/v1/organizations/${id}`),
    getMembers: (id: number) =>
      apiClient.get(`/api/v1/organizations/${id}/members`),
  },

  projects: {
    list: (orgId?: number, skip = 0, limit = 10) => {
      const params = new URLSearchParams();
      if (orgId) params.append('org_id', orgId.toString());
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      return apiClient.get(`/api/v1/projects?${params.toString()}`);
    },
    get: (id: number) => apiClient.get(`/api/v1/projects/${id}`),
    create: (data: any) => apiClient.post('/api/v1/projects', data),
    update: (id: number, data: any) =>
      apiClient.put(`/api/v1/projects/${id}`, data),
    delete: (id: number) => apiClient.delete(`/api/v1/projects/${id}`),
  },

  scans: {
    list: (repoId?: number, status?: string, skip = 0, limit = 10) => {
      const params = new URLSearchParams();
      if (repoId) params.append('repo_id', repoId.toString());
      if (status) params.append('status', status);
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      return apiClient.get(`/api/v1/scans?${params.toString()}`);
    },
    get: (id: number) => apiClient.get(`/api/v1/scans/${id}`),
    create: (data: any) => apiClient.post('/api/v1/scans', data),
    retry: (id: number) => apiClient.post(`/api/v1/scans/${id}/retry`),
    delete: (id: number) => apiClient.delete(`/api/v1/scans/${id}`),
  },

  findings: {
    list: (scanId?: number, severity?: string, resolved?: boolean, skip = 0, limit = 50) => {
      const params = new URLSearchParams();
      if (scanId) params.append('scan_id', scanId.toString());
      if (severity) params.append('severity', severity);
      if (resolved !== undefined) params.append('resolved', resolved.toString());
      params.append('skip', skip.toString());
      params.append('limit', limit.toString());
      return apiClient.get(`/api/v1/findings?${params.toString()}`);
    },
    get: (id: number) => apiClient.get(`/api/v1/findings/${id}`),
    resolve: (id: number) => apiClient.put(`/api/v1/findings/${id}/resolve`),
    unresolve: (id: number) =>
      apiClient.put(`/api/v1/findings/${id}/unresolve`),
    markFalsePositive: (id: number) =>
      apiClient.put(`/api/v1/findings/${id}/false-positive`),
    bySeverity: (scanId?: number) => {
      const params = scanId ? `?scan_id=${scanId}` : '';
      return apiClient.get(`/api/v1/findings/by-severity/summary${params}`);
    },
    byResource: (scanId?: number) => {
      const params = scanId ? `?scan_id=${scanId}` : '';
      return apiClient.get(`/api/v1/findings/by-resource/summary${params}`);
    },
  },

  dashboard: {
    getStats: (orgId?: number) => {
      const params = orgId ? `?org_id=${orgId}` : '';
      return apiClient.get(`/api/v1/dashboard/stats${params}`);
    },
    getRiskScore: (orgId?: number) => {
      const params = orgId ? `?org_id=${orgId}` : '';
      return apiClient.get(`/api/v1/dashboard/risk-score${params}`);
    },
    getRecentScans: (orgId?: number, limit = 10) => {
      const params = new URLSearchParams();
      if (orgId) params.append('org_id', orgId.toString());
      params.append('limit', limit.toString());
      return apiClient.get(`/api/v1/dashboard/recent-scans?${params.toString()}`);
    },
    getRecentFindings: (orgId?: number, limit = 10) => {
      const params = new URLSearchParams();
      if (orgId) params.append('org_id', orgId.toString());
      params.append('limit', limit.toString());
      return apiClient.get(`/api/v1/dashboard/recent-findings?${params.toString()}`);
    },
    getComplianceSummary: (orgId?: number) => {
      const params = orgId ? `?org_id=${orgId}` : '';
      return apiClient.get(`/api/v1/dashboard/compliance-summary${params}`);
    },
    getFindingsTrend: (orgId?: number, days = 30) => {
      const params = new URLSearchParams();
      if (orgId) params.append('org_id', orgId.toString());
      params.append('days', days.toString());
      return apiClient.get(`/api/v1/dashboard/findings-trend?${params.toString()}`);
    },
    getTopRiskyRepositories: (orgId?: number, limit = 10) => {
      const params = new URLSearchParams();
      if (orgId) params.append('org_id', orgId.toString());
      params.append('limit', limit.toString());
      return apiClient.get(`/api/v1/dashboard/top-risky-repositories?${params.toString()}`);
    },
    getVulnerabilitiesByCloud: (orgId?: number) => {
      const params = orgId ? `?org_id=${orgId}` : '';
      return apiClient.get(`/api/v1/dashboard/vulnerabilities-by-cloud${params}`);
    },
  },

  policies: {
    list: (orgId: number, skip = 0, limit = 10) =>
      apiClient.get(`/api/v1/policies?org_id=${orgId}&skip=${skip}&limit=${limit}`),
    get: (id: number) => apiClient.get(`/api/v1/policies/${id}`),
    create: (orgId: number, data: any) =>
      apiClient.post(`/api/v1/policies?org_id=${orgId}`, data),
    update: (id: number, data: any) =>
      apiClient.put(`/api/v1/policies/${id}`, data),
    toggle: (id: number) => apiClient.put(`/api/v1/policies/${id}/toggle`),
    delete: (id: number) => apiClient.delete(`/api/v1/policies/${id}`),
    getVersions: (id: number) =>
      apiClient.get(`/api/v1/policies/${id}/versions`),
  },
};

export default api;
