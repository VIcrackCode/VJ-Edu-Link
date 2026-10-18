import { api, clearToken, setToken } from "./apiClient";

const SESSION_KEY = "vjEduLinkSession";

export function getSession() {
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function persistSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export async function signIn({ id, password }) {
  const { token, user } = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({ id, password }),
  });
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
