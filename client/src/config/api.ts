// API configuration for Netlify Functions
export function getApiUrl(endpoint: string): string {
  // Remove 'api/' prefix if present since we're using Netlify Functions
  const cleanEndpoint = endpoint.startsWith('api/') ? endpoint.slice(4) : endpoint;
  
  // Use Netlify Functions directly (redirects handle the routing)
  return `/api/${cleanEndpoint}`;
}