/**
 * Tests for Service Account Manager
 */

import { ServiceAccountManager } from "../../auth/service-account-manager";
import { Logger } from "../../utils/logging";
import { GoogleAuth } from "google-auth-library";

// Mock the GoogleAuth class
jest.mock("google-auth-library", () => {
  return {
    GoogleAuth: jest.fn().mockImplementation(() => {
      return {
        getClient: jest.fn().mockResolvedValue({
          getAccessToken: jest.fn().mockResolvedValue({
            token: "mock-access-token"
          })
        })
      };
    })
  };
});

// Mock the Logger class
jest.mock("../../utils/logging", () => {
  return {
    Logger: jest.fn().mockImplementation(() => {
      return {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        child: jest.fn().mockReturnThis()
      };
    })
  };
});

// Mock firebase-functions
jest.mock("firebase-functions", () => {
  return {
    config: jest.fn().mockReturnValue({
      environment: {
        name: "test"
      }
    }),
    logger: {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    }
  };
});

describe("ServiceAccountManager", () => {
  let serviceAccountManager: ServiceAccountManager;
  let mockLogger: Logger;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger = new Logger("test");
    serviceAccountManager = new ServiceAccountManager(mockLogger);
  });

  describe("getAccessToken", () => {
    it("should return a token", async () => {
      const token = await serviceAccountManager.getAccessToken();
      expect(token).toBe("mock-access-token");
    });

    it("should use cached token if available", async () => {
      // First call should get a new token
      await serviceAccountManager.getAccessToken();
      
      // Second call should use cached token
      await serviceAccountManager.getAccessToken();
      
      // GoogleAuth.getClient should only be called once
      expect(GoogleAuth.prototype.getClient).toHaveBeenCalledTimes(1);
    });
  });

  describe("validateToken", () => {
    it("should return false for empty token", async () => {
      const result = await serviceAccountManager.validateToken("");
      expect(result).toBe(false);
    });

    it("should return true for valid token in cache", async () => {
      // First get a token to cache it
      const token = await serviceAccountManager.getAccessToken();
      
      // Then validate it
      const result = await serviceAccountManager.validateToken(token);
      expect(result).toBe(true);
    });
  });

  describe("rotateToken", () => {
    it("should clear cache and get new token", async () => {
      // First get a token to cache it
      await serviceAccountManager.getAccessToken();
      
      // Then rotate it
      const newToken = await serviceAccountManager.rotateToken();
      
      // GoogleAuth.getClient should be called twice
      expect(GoogleAuth.prototype.getClient).toHaveBeenCalledTimes(2);
      expect(newToken).toBe("mock-access-token");
    });
  });
});
