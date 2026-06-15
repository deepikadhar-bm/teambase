// ============================================================================
// API CLIENT (Enterprise Grade)
// ----------------------------------------------------------------------------
// ROLE:
// The central engine for all REST API communication in your automation project.
// Every API call (Auth, Users, Products, etc.) passes through this client.
//
// WHAT IT PROVIDES:
// - Automatic JWT injection from TokenManager
// - ConfigManager-driven retry policy + timeout
// - Consistent logs (request + response)
// - Unified response format (APIResponse interface)
// - Automatic JSON parsing fallback
// - URL building + query param handling
// - Response time measurement
//
// BENEFITS:
// - Every API call behaves the same (predictable, safe)
// - Logging/debugging becomes easy
// - No repetition of fetch(), error handling, JSON parsing
// ============================================================================

import { APIRequestContext } from "@playwright/test";
import { configManager } from "../config/config";
import { logger } from "../utils/logger";
import { tokenManager } from "../utils/tokenManager";

// ============================================================================
// RESPONSE SHAPE FOR ALL API CALLS (Unified Output)
// ============================================================================
export interface APIResponse {
  status: number;            // HTTP status code (200, 201, 404, 500...)
  statusText: string;        // Human-readable HTTP text
  headers: Record<string, any>;
  data: any;                 // Parsed JSON (or raw text fallback)
  responseTime: number;      // Execution time in ms
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================
export class APIClient {
  private readonly request: APIRequestContext;    // Playwright API Request Context
  private readonly config = configManager;        // BaseURL, retries, timeouts
  private readonly log = logger;                  // Logging provider
  private readonly tokenStore = tokenManager;     // Token provider for JWT auth

  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // ==============================================================================
  // 🔵 BUILD HEADERS (Automatic JWT Injection)
  // ------------------------------------------------------------------------------
  // - Adds JSON headers
  // - Adds Authorization: Bearer <JWT> (if stored)
  // ==============================================================================
  private async buildHeaders(customHeaders?: any): Promise<Record<string, string>> {
    const token = this.tokenStore.getToken(); // Global JWT stored from login API

    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...customHeaders,
    };

    // Inject Bearer token if available
    if (token) {
      baseHeaders["Authorization"] = `Bearer ${token}`;
    }

    return baseHeaders;
  }

  // ==============================================================================
  // 🔵 PUBLIC METHODS (GET / POST / PUT / DELETE)
  // ==============================================================================
  async get(endpoint: string, options?: any): Promise<APIResponse> {
    return this.execute("GET", endpoint, null, options);
  }

  async post(endpoint: string, payload?: any, options?: any): Promise<APIResponse> {
    return this.execute("POST", endpoint, payload, options);
  }

  async put(endpoint: string, payload?: any, options?: any): Promise<APIResponse> {
    return this.execute("PUT", endpoint, payload, options);
  }
  async patch(endpoint: string, payload?: any, options?: any): Promise<APIResponse> {
    return this.execute("PATCH", endpoint, payload, options);
}


  async delete(endpoint: string, options?: any): Promise<APIResponse> {
    return this.execute("DELETE", endpoint, null, options);
  }

  // ==============================================================================
  // 🔵 CORE EXECUTION ENGINE
  // ------------------------------------------------------------------------------
  // Handles:
  // - URL building
  // - Query params
  // - Retry attempts
  // - Logging
  // - JSON parsing
  // - Response shaping
  // ==============================================================================
  private async execute(
    method: "GET" | "POST" | "PUT" |"PATCH"| "DELETE",
    endpoint: string,
    payload?: any,
    options?: any
  ): Promise<APIResponse> {

    // -------------------------------------------------------------------------
    // 1️⃣ Construct final API URL (safe baseURL + endpoint)
    // -------------------------------------------------------------------------
    const base = this.config.getBaseURL().replace(/\/+$/, "");       // Remove trailing slashes
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    let url = `${base}${path}`;

    // -------------------------------------------------------------------------
    // 2️⃣ Apply query params manually (`params:` does NOT work in Playwright)
    // -------------------------------------------------------------------------
    if (options?.params) {
      const qs = new URLSearchParams(options.params).toString();
      url += `?${qs}`;
    }

    const retries = this.config.getRetryAttempts();
    const timeout = this.config.getTimeout();
    const headers = await this.buildHeaders(options?.headers);

    let attempt = 0;
    let lastError: any = null;

    // -------------------------------------------------------------------------
    // 3️⃣ RETRY LOOP
    // -------------------------------------------------------------------------
    while (attempt <= retries) {
      attempt++;

      try {
        this.log.info(`🌐 ${method} → ${url} (Attempt ${attempt}/${retries + 1})`, {
          headers,
          payload,
        });

        const startTime = Date.now();

        // -------------------------------------------------------------------
        // 4️⃣ Actual API call via Playwright
        // -------------------------------------------------------------------
        const response = await this.request.fetch(url, {
          method,
          headers,
          data: payload,
          timeout,
        });

        const responseTime = Date.now() - startTime;

        // Return shaped response object
        return this.handleResponse(response, url, responseTime);

      } catch (error) {
        lastError = error;

        this.log.warn(`⚠️ API ${method} attempt failed: ${url}`, { error });

        // If no retries left → break immediately
        if (attempt > retries) break;
      }
    }

    // -------------------------------------------------------------------------
    // 5️⃣ FINAL FAILURE AFTER ALL RETRIES
    // -------------------------------------------------------------------------
    this.log.error(`❌ API ${method} failed after ${retries + 1} attempts`, {
      url,
      error: lastError,
    });

    throw lastError;
  }

  // ==============================================================================
  // 🔵 PROCESS RAW Playwright Response → APIResponse Format
  // ==============================================================================
  private async handleResponse(response: any, url: string, time: number): Promise<APIResponse> {
    const status = response.status();
    const statusText = response.statusText();
    const headers = response.headers();

    let data: any;

    // -------------------------------------------------------------------------
    // Try parsing JSON → fallback to text()
    // -------------------------------------------------------------------------
    try {
      data = await response.json();
    } catch {
      data = await response.text();
    }

    // Unified API response object
    const apiResponse: APIResponse = {
      status,
      statusText,
      headers,
      data,
      responseTime: time,
    };

    // -------------------------------------------------------------------------
    // Logging strategy: color-coding based on status group
    // -------------------------------------------------------------------------
    if (status >= 200 && status < 300) {
      this.log.info(`✅ API Success (${status}) → ${url}`, {
        responseTime: `${time} ms`,
      });
    } else if (status >= 400 && status < 500) {
      this.log.warn(`⚠️ API Client Error (${status}) → ${url}`, {
        responseTime: `${time} ms`,
      });
    } else if (status >= 500) {
      this.log.error(`❌ API Server Error (${status}) → ${url}`, {
        responseTime: `${time} ms`,
      });
    }

    return apiResponse;
  }
}
