import axios from 'axios';
import { refreshToken } from './services/authService';

const API_BASE_URL = import.meta.env.VITE_FUSION_API_BASE_URL;

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = user?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
      console.log('FormData detected: Content-Type header removed to let axios handle it');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    //Nếu lỗi 401 và chưa retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const user = JSON.parse(localStorage.getItem('user'));
      const refreshTokenValue = user?.refreshToken;

      if (!refreshTokenValue) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const data = await refreshToken(refreshTokenValue);
        //console.log('refreshToken data:', data);

        const newAccessToken = data.accessToken;
        const newRefreshToken = data.refreshToken;

        // Cập nhật lại localStorage và axios header
        user.token = newAccessToken;
        user.refreshToken = newRefreshToken;
        localStorage.setItem('user', JSON.stringify(user));

        axiosInstance.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);

        return axiosInstance(originalRequest);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    if (error.response?.status === 401) {
      // Clear localStorage
      localStorage.removeItem('user');

      // Redirect về login
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);
