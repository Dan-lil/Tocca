import axios from 'axios';

// Создаём свой экземпляр axios
export const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

let accessToken = '';

// Функция для установки нового accessToken;
export function setAccessToken(newToken: string) {
  accessToken = newToken;
}

export function getAccessToken() {
  return accessToken;
}

// Интерцептор - функция для перехвата и изменения запросов и ответов
// Добавляем accessToken в заголовок запроса Authorization
axiosInstance.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Если получили статус 403 в ответе - пробуем обновить наши токены 1 раз и повторить запрос
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const previousRequest = error.config;

    if (error.response?.status === 403 && !previousRequest.sent) {
      previousRequest.sent = true;
      try {
        const { data } = await axiosInstance.get('/auth/refresh');
        const newToken = data.data.accessToken;
        setAccessToken(newToken);
        previousRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(previousRequest);
      } catch (error) {
        setAccessToken('');
        window.location.href = '/auth';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);
