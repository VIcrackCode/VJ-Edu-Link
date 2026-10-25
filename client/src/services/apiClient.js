const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");
const TOKEN_KEY = "vjEduLinkToken";

async function readJsonResponse(response, requestLabel = "Request") {
  if (response.status === 204) return null;

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (body?.message) throw new Error(body.message);
    if (response.status >= 500) {
      throw new Error("The API server is unavailable. Start the server and try again.");
    }
    throw new Error(`${requestLabel} failed (HTTP ${response.status}). Check the API route and try again.`);
  }

  if (body === null) {
    throw new Error("The API returned an invalid response. Check that the server is running correctly.");
  }
  return body;
}

async function fetchApi(path, options) {
  try {
    return await fetch(`${API_BASE_URL}${path}`, options);
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new Error("Could not connect to the API server. Make sure it is running, then try again.");
  }
}

export async function api(path, options = {}) {
  const token = sessionStorage.getItem(TOKEN_KEY);

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetchApi(path, {
    ...options,
    headers,
  });

  return readJsonResponse(response);
}

export async function apiBlob(path) {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const response = await fetchApi(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    await readJsonResponse(response, "File request");
  }

  return response.blob();
}

export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);
