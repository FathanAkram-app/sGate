import Cookies from 'js-cookie';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const AUTH_TOKEN_KEY = 'sgate_auth_token';
export const AUTH_USER_KEY = 'sgate_auth_user';

export function getAuthToken(): string | null {
  return Cookies.get(AUTH_TOKEN_KEY) || null;
}

export function setAuthToken(token: string): void {
  Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7 }); // 7 days
}

export function removeAuthToken(): void {
  Cookies.remove(AUTH_TOKEN_KEY);
}

export function getAuthUser(): User | null {
  const userStr = Cookies.get(AUTH_USER_KEY);
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setAuthUser(user: User): void {
  Cookies.set(AUTH_USER_KEY, JSON.stringify(user), { expires: 7 });
}

export function removeAuthUser(): void {
  Cookies.remove(AUTH_USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getAuthToken() && !!getAuthUser();
}

export function logout(): void {
  removeAuthToken();
  removeAuthUser();
}