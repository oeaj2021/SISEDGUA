import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sisedgua_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Llamadas API - Reportes & Público
export const submitReporte = (data) => api.post('/reportes', data);
export const checkDuplicado = (params) => api.get('/reportes/check-duplicado', { params });
export const getInstituciones = (params) => api.get('/instituciones', { params });

// CRUD Instituciones (Admin)
export const createInstitucion = (data) => api.post('/instituciones', data);
export const updateInstitucion = (id, data) => api.put(`/instituciones/${id}`, data);
export const deleteInstitucion = (id) => api.delete(`/instituciones/${id}`);
export const getCapacidadesMunicipios = () => api.get('/instituciones/capacidad');

// Auth & Dashboard
export const login = (data) => api.post('/auth/login', data);
export const getStats = (params) => api.get('/dashboard/stats', { params });
export const getPorMunicipio = (params) => api.get('/dashboard/por-municipio', { params });
export const getTendencia = (params) => api.get('/dashboard/tendencia', { params });
export const getReportes = (params) => api.get('/dashboard/reportes', { params });
export const exportExcel = (params) => api.get('/export/excel', { params, responseType: 'blob' });

export default api;
