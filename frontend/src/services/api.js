function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  return `${protocol}//${host}:4000/api`;
}

const API_BASE_URL = getApiBaseUrl();

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "요청 처리 중 오류가 발생했습니다." }));
    throw new Error(error.message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  getDashboard: () => request("/dashboard"),
  getApplications: () => request("/applications"),
  getApplication: (id) => request(`/applications/${id}`),
  createApplication: (payload) => request("/applications", jsonOptions("POST", payload)),
  updateApplication: (id, payload) => request(`/applications/${id}`, jsonOptions("PUT", payload)),
  deleteApplication: (id) => request(`/applications/${id}`, { method: "DELETE" }),
  addStageChecklist: (id) => request(`/applications/${id}/stage-checklist`, { method: "POST" }),
  createTask: (applicationId, payload) => request(`/applications/${applicationId}/tasks`, jsonOptions("POST", payload)),
  updateTask: (id, payload) => request(`/tasks/${id}`, jsonOptions("PATCH", payload)),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  analyzeFile: (formData) => request("/analyze/file", { method: "POST", body: formData }),
  createStudyPlan: (applicationId, payload) => request(`/applications/${applicationId}/study-plan`, jsonOptions("POST", payload)),
  getStudyPlan: (applicationId) => request(`/applications/${applicationId}/study-plan`),
  updateStudyPlan: (applicationId, payload) => request(`/applications/${applicationId}/study-plan`, jsonOptions("PATCH", payload)),
  deleteStudyPlan: (applicationId) => request(`/applications/${applicationId}/study-plan`, { method: "DELETE" })
};

function jsonOptions(method, payload) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  };
}
