import type { AuthResponse } from "./types";

const AUTH_STORAGE_KEY = "ai-agent-builder-auth";

export function saveSession(session: AuthResponse) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function loadSession(): AuthResponse | null {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
