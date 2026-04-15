const BASE_URL = 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, ...init } = options;
  
  let url = `${BASE_URL}${endpoint}`;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const token = localStorage.getItem('coffee_admin_token');
  const headers = new Headers(init.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (init.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('coffee_admin_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const result = await response.json();

  if (!response.ok || !result.success) {
    const errorMsg = result.message || result.error || response.statusText || 'Unknown Connection Error';
    throw new Error(errorMsg);
  }

  return result.data;
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>) => 
    apiRequest<T>(endpoint, { method: 'GET', params }),
  
  post: <T>(endpoint: string, body: any) => 
    apiRequest<T>(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  
  patch: <T>(endpoint: string, body: any) => 
    apiRequest<T>(endpoint, { 
      method: 'PATCH', 
      body: JSON.stringify(body) 
    }),
  
  delete: <T>(endpoint: string) => 
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};
