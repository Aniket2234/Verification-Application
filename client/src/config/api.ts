// API configuration for different environments
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export function getApiUrl(endpoint: string): string {
  // If we have a full API URL (production), use it directly with the endpoint
  if (API_BASE_URL && API_BASE_URL.startsWith('http')) {
    // Remove /api from endpoint since the backend URL should include it
    const cleanEndpoint = endpoint.startsWith('api/') ? endpoint.slice(4) : endpoint;
    return `${API_BASE_URL}/api/${cleanEndpoint}`;
  }
  
  // Otherwise use relative URL (development) - keep the /api prefix
  return `/${endpoint}`;
}