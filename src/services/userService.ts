// ============================================================================
// USER SERVICE (Enterprise Grade)
// ----------------------------------------------------------------------------
// PURPOSE:
// - Encapsulates all User-related API logic (CRUD)
// - Uses APIClient for network calls (with retry, timing, logging)
// - Uses schemaValidator for validating API response structure
// - Handles both single-user & list validations
//
// HOW IT WORKS:
// - The service receives the APIClient via constructor
// - Every method logs request intent
// - APIClient sends request → returns unified APIResponse
// - Schema validation is applied where required
// ============================================================================

import { APIClient, APIResponse } from "../clients/apiClient";
import { logger } from "../utils/logger";
import { schemaValidator } from "../utils/schemaValidator";

// ============================================================================
// USER MODEL (Only returned from GET APIs)
// ReqRes GET response includes:
// id, email, first_name, last_name, avatar
// ============================================================================
export interface User {
  id?: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// These match ReqRes CREATE/UPDATE payload structure
//
// WHY REQUIRED?
// ReqRes CREATE/UPDATE uses:
// {
//    "name": "...",
//    "job": "..."
// }
// These DO NOT exist in GET /users schema.
// Hence, separate DTO avoids TypeScript error.
// ============================================================================
export interface CreateUserDTO {
  name: string;
  job: string;
}

export interface UpdateUserDTO {
  name?: string;
  job?: string;
}

export class UserService {
  private readonly client: APIClient;         // Core network handler
  private readonly log = logger;              // Enterprise logger
  private readonly validate = schemaValidator; // Schema validation engine

  constructor(apiClient: APIClient) {
    this.client = apiClient;
  }

  // ============================================================================
  // CREATE USER (POST)
  // HOW IT WORKS:
  // 1. Accepts a CreateUserDTO
  // 2. Logs the request
  // 3. Calls POST /users using APIClient
  // 4. Returns APIResponse containing: id, createdAt
  // ============================================================================
  public async createUser(data: CreateUserDTO): Promise<APIResponse> {
    this.log.info("👤 Creating new user (POST /users)", data);
    return await this.client.post("/users", data);
  }

  // ============================================================================
  // FETCH SINGLE USER (GET /users/:id)
  // HOW IT WORKS:
  // - Sends GET request to endpoint
  // - Response includes user object inside "data" field
  // - Consumer must validate using validateUserSchema()
  // ============================================================================
  public async getUser(userId: number): Promise<APIResponse> {
    this.log.info(`🔍 Fetching user ID: ${userId}`);
    return await this.client.get(`/users/${userId}`);
  }

  // ============================================================================
  // FETCH USERS PAGE (GET /users?page=x)
  // HOW IT WORKS:
  // - Supports pagination
  // - Returns list of user objects in response.data.data[]
  // ============================================================================
  public async getAllUsers(page: number = 1): Promise<APIResponse> {
    this.log.info("📄 Fetching paginated users list", { page });
    return await this.client.get("/users", { params: { page } });
  }

  // ============================================================================
  // UPDATE USER (PUT /users/:id)
  // HOW IT WORKS:
  // 1. Accepts UpdateUserDTO (name/job)
  // 2. Logs request
  // 3. Calls PUT
  // 4. ReqRes returns: updatedAt timestamp
  // ============================================================================
  public async updateUser(
    userId: number,
    updates: UpdateUserDTO
  ): Promise<APIResponse> {
    this.log.info(`✏️ Updating user ID: ${userId}`, updates);
    return await this.client.put(`/users/${userId}`, updates);
  }

  // ============================================================================
  // DELETE USER (DELETE /users/:id)
  // HOW IT WORKS:
  // - Calls DELETE
  // - ReqRes returns only status 204 (no body)
  // ============================================================================
  public async deleteUser(userId: number): Promise<APIResponse> {
    this.log.info(`🗑️ Deleting user ID: ${userId}`);
    return await this.client.delete(`/users/${userId}`);
  }

  // ============================================================================
  // SCHEMA VALIDATION FOR A SINGLE USER
  // HOW IT WORKS:
  // - Defines JSON schema for GET response
  // - Uses generic schemaValidator to ensure:
  //   * Required fields exist
  //   * Types are correct
  //   * Email format is valid
  // ============================================================================
  public validateUserSchema(user: any): { valid: boolean; errors: string[] } {
    const schema = {
      type: "object",
      required: ["id", "email", "first_name", "last_name"],
      properties: {
        id: { type: "number", minimum: 1 },
        email: {
          type: "string",
          pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
        },
        first_name: { type: "string", minLength: 2 },
        last_name: { type: "string", minLength: 2 },
        avatar: { type: "string" },
      },
    };

    return this.validate.validate(user, schema);
  }

  // ============================================================================
  // LIST VALIDATION
  // HOW IT WORKS:
  // - Iterates through each user in the list
  // - Validates user using validateUserSchema()
  // - Collects errors and reports cleanly
  // ============================================================================
  public validateUserListSchema(users: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    users.forEach((user, index) => {
      const result = this.validateUserSchema(user);
      if (!result.valid) {
        errors.push(`User at index ${index} invalid: ${result.errors.join(", ")}`);
      }
    });

    if (errors.length > 0) {
      this.log.error("❌ User list schema validation failed", { errors });
      return { valid: false, errors };
    }

    this.log.debug("✅ All users in list match schema");
    return { valid: true, errors: [] };
  }
}
