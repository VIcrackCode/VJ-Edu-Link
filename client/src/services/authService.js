import { api, clearToken, setToken } from "./apiClient";

const SESSION_KEY = "vjEduLinkSession";

export function getSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user && typeof user === "object" ? user : null;
  } catch {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Keep the login screen available when browser storage is disabled.
    }
    return null;
  }
}

export function persistSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function signIn({ id, password }) {
  const result = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ id: String(id || "").trim().toUpperCase(), password }),
  });
  const { token, user } = result || {};
  if (!token || !user || typeof user !== "object") {
    throw new Error("The login service returned incomplete account details. Please try again.");
  }
  setToken(token);
  persistSession(user);
  return user;
}

export async function restoreSession() {
  const token = sessionStorage.getItem("vjEduLinkToken");
  if (!token) return null;
  const { user } = await api("/auth/me");
  persistSession(user);
  return user;
}

export function signOut() {
  sessionStorage.removeItem(SESSION_KEY);
  clearToken();
}

export async function requestPasswordReset(phone) {
  return api("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
}

export async function resetPassword({ phone, otp, password }) {
  return api("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ phone, otp, password }),
  });
}
