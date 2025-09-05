// API configuration for different environments
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If we have a full API URL (production), use it directly
  if (API_BASE_URL.startsWith('http')) {
    return `${API_BASE_URL}/${cleanEndpoint}`;
  }
  
  // Otherwise use relative URL (development)
  return `${API_BASE_URL}/${cleanEndpoint}`;
}