export interface User {
  id: number;
  username: string;
  fullName: string;
}

export interface AuthSession {
  sessionId: string;
  user: User;
}

const AUTH_STORAGE_KEY = 'debt_master_auth';

export function getStoredAuth(): AuthSession | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
}

export function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function getAuthHeaders(): Record<string, string> {
  const auth = getStoredAuth();
  return auth ? { Authorization: `Bearer ${auth.sessionId}` } : {};
}
