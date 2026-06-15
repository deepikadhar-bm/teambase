// ============================================================================
// TOKEN MANAGER (Enterprise Grade)
// ----------------------------------------------------------------------------
// PURPOSE:
// - Holds authentication token (JWT or session key) for the entire framework
// - Ensures all API requests use the same token (centralized storage)
// - Validates expiry → prevents invalid tokens from being used
// - Provides TTL (time left) for optional token auto-refresh mechanisms
// - Works with APIClient → automatically injects Authorization header
//
// INTERNAL FLOW:
// --------------
// AuthService.login() → tokenManager.setToken(token)
// APIClient → buildHeaders() → tokenManager.getToken()
// API Calls use Authorization: Bearer <token>
// logout() → tokenManager.clearToken()
//
// WHY SINGLETON?
// --------------
// - One login per test run
// - Shared token across all APIClients and Services
// ============================================================================

import { logger } from "./logger";

export interface TokenData {
  token: string;
  expiresAt: number; // expiry timestamp (epoch ms)
}

export class TokenManager {
  private static instance: TokenManager;

  // In-memory token storage (never written to disk)
  private tokenData: TokenData | null = null;

  private log = logger;

  private constructor() {}

  // ============================================================================
  // SINGLETON INSTANCE
  // ----------------------------------------------------------------------------
  // Ensures only ONE TokenManager exists throughout the test execution
  // ============================================================================
  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // ============================================================================
  // STORE TOKEN
  // ----------------------------------------------------------------------------
  // HOW IT WORKS:
  // - Saves token + expiry time (default: 1 hour)
  // - APIClient uses this for Authorization header
  // ============================================================================
  public setToken(token: string, expiresInSeconds: number = 3600): void {
    if (!token) {
      this.log.warn("⚠️ Attempted to store empty token — ignoring.");
      return;
    }

    this.tokenData = {
      token,
      expiresAt: Date.now() + expiresInSeconds * 1000,
    };

    this.log.info("🔐 Token stored successfully", {
      expiresInSeconds,
      expiresAt: new Date(this.tokenData.expiresAt).toISOString(),
    });
  }

  // ============================================================================
  // GET TOKEN (Returns null if absent or expired)
  // ----------------------------------------------------------------------------
  // HOW IT WORKS:
  // - If no token → return null
  // - If expired → return null
  // - Else return token string
  // APIClient will skip adding Authorization if token = null
  // ============================================================================
  public getToken(): string | null {
    if (!this.tokenData) {
      this.log.warn("⚠️ No token found (null)");
      return null;
    }

    if (this.isTokenExpired()) {
      this.log.warn("⛔ Token expired — returning null");
      return null;
    }

    return this.tokenData.token;
  }

  // ============================================================================
  // CHECK EXPIRY
  // ----------------------------------------------------------------------------
  // HOW IT WORKS:
  // - If no token, treat as expired
  // - Compares current time vs expiry timestamp
  // ============================================================================
  public isTokenExpired(): boolean {
    if (!this.tokenData) return true;
    return Date.now() >= this.tokenData.expiresAt;
  }

  // ============================================================================
  // GET REMAINING TTL (Seconds)
  // ----------------------------------------------------------------------------
  // Useful for auto-refresh logic:
  // - If TTL < 60 secs → refresh token
  // ============================================================================
  public getRemainingTTL(): number {
    if (!this.tokenData) return 0;

    return Math.max(
      0,
      Math.floor((this.tokenData.expiresAt - Date.now()) / 1000)
    );
  }

  // ============================================================================
  // CLEAR TOKEN
  // ----------------------------------------------------------------------------
  // HOW IT WORKS:
  // - Used on logout
  // - Removes token from memory
  // ============================================================================
  public clearToken(): void {
    this.tokenData = null;
    this.log.info("🔓 Token cleared");
  }
}

// Export global singleton
export const tokenManager = TokenManager.getInstance();
