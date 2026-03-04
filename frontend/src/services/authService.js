import api from './api';

export async function register(email, password, name) {
  const response = await api.post('/auth/register', {
    email,
    password,
    name,
  });
  return response.data;
}

export async function login(email, password) {
  const response = await api.post('/auth/login', {
    email,
    password,
  });
  return response.data;
}

export async function getMe() {
  const response = await api.get('/auth/me');
  return response.data;
}

export async function refreshToken(refreshToken) {
  const response = await api.post('/auth/refresh', {
    refreshToken,
  });
  return response.data;
}

export function logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}
