const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "vjEduLinkToken";

export async function api(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const body =
    response.status === 204
      ? null
      : await response.json();

  if (!response.ok) {
    throw new Error(body?.message || "Request failed.");
  }

  return body;
}

export async function apiBlob(path) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || "Image request failed.");
  }

  return response.blob();
}

export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);
