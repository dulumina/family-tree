import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      const isLogin = err.config.url.includes('/auth/login');
      if (!isLogin) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/'; // Go back to root which will show AuthPage if no user
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login:    d => api.post('/auth/login', d),
  register: d => api.post('/auth/register', d),
};
export const membersApi = {
  getAll:  (q='') => api.get(`/members${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  create:  d  => api.post('/members', d),
  update:  (id,d) => api.put(`/members/${id}`, d),
  remove:  id => api.delete(`/members/${id}`),
};
export const usersApi = {
  getAll:    () => api.get('/users'),
  setRole:   (id,role) => api.patch(`/users/${id}/role`, { role }),
  remove:    id => api.delete(`/users/${id}`),
};

export default api;
