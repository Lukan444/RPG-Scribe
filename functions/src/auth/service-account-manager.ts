/**
 * Service Account Manager for Vertex AI
 *
 * This class handles service account operations for Vertex AI,
 * including token generation, validation, and rotation.
 */

import { GoogleAuth } from "google-auth-library";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";

/**
 * Service Account Manager for Vertex AI
 *
 * This class handles service account operations for Vertex AI,
 * including token generation, validation, and rotation.
 */
export class ServiceAccountManager {
  private auth: GoogleAuth;
  private logger: Logger;
  private tokenCache: Map<string, { token: string, expiry: number }> = new Map();
  private readonly TOKEN_EXPIRY_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Create a new service account manager
   * @param logger Logger instance
   */
  constructor(logger: Logger) {
    this.logger = logger.child("ServiceAccountManager");

    // Initialize Google Auth with appropriate scopes
    this.auth = new GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/cloud-platform"]
    });

    this.logger.info("Service Account Manager initialized");
  }

  /**
   * Get an access token for Vertex AI
   * @returns Access token
   */
  async getAccessToken(): Promise<string> {
    const cacheKey = "vertex-ai-token";
    const cachedToken = this.tokenCache.get(cacheKey);

    // Return cached token if it's still valid
    if (cachedToken && Date.now() < cachedToken.expiry - this.TOKEN_EXPIRY_BUFFER_MS) {
      this.logger.debug("Using cached access token");
      return cachedToken.token;
    }

    try {
      this.logger.debug("Generating new access token");

      // Get client and token
      const client = await this.auth.getClient();
      const tokenResponse = await client.getAccessToken();

      if (!tokenResponse.token) {
        throw new AppError(
          "Failed to get access token from Google Auth",
          ErrorType.AUTHENTICATION,
          401
        );
      }

      // Cache token with expiry
      const expiryTime = Date.now() + 3600 * 1000; // 1 hour
      this.tokenCache.set(cacheKey, {
        token: tokenResponse.token,
        expiry: expiryTime
      });

      this.logger.debug("Access token generated successfully");
      return tokenResponse.token;
    } catch (error) {
      this.logger.error("Failed to get access token", error as Error);
      throw new AppError(
        `Failed to get access token: ${error instanceof Error ? error.message : "Unknown error"}`,
        ErrorType.AUTHENTICATION,
        401,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Validate a token
   * @param token Token to validate
   * @returns Whether the token is valid
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      if (!token || token.trim() === "") {
        this.logger.warn("Empty token provided for validation");
        return false;
      }

      // In a real implementation, we would validate the token with Google Auth
      // For now, we'll just check if it's in our cache
      let isValid = false;

      // Convert entries to array to avoid iterator issues
      Array.from(this.tokenCache.entries()).forEach(([, cachedToken]) => {
        if (cachedToken.token === token && Date.now() < cachedToken.expiry) {
          isValid = true;
        }
      });

      if (isValid) {
        this.logger.debug("Token validated successfully");
        return true;
      }

      this.logger.warn("Token not found in cache or expired");
      return false;
    } catch (error) {
      this.logger.error("Failed to validate token", error as Error);
      return false;
    }
  }

  /**
   * Force token rotation
   * This is useful for security incidents or when a token might be compromised
   */
  async rotateToken(): Promise<string> {
    this.logger.info("Rotating access token");

    // Clear cache to force new token generation
    this.tokenCache.clear();

    // Get new token
    return this.getAccessToken();
  }


}
