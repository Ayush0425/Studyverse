const API_URL = import.meta.env.VITE_API_URL || 'https://studyverse-u524.onrender.com/api';
const BASE_URL = API_URL.endsWith('/api') ? API_URL.slice(0, -4) : API_URL;

const getHeaders = (isMultipart = false) => {
  const headers = {};
  
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  
  const token = localStorage.getItem('studyverse_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API Error: ${response.status}`);
  }
  return response.json();
};

export const api = {
  get: async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
  
  post: async (endpoint, body, isMultipart = false) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(isMultipart),
      body: isMultipart ? body : JSON.stringify(body),
    });
    return handleResponse(res);
  },
  
  put: async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },
  
  delete: async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(res);
  },
};
export default api;
export { API_URL, BASE_URL };
