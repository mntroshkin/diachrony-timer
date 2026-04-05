const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

const taskService = {
    getAll: () => api.get('/tasks'),
    getOne: (id) => api.get(`/tasks/${id}`),
    create: (task) => api.post('/tasks', task),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
};

const sessionService = {
    create: (session) => api.post('/sessions', session)
}