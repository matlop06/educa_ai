import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// --- Auth API ---
export const login = (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

export const logout = () => {
  return apiClient.get('/auth/logout');
};

export const getCurrentUser = () => {
  return apiClient.get('/users/current');
};


export const getAssistants = () => {
  return apiClient.get('/assistants');
};

export const getAssistantById = (id) => {
  return apiClient.get(`/assistants/${id}`);
};

export const updateAssistant = (id, formData) => {
  return apiClient.put(`/assistants/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const createAssistant = (formData) => {
  return apiClient.post('/assistants', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAssistant = (id) => {
  return apiClient.delete(`/assistants/${id}`);
};

// --- Evaluations API ---
export const addEvaluation = (assistantId, evaluationData) => {
  return apiClient.post(`/assistants/${assistantId}/evaluations`, evaluationData);
};

export const updateEvaluation = (assistantId, evalId, evaluationData) => {
  return apiClient.put(`/assistants/${assistantId}/evaluations/${evalId}`, evaluationData);
};

export const deleteEvaluation = (assistantId, evalId) => {
  return apiClient.delete(`/assistants/${assistantId}/evaluations/${evalId}`);
};

export const generateEvaluationSummary = (assistantId, evaluationTitle) => {
  return apiClient.post('/assistants/generate-summary', { assistantId, evaluationTitle });
};

export const generateAnswers = (assistantId, data) => {
    return apiClient.post(`/assistants/generate-answers`, { assistantId, ...data });
};

export const generateEvaluationDraft = (assistantId, data) => {
    return apiClient.post(`/assistants/generate-evaluation-draft`, { assistantId, ...data });
};

export const submitEvaluation = (evaluationId, data) => {
    return apiClient.post(`/evaluations/${evaluationId}/submit`, data);
};

export const getEvaluationResult = (resultId) => {
    return apiClient.get(`/evaluations/results/${resultId}`);
};

// --- Institutions API ---
export const getInstitutions = () => {
  return apiClient.get('/institutions');
};

export const createInstitution = (institutionName, adminName, adminEmail) => {
  return apiClient.post('/institutions', { institutionName, adminName, adminEmail });
};

export const updateInstitution = (id, name) => {
  return apiClient.put(`/institutions/${id}`, { name });
};

export const deleteInstitution = (id) => {
  return apiClient.delete(`/institutions/${id}`);
};

// --- Invitations API ---
export const sendInvitation = (email, institutionId, role) => {
  return apiClient.post('/invitations', { email, institutionId, role });
};

// --- Courses API ---
export const getCourses = () => {
  return apiClient.get('/courses');
};

export const createCourse = (courseData) => {
  return apiClient.post('/courses', courseData);
};

export const updateCourse = (id, courseData) => {
  return apiClient.put(`/courses/${id}`, courseData);
};

export const deleteCourse = (id) => {
  return apiClient.delete(`/courses/${id}`);
};

export const addProfessorToCourse = (courseId, professorData) => {
  return apiClient.post(`/courses/${courseId}/professors`, professorData);
};

export const removeProfessorFromCourse = (courseId, professorId) => {
  return apiClient.delete(`/courses/${courseId}/professors/${professorId}`);
};

// --- Users API ---
export const getUsers = () => {
  return apiClient.get('/users');
};

export const deleteUser = (id) => {
  return apiClient.delete(`/users/${id}`);
};

export const createUser = (userData) => {
  return apiClient.post('/users', userData);
};

export const updateUser = (id, userData) => {
  return apiClient.put(`/users/${id}`, userData);
};

// --- Student Auth API ---
// This function is now for authenticated users
export const joinCourse = (enrollmentCode) => {
  return apiClient.post('/auth/join-course', { enrollmentCode });
};
