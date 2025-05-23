/**
 * Security Utilities for Vertex AI Integration
 * 
 * This file provides security utilities for Vertex AI integration,
 * including request origin validation, IP restriction, rate limiting,
 * and security event logging.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { Logger } from "../utils/logging";
import { AppError, ErrorType } from "../utils/error-handling";

/**
 * IP range in CIDR notation
 */
interface CIDRRange {
  /** CIDR notation (e.g., "192.168.1.0/24") */
  cidr: string;
  /** Parsed network address */
  networkAddress: number;
  /** Subnet mask */
  subnetMask: number;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  /** Number of requests in the current window */
  count: number;
  /** Timestamp when the rate limit window resets */
  resetTime: number;
}

/**
 * Security configuration
 */
export interface SecurityConfig {
  /** List of allowed IP addresses or CIDR ranges */
  allowedIPs: string[];
  /** List of allowed origins */
  allowedOrigins: string[];
  /** Whether to enable rate limiting */
  enableRateLimiting: boolean;
  /** Maximum number of requests per minute */
  maxRequestsPerMinute: number;
  /** Whether to log security events */
  enableSecurityLogging: boolean;
}

/**
 * Security utilities for Vertex AI integration
 */
export class SecurityUtils {
  private logger: Logger;
  private config: SecurityConfig;
  private rateLimits: Map<string, RateLimitEntry> = new Map();
  private parsedCIDRRanges: CIDRRange[] = [];
  private db: FirebaseFirestore.Firestore | null = null;
  
  /** Rate limit window in milliseconds (1 minute) */
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000;

  /**
   * Create a new security utilities instance
   * @param config Security configuration
   * @param logger Logger instance
   */
  constructor(config: SecurityConfig, logger: Logger) {
    this.config = config;
    this.logger = logger.child("SecurityUtils");
    
    // Parse CIDR ranges
    this.parseCIDRRanges();
    
    // Initialize Firestore if security logging is enabled
    if (config.enableSecurityLogging) {
      try {
        this.db = admin.firestore();
      } catch (error) {
        this.logger.warn("Failed to initialize Firestore for security logging", error as Error);
      }
    }
    
    this.logger.info("Security utilities initialized", {
      allowedIPsCount: config.allowedIPs.length,
      allowedOriginsCount: config.allowedOrigins.length,
      enableRateLimiting: config.enableRateLimiting,
      maxRequestsPerMinute: config.maxRequestsPerMinute,
      enableSecurityLogging: config.enableSecurityLogging
    });
  }

  /**
   * Parse CIDR ranges from configuration
   */
  private parseCIDRRanges(): void {
    this.parsedCIDRRanges = [];
    
    for (const ip of this.config.allowedIPs) {
      // Check if IP is in CIDR notation
      if (ip.includes('/')) {
        try {
          const [address, prefixStr] = ip.split('/');
          const prefix = parseInt(prefixStr, 10);
          
          if (isNaN(prefix) || prefix < 0 || prefix > 32) {
            this.logger.warn(`Invalid CIDR prefix: ${ip}`);
            continue;
          }
          
          const networkAddress = this.ipToInt(address);
          const subnetMask = ~(0xFFFFFFFF >>> prefix);
          
          this.parsedCIDRRanges.push({
            cidr: ip,
            networkAddress: networkAddress & subnetMask,
            subnetMask
          });
        } catch (error) {
          this.logger.warn(`Failed to parse CIDR range: ${ip}`, error as Error);
        }
      }
    }
  }

  /**
   * Convert IP address to integer
   * @param ip IP address
   * @returns Integer representation of IP address
   */
  private ipToInt(ip: string): number {
    const parts = ip.split('.');
    
    if (parts.length !== 4) {
      throw new Error(`Invalid IP address: ${ip}`);
    }
    
    return ((parseInt(parts[0], 10) << 24) |
            (parseInt(parts[1], 10) << 16) |
            (parseInt(parts[2], 10) << 8) |
            parseInt(parts[3], 10)) >>> 0;
  }

  /**
   * Validate request origin
   * @param context Functions context
   * @returns Whether the request origin is valid
   */
  validateRequestOrigin(context: functions.https.CallableContext): boolean {
    // If no allowed origins are configured, allow all origins
    if (this.config.allowedOrigins.length === 0) {
      return true;
    }

    // Get origin from context
    const origin = context.rawRequest.headers.origin;
    if (!origin) {
      this.logger.warn("No origin header in request");
      this.logSecurityEvent("ORIGIN_VALIDATION_FAILED", {
        reason: "No origin header",
        ip: context.rawRequest.ip
      });
      return false;
    }

    // Check if origin is allowed
    const isAllowed = this.config.allowedOrigins.some(allowedOrigin => {
      // Support wildcards in allowed origins
      if (allowedOrigin.includes('*')) {
        const regex = new RegExp('^' + allowedOrigin.replace(/\*/g, '.*') + '$');
        return regex.test(origin as string);
      }
      return allowedOrigin === origin;
    });

    if (!isAllowed) {
      this.logger.warn("Request from unauthorized origin", { origin });
      this.logSecurityEvent("ORIGIN_VALIDATION_FAILED", {
        origin,
        ip: context.rawRequest.ip
      });
    }

    return isAllowed;
  }

  /**
   * Validate request IP
   * @param context Functions context
   * @returns Whether the request IP is valid
   */
  validateRequestIP(context: functions.https.CallableContext): boolean {
    // If no allowed IPs are configured, allow all IPs
    if (this.config.allowedIPs.length === 0) {
      return true;
    }

    // Get IP from context
    const ip = context.rawRequest.ip;
    if (!ip) {
      this.logger.warn("No IP address in request");
      this.logSecurityEvent("IP_VALIDATION_FAILED", {
        reason: "No IP address"
      });
      return false;
    }

    // Check if IP is allowed
    let isAllowed = this.config.allowedIPs.includes(ip);
    
    // If not directly allowed, check CIDR ranges
    if (!isAllowed && this.parsedCIDRRanges.length > 0) {
      try {
        const ipInt = this.ipToInt(ip);
        
        isAllowed = this.parsedCIDRRanges.some(range => {
          return (ipInt & range.subnetMask) === range.networkAddress;
        });
      } catch (error) {
        this.logger.warn(`Failed to check IP against CIDR ranges: ${ip}`, error as Error);
      }
    }

    if (!isAllowed) {
      this.logger.warn("Request from unauthorized IP", { ip });
      this.logSecurityEvent("IP_VALIDATION_FAILED", {
        ip
      });
    }

    return isAllowed;
  }

  /**
   * Check rate limit for a request
   * @param identifier Identifier for rate limiting (e.g., IP or user ID)
   * @returns Whether the request is within rate limits
   */
  checkRateLimit(identifier: string): boolean {
    // If rate limiting is disabled, allow all requests
    if (!this.config.enableRateLimiting) {
      return true;
    }

    const now = Date.now();
    const rateLimit = this.rateLimits.get(identifier);

    // If no rate limit entry exists, create one
    if (!rateLimit) {
      this.rateLimits.set(identifier, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW_MS
      });
      return true;
    }

    // If rate limit window has expired, reset count
    if (now > rateLimit.resetTime) {
      this.rateLimits.set(identifier, {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW_MS
      });
      return true;
    }

    // Check if rate limit is exceeded
    if (rateLimit.count >= this.config.maxRequestsPerMinute) {
      this.logger.warn("Rate limit exceeded", { identifier });
      this.logSecurityEvent("RATE_LIMIT_EXCEEDED", {
        identifier,
        count: rateLimit.count,
        limit: this.config.maxRequestsPerMinute
      });
      return false;
    }

    // Increment request count
    rateLimit.count++;
    this.rateLimits.set(identifier, rateLimit);
    return true;
  }

  /**
   * Validate request
   * @param context Functions context
   * @param userId Optional user ID for rate limiting
   * @returns Whether the request is valid
   */
  validateRequest(context: functions.https.CallableContext, userId?: string): boolean {
    // Validate origin
    if (!this.validateRequestOrigin(context)) {
      return false;
    }

    // Validate IP
    if (!this.validateRequestIP(context)) {
      return false;
    }

    // Check rate limit
    const identifier = userId || context.rawRequest.ip || 'unknown';
    if (!this.checkRateLimit(identifier)) {
      return false;
    }

    return true;
  }

  /**
   * Log security event
   * @param eventType Event type
   * @param data Event data
   */
  logSecurityEvent(eventType: string, data: Record<string, any>): void {
    if (!this.config.enableSecurityLogging || !this.db) {
      return;
    }

    try {
      this.db.collection('securityEvents').add({
        eventType,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        ...data
      });
    } catch (error) {
      this.logger.error("Failed to log security event", error as Error);
    }
  }
}
