/**
 * Token Manager
 * 
 * Manages JWT token storage, retrieval, and validation
 */

export class TokenManager {
  private tokenKey: string;
  private refreshTokenKey: string;

  constructor(tokenKey: string = 'auth_token', refreshTokenKey: string = 'refresh_token') {
    this.tokenKey = tokenKey;
    this.refreshTokenKey = refreshTokenKey;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  setRefreshToken(token: string): void {
    localStorage.setItem(this.refreshTokenKey, token);
  }

  clearRefreshToken(): void {
    localStorage.removeItem(this.refreshTokenKey);
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Parse JWT token
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= expirationTime;
    } catch (err) {
      console.error('Failed to parse token:', err);
      return true;
    }
  }

  getTokenPayload(): any | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (err) {
      console.error('Failed to parse token payload:', err);
      return null;
    }
  }

  clearAll(): void {
    this.clearToken();
    this.clearRefreshToken();
  }
}
