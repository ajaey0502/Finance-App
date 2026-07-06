import axios from 'axios';

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Refresh tokens rotate on every use (the backend revokes the old one), so
// concurrent 401s must share a single in-flight refresh instead of each
// racing to redeem the same now-stale token.
let refreshPromise = null;

async function performTokenRefresh() {
  const storedRefreshToken = localStorage.getItem('refreshToken');
  if (!storedRefreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await axios.post(`${apiUrl}/auth/refresh`, {
    refreshToken: storedRefreshToken,
  });

  const { accessToken, refreshToken: newRefreshToken } = response.data;
  localStorage.setItem('accessToken', accessToken);
  if (newRefreshToken) {
    localStorage.setItem('refreshToken', newRefreshToken);
  }

  return accessToken;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = performTokenRefresh().finally(() => {
            refreshPromise = null;
          });
        }

        const accessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
