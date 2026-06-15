// ============================================================================
// AUTH SERVICE (Enterprise Grade)
// ----------------------------------------------------------------------------
// PURPOSE:
// - Handles all authentication-related API logic
// - Supports: login(), register(), logout()
// - Uses APIClient for HTTP requests (with retry + timing + logging)
// - Uses TokenManager to store JWT tokens securely in runtime
// - Uses enterprise logger for detailed logging.
//
// HOW IT WORKS:
// 1. login() sends POST /login → on success stores JWT for all future calls
// 2. register() sends POST /register → returns new user id + token
// 3. logout() clears token from TokenManager
// 4. APIClient automatically attaches stored token on every request
//
// Flow:
//      Test Case → AuthService.login()
//               → APIClient.post()
//               → TokenManager stores token
//               → Future API calls include Authorization header
// ============================================================================

import { APIClient } from "../clients/apiClient";        
import { logger } from "../utils/logger";
import { tokenManager } from "../utils/tokenManager";

export class AuthService {
  private readonly client: APIClient;    // For POST/GET/PUT/DELETE operations
  private readonly log = logger;         // Enterprise logger instance
  private readonly tokenStore = tokenManager; // Global token storage

  constructor(apiClient: APIClient) {
    this.client = apiClient;
  }

  // ============================================================================
  // LOGIN (POST /login)
  // ============================================================================
  // HOW IT WORKS:
  // 1. Sends POST request to /login using APIClient
  // 2. APIClient handles retry, errors, headers, JSON parsing
  // 3. If successful → server returns a token
  // 4. Token is stored in TokenManager (used automatically in next API calls)
  // 5. Returns the token to caller
  // ============================================================================
  public async login(email: string, password: string): Promise<string> {
    this.log.info("🔐 Attempting login...", { email });

    // Make API call
    const response = await this.client.post("/login", { email, password });

    // Validate HTTP status + token existence
    if (response.status !== 200 || !response.data?.token) {
      this.log.error("❌ Login failed", {
        status: response.status,
        body: response.data
      });
      throw new Error(`Login failed: HTTP ${response.status}`);
    }

    const token = response.data.token;

    // Save token so APIClient can inject Authorization header automatically
    this.tokenStore.setToken(token, 3600); // token expiry = 1 hour

    this.log.pass("✅ Login successful");

    return token;
  }

  // ============================================================================
  // REGISTER (POST /register)
  // ============================================================================
  // HOW IT WORKS:
  // 1. Sends POST /register with { email, password }
  // 2. ReqRes returns: { id, token }
  // 3. Token NOT used for system-wide auth (ReqRes limitation), but returned
  // 4. Caller can choose to store or use it
  // ============================================================================
  public async register(email: string, password: string): Promise<any> {
    this.log.info("📝 Attempting registration...", { email });

    const response = await this.client.post("/register", { email, password });

    // Verify API returned success
    if (response.status !== 200) {
      this.log.error("❌ Registration failed", {
        status: response.status,
        body: response.data
      });
      throw new Error(`Registration failed: HTTP ${response.status}`);
    }

    this.log.pass("🎉 Registration successful");

    // Return payload: { id: 4, token: "QpwL5tke4Pnpja7X4" }
    return response.data;
  }

  // ============================================================================
  // LOGOUT
  // ============================================================================
  // HOW IT WORKS:
  // - Removes stored JWT from TokenManager
  // - Future API requests will NOT include Authorization header anymore
  // ============================================================================
  public logout(): void {
    this.tokenStore.clearToken();
    this.log.info("🚪 Logged out (token cleared)");
  }
}
