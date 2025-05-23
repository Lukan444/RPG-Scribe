/**
 * Tests for Security Utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SecurityUtils, SecurityConfig } from '../../../auth/security-utils';
import { Logger } from '../../../utils/logging';
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Mock firebase-functions
vi.mock('firebase-functions', () => {
  return {
    https: {
      CallableContext: class CallableContext {
        auth: any;
        rawRequest: any;
        constructor(auth: any, rawRequest: any) {
          this.auth = auth;
          this.rawRequest = rawRequest;
        }
      }
    }
  };
});

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  return {
    firestore: vi.fn().mockReturnValue({
      collection: vi.fn().mockReturnValue({
        add: vi.fn().mockResolvedValue({})
      })
    }),
    FieldValue: {
      serverTimestamp: vi.fn().mockReturnValue('server-timestamp')
    }
  };
});

// Mock the Logger class
vi.mock('../../../utils/logging', () => {
  return {
    Logger: vi.fn().mockImplementation(() => {
      return {
        info: vi.fn(),
        debug: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        child: vi.fn().mockReturnThis()
      };
    })
  };
});

describe('SecurityUtils', () => {
  let securityUtils: SecurityUtils;
  let mockLogger: Logger;
  let config: SecurityConfig;
  let mockContext: functions.https.CallableContext;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = new Logger('test');
    config = {
      allowedIPs: ['192.168.1.1', '10.0.0.0/24'],
      allowedOrigins: ['https://example.com', 'https://*.example.org'],
      enableRateLimiting: true,
      maxRequestsPerMinute: 10,
      enableSecurityLogging: true
    };
    securityUtils = new SecurityUtils(config, mockLogger);
    
    // Create a mock context
    mockContext = new functions.https.CallableContext(
      { uid: 'test-user' },
      { 
        headers: { origin: 'https://example.com' },
        ip: '192.168.1.1'
      }
    );
  });

  describe('validateRequestOrigin', () => {
    it('should allow requests from configured origins', () => {
      const result = securityUtils.validateRequestOrigin(mockContext);
      expect(result).toBe(true);
    });

    it('should allow requests from wildcard origins', () => {
      const context = new functions.https.CallableContext(
        { uid: 'test-user' },
        { 
          headers: { origin: 'https://subdomain.example.org' },
          ip: '192.168.1.1'
        }
      );
      
      const result = securityUtils.validateRequestOrigin(context);
      expect(result).toBe(true);
    });

    it('should reject requests from unauthorized origins', () => {
      const context = new functions.https.CallableContext(
        { uid: 'test-user' },
        { 
          headers: { origin: 'https://malicious.com' },
          ip: '192.168.1.1'
        }
      );
      
      const result = securityUtils.validateRequestOrigin(context);
      expect(result).toBe(false);
    });

    it('should reject requests without origin header', () => {
      const context = new functions.https.CallableContext(
        { uid: 'test-user' },
        { 
          headers: {},
          ip: '192.168.1.1'
        }
      );
      
      const result = securityUtils.validateRequestOrigin(context);
      expect(result).toBe(false);
    });

    it('should allow all origins if none are configured', () => {
      const emptyConfig = {
        ...config,
        allowedOrigins: []
      };
      
      const utils = new SecurityUtils(emptyConfig, mockLogger);
      const context = new functions.https.CallableContext(
        { uid: 'test-user' },
        { 
          headers: { origin: 'https://any-origin.com' },
          ip: '192.168.1.1'
        }
      );
      
      const result = utils.validateRequestOrigin(context);
      expect(result).toBe(true);
    });
  });

  describe('validateRequestIP', () => {
    it('should allow requests from configured IPs', () => {
      const result = securityUtils.validateRequestIP(mockContext);
      expect(result).toBe(true);
    });

    it('should allow requests from configured CIDR ranges', () => {
      const context = new functions.https.CallableContext(
        { uid: 'test-user' },
        { 
          headers: { origin: 'https://example.com' },
          ip: '10.0.0.5'
        }
      );
      
      const result = securityUtils.validateRequestIP(context);
      expect(result).toBe(true);
    });

    it('should reject requests from unauthorized IPs', () => {
      const context = new functions.https.CallableContext(
        { uid: 'test-user' },
        { 
          headers: { origin: 'https://example.com' },
          ip: '1.2.3.4'
        }
      );
      
      const result = securityUtils.validateRequestIP(context);
      expect(result).toBe(false);
    });

    it('should reject requests without IP', () => {
      const context = new functions.https.CallableContext(
        { uid: 'test-user' },
        { 
          headers: { origin: 'https://example.com' },
          ip: undefined
        }
      );
      
      const result = securityUtils.validateRequestIP(context);
      expect(result).toBe(false);
    });

    it('should allow all IPs if none are configured', () => {
      const emptyConfig = {
        ...config,
        allowedIPs: []
      };
      
      const utils = new SecurityUtils(emptyConfig, mockLogger);
      const context = new functions.https.CallableContext(
        { uid: 'test-user' },
        { 
          headers: { origin: 'https://example.com' },
          ip: '1.2.3.4'
        }
      );
      
      const result = utils.validateRequestIP(context);
      expect(result).toBe(true);
    });
  });

  describe('checkRateLimit', () => {
    it('should allow requests within rate limit', () => {
      const result = securityUtils.checkRateLimit('test-user');
      expect(result).toBe(true);
    });

    it('should reject requests exceeding rate limit', () => {
      // Make enough requests to exceed the rate limit
      for (let i = 0; i < 10; i++) {
        securityUtils.checkRateLimit('test-user');
      }
      
      // The next request should be rejected
      const result = securityUtils.checkRateLimit('test-user');
      expect(result).toBe(false);
    });

    it('should reset rate limit after window expires', () => {
      // Make enough requests to exceed the rate limit
      for (let i = 0; i < 10; i++) {
        securityUtils.checkRateLimit('test-user');
      }
      
      // The next request should be rejected
      expect(securityUtils.checkRateLimit('test-user')).toBe(false);
      
      // Mock Date.now to simulate time passing
      const originalDateNow = Date.now;
      Date.now = vi.fn().mockReturnValue(originalDateNow() + 61 * 1000); // 61 seconds later
      
      // The next request should be allowed after the window expires
      expect(securityUtils.checkRateLimit('test-user')).toBe(true);
      
      // Restore Date.now
      Date.now = originalDateNow;
    });

    it('should allow all requests if rate limiting is disabled', () => {
      const disabledConfig = {
        ...config,
        enableRateLimiting: false
      };
      
      const utils = new SecurityUtils(disabledConfig, mockLogger);
      
      // Make many requests
      for (let i = 0; i < 100; i++) {
        const result = utils.checkRateLimit('test-user');
        expect(result).toBe(true);
      }
    });
  });

  describe('validateRequest', () => {
    it('should validate origin, IP, and rate limit', () => {
      const result = securityUtils.validateRequest(mockContext, 'test-user');
      expect(result).toBe(true);
      
      // Spy on the individual validation methods
      const spyOrigin = vi.spyOn(securityUtils, 'validateRequestOrigin');
      const spyIP = vi.spyOn(securityUtils, 'validateRequestIP');
      const spyRateLimit = vi.spyOn(securityUtils, 'checkRateLimit');
      
      securityUtils.validateRequest(mockContext, 'test-user');
      
      expect(spyOrigin).toHaveBeenCalledWith(mockContext);
      expect(spyIP).toHaveBeenCalledWith(mockContext);
      expect(spyRateLimit).toHaveBeenCalledWith('test-user');
    });

    it('should use IP as identifier if user ID is not provided', () => {
      const spyRateLimit = vi.spyOn(securityUtils, 'checkRateLimit');
      
      securityUtils.validateRequest(mockContext);
      
      expect(spyRateLimit).toHaveBeenCalledWith('192.168.1.1');
    });

    it('should return false if origin validation fails', () => {
      vi.spyOn(securityUtils, 'validateRequestOrigin').mockReturnValue(false);
      
      const result = securityUtils.validateRequest(mockContext);
      expect(result).toBe(false);
    });

    it('should return false if IP validation fails', () => {
      vi.spyOn(securityUtils, 'validateRequestOrigin').mockReturnValue(true);
      vi.spyOn(securityUtils, 'validateRequestIP').mockReturnValue(false);
      
      const result = securityUtils.validateRequest(mockContext);
      expect(result).toBe(false);
    });

    it('should return false if rate limit validation fails', () => {
      vi.spyOn(securityUtils, 'validateRequestOrigin').mockReturnValue(true);
      vi.spyOn(securityUtils, 'validateRequestIP').mockReturnValue(true);
      vi.spyOn(securityUtils, 'checkRateLimit').mockReturnValue(false);
      
      const result = securityUtils.validateRequest(mockContext);
      expect(result).toBe(false);
    });
  });

  describe('logSecurityEvent', () => {
    it('should log security events to Firestore', () => {
      securityUtils.logSecurityEvent('TEST_EVENT', { test: 'data' });
      
      expect(admin.firestore().collection).toHaveBeenCalledWith('securityEvents');
      expect(admin.firestore().collection().add).toHaveBeenCalledWith({
        eventType: 'TEST_EVENT',
        timestamp: 'server-timestamp',
        test: 'data'
      });
    });

    it('should not log if security logging is disabled', () => {
      const disabledConfig = {
        ...config,
        enableSecurityLogging: false
      };
      
      const utils = new SecurityUtils(disabledConfig, mockLogger);
      utils.logSecurityEvent('TEST_EVENT', { test: 'data' });
      
      expect(admin.firestore().collection).not.toHaveBeenCalled();
    });
  });
});
