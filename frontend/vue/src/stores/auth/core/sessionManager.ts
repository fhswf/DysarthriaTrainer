/**
 * Session Manager
 * 
 * Manages user session lifecycle and validation
 */

import type { SessionInfo } from '../auth.types';

export class SessionManager {
  private sessionInfo: SessionInfo = {
    isActive: false,
  };

  initialize(userId: string | number): void {
    this.sessionInfo = {
      isActive: true,
      startTime: new Date(),
      lastActivity: new Date(),
      userId,
    };
  }

  updateActivity(): void {
    if (this.sessionInfo.isActive) {
      this.sessionInfo.lastActivity = new Date();
    }
  }

  setExpiration(expiresAt: Date): void {
    this.sessionInfo.expiresAt = expiresAt;
  }

  terminate(): void {
    this.sessionInfo = {
      isActive: false,
    };
  }

  isActive(): boolean {
    return this.sessionInfo.isActive;
  }

  isExpired(): boolean {
    if (!this.sessionInfo.expiresAt) return false;
    return Date.now() >= this.sessionInfo.expiresAt.getTime();
  }

  getInfo(): SessionInfo {
    return { ...this.sessionInfo };
  }

  validate(): boolean {
    return this.isActive() && !this.isExpired();
  }
}
