/**
 * Tests for Cost Tracker
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CostTracker, ApiCallType } from '../../../monitoring/cost-tracker';
import { Logger } from '../../../utils/logging';

// Mock firebase-admin
vi.mock('firebase-admin', () => {
  // Mock Firestore
  const mockCollection = vi.fn().mockReturnValue({
    add: vi.fn().mockResolvedValue({}),
    doc: vi.fn().mockReturnValue({
      set: vi.fn().mockResolvedValue({})
    }),
    where: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue({
      empty: true,
      forEach: vi.fn(),
      docs: []
    })
  });
  
  const mockFirestore = vi.fn().mockReturnValue({
    collection: mockCollection
  });
  
  return {
    firestore: vi.fn().mockReturnValue(mockFirestore()),
    Timestamp: {
      now: vi.fn().mockReturnValue({ seconds: 1234567890, nanoseconds: 0 }),
      fromDate: vi.fn().mockImplementation(date => ({ 
        seconds: Math.floor(date.getTime() / 1000), 
        nanoseconds: 0 
      }))
    }
  };
});

// Mock environment-config
vi.mock('../../../config/environment-config', () => {
  return {
    getEnvironmentConfig: vi.fn().mockReturnValue({
      cost: {
        dailyBudget: 10,
        alertThresholdPercent: 80,
        enableUsageTracking: true,
        enableCostAllocationByUser: true,
        enableCostAllocationByWorld: true
      }
    })
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

describe('CostTracker', () => {
  let costTracker: CostTracker;
  let mockLogger: Logger;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogger = new Logger('test');
    costTracker = new CostTracker(mockLogger);
  });
  
  describe('constructor', () => {
    it('should initialize with environment config', () => {
      // Check that getEnvironmentConfig was called
      const getEnvironmentConfig = require('../../../config/environment-config').getEnvironmentConfig;
      expect(getEnvironmentConfig).toHaveBeenCalled();
      
      // Check that logger.info was called with config values
      expect(mockLogger.info).toHaveBeenCalledWith('Cost tracker initialized', expect.objectContaining({
        dailyBudget: 10,
        alertThresholdPercent: 80,
        enableUsageTracking: true
      }));
    });
  });
  
  describe('calculateCost', () => {
    it('should calculate cost correctly for TEXT_EMBEDDING', () => {
      const cost = costTracker.calculateCost(ApiCallType.TEXT_EMBEDDING, 1000);
      expect(cost).toBe(0.1); // 1000 units * $0.0001 per unit
    });
    
    it('should calculate cost correctly for VECTOR_SEARCH', () => {
      const cost = costTracker.calculateCost(ApiCallType.VECTOR_SEARCH, 100);
      expect(cost).toBe(0.001); // 100 units * $0.00001 per unit
    });
    
    it('should calculate cost correctly for RELATIONSHIP_INFERENCE', () => {
      const cost = costTracker.calculateCost(ApiCallType.RELATIONSHIP_INFERENCE, 50);
      expect(cost).toBe(0.01); // 50 units * $0.0002 per unit
    });
    
    it('should calculate cost correctly for CONTENT_GENERATION', () => {
      const cost = costTracker.calculateCost(ApiCallType.CONTENT_GENERATION, 10);
      expect(cost).toBe(0.01); // 10 units * $0.001 per unit
    });
    
    it('should calculate cost correctly for SESSION_ANALYSIS', () => {
      const cost = costTracker.calculateCost(ApiCallType.SESSION_ANALYSIS, 20);
      expect(cost).toBe(0.01); // 20 units * $0.0005 per unit
    });
  });
  
  describe('trackApiCall', () => {
    it('should track API call and save to Firestore', async () => {
      const result = await costTracker.trackApiCall(
        ApiCallType.TEXT_EMBEDDING,
        1000,
        'user123',
        'world456',
        { model: 'test-model' }
      );
      
      // Check that Firestore.collection was called with 'apiCalls'
      const admin = require('firebase-admin');
      expect(admin.firestore().collection).toHaveBeenCalledWith('apiCalls');
      
      // Check that collection.add was called with the correct record
      expect(admin.firestore().collection().add).toHaveBeenCalledWith(expect.objectContaining({
        type: ApiCallType.TEXT_EMBEDDING,
        units: 1000,
        cost: 0.1,
        userId: 'user123',
        worldId: 'world456',
        metadata: { model: 'test-model' }
      }));
      
      // Check that the result contains the correct data
      expect(result).toEqual(expect.objectContaining({
        type: ApiCallType.TEXT_EMBEDDING,
        units: 1000,
        cost: 0.1,
        userId: 'user123',
        worldId: 'world456',
        metadata: { model: 'test-model' }
      }));
      
      // Check that logger.debug was called
      expect(mockLogger.debug).toHaveBeenCalledWith('API call tracked', expect.objectContaining({
        type: ApiCallType.TEXT_EMBEDDING,
        units: 1000,
        cost: 0.1
      }));
    });
    
    it('should skip tracking if usage tracking is disabled', async () => {
      // Mock getEnvironmentConfig to return disabled usage tracking
      const getEnvironmentConfig = require('../../../config/environment-config').getEnvironmentConfig;
      getEnvironmentConfig.mockReturnValueOnce({
        cost: {
          dailyBudget: 10,
          alertThresholdPercent: 80,
          enableUsageTracking: false,
          enableCostAllocationByUser: true,
          enableCostAllocationByWorld: true
        }
      });
      
      // Create a new cost tracker with the mocked config
      const tracker = new CostTracker(mockLogger);
      
      const result = await tracker.trackApiCall(
        ApiCallType.TEXT_EMBEDDING,
        1000,
        'user123',
        'world456'
      );
      
      // Check that Firestore.collection was not called
      const admin = require('firebase-admin');
      expect(admin.firestore().collection).not.toHaveBeenCalled();
      
      // Check that the result contains the correct data
      expect(result).toEqual(expect.objectContaining({
        type: ApiCallType.TEXT_EMBEDDING,
        units: 1000,
        cost: 0,
        userId: 'user123',
        worldId: 'world456'
      }));
    });
    
    it('should handle errors and return a record even if tracking fails', async () => {
      // Mock Firestore.collection.add to throw an error
      const admin = require('firebase-admin');
      const mockAdd = vi.fn().mockRejectedValue(new Error('Firestore error'));
      admin.firestore().collection.mockReturnValueOnce({
        add: mockAdd,
        where: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({
          empty: true,
          forEach: vi.fn(),
          docs: []
        })
      });
      
      const result = await costTracker.trackApiCall(
        ApiCallType.TEXT_EMBEDDING,
        1000,
        'user123',
        'world456'
      );
      
      // Check that logger.error was called
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to track API call', expect.any(Error));
      
      // Check that the result contains the correct data
      expect(result).toEqual(expect.objectContaining({
        type: ApiCallType.TEXT_EMBEDDING,
        units: 1000,
        cost: 0.1,
        userId: 'user123',
        worldId: 'world456'
      }));
    });
  });
  
  describe('getDailyUsage', () => {
    it('should get daily usage from Firestore', async () => {
      // Mock Firestore.collection.where.get to return API calls
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockResolvedValue({
        empty: false,
        forEach: vi.fn().mockImplementation(callback => {
          callback({ data: () => ({ cost: 0.1 }) });
          callback({ data: () => ({ cost: 0.2 }) });
          callback({ data: () => ({ cost: 0.3 }) });
        }),
        docs: []
      });
      admin.firestore().collection().where.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet
        })
      });
      
      const result = await costTracker.getDailyUsage('2023-01-01');
      
      // Check that Firestore.collection was called with 'apiCalls'
      expect(admin.firestore().collection).toHaveBeenCalledWith('apiCalls');
      
      // Check that collection.where was called with the correct date range
      expect(admin.firestore().collection().where).toHaveBeenCalledWith(
        'timestamp',
        '>=',
        expect.anything()
      );
      
      // Check that the result is the sum of the costs
      expect(result).toBe(0.6);
    });
    
    it('should return cached daily usage if available', async () => {
      // First call to cache the result
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockResolvedValue({
        empty: false,
        forEach: vi.fn().mockImplementation(callback => {
          callback({ data: () => ({ cost: 0.1 }) });
          callback({ data: () => ({ cost: 0.2 }) });
        }),
        docs: []
      });
      admin.firestore().collection().where.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet
        })
      });
      
      await costTracker.getDailyUsage('2023-01-01');
      
      // Reset mocks
      vi.clearAllMocks();
      
      // Second call should use cached value
      const result = await costTracker.getDailyUsage('2023-01-01');
      
      // Check that Firestore.collection was not called
      expect(admin.firestore().collection).not.toHaveBeenCalled();
      
      // Check that the result is the cached value
      expect(result).toBe(0.3);
    });
    
    it('should handle errors and return 0', async () => {
      // Mock Firestore.collection.where.get to throw an error
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockRejectedValue(new Error('Firestore error'));
      admin.firestore().collection().where.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet
        })
      });
      
      const result = await costTracker.getDailyUsage('2023-01-01');
      
      // Check that logger.error was called
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to get daily usage for 2023-01-01',
        expect.any(Error)
      );
      
      // Check that the result is 0
      expect(result).toBe(0);
    });
  });
  
  describe('checkBudget', () => {
    it('should create a budget alert if threshold is exceeded', async () => {
      // Mock getDailyUsage to return a value that exceeds the threshold
      vi.spyOn(costTracker, 'getDailyUsage').mockResolvedValue(8.5); // 85% of $10 budget
      
      // Mock Firestore.collection.where.get to return no existing alerts
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockResolvedValue({
        empty: true,
        forEach: vi.fn(),
        docs: []
      });
      admin.firestore().collection().where.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet
        })
      });
      
      await costTracker.checkBudget();
      
      // Check that Firestore.collection was called with 'budgetAlerts'
      expect(admin.firestore().collection).toHaveBeenCalledWith('budgetAlerts');
      
      // Check that collection.doc.set was called with the correct alert
      expect(admin.firestore().collection().doc().set).toHaveBeenCalledWith(
        expect.objectContaining({
          currentCost: 8.5,
          budget: 10,
          percentageUsed: 85,
          thresholdPercentage: 80,
          acknowledged: false
        })
      );
      
      // Check that logger.warn was called
      expect(mockLogger.warn).toHaveBeenCalledWith('Budget alert created', expect.objectContaining({
        currentCost: 8.5,
        budget: 10,
        percentageUsed: 85
      }));
    });
    
    it('should not create a budget alert if threshold is not exceeded', async () => {
      // Mock getDailyUsage to return a value that does not exceed the threshold
      vi.spyOn(costTracker, 'getDailyUsage').mockResolvedValue(7); // 70% of $10 budget
      
      await costTracker.checkBudget();
      
      // Check that Firestore.collection was not called with 'budgetAlerts'
      const admin = require('firebase-admin');
      expect(admin.firestore().collection).not.toHaveBeenCalledWith('budgetAlerts');
      
      // Check that logger.warn was not called
      expect(mockLogger.warn).not.toHaveBeenCalledWith('Budget alert created', expect.anything());
    });
    
    it('should not create a budget alert if one already exists for today', async () => {
      // Mock getDailyUsage to return a value that exceeds the threshold
      vi.spyOn(costTracker, 'getDailyUsage').mockResolvedValue(8.5); // 85% of $10 budget
      
      // Mock Firestore.collection.where.get to return an existing alert
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockResolvedValue({
        empty: false,
        forEach: vi.fn(),
        docs: [{ id: 'existing-alert' }]
      });
      admin.firestore().collection().where.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet
        })
      });
      
      await costTracker.checkBudget();
      
      // Check that collection.doc.set was not called
      expect(admin.firestore().collection().doc().set).not.toHaveBeenCalled();
      
      // Check that logger.warn was not called
      expect(mockLogger.warn).not.toHaveBeenCalledWith('Budget alert created', expect.anything());
    });
    
    it('should handle errors', async () => {
      // Mock getDailyUsage to throw an error
      vi.spyOn(costTracker, 'getDailyUsage').mockRejectedValue(new Error('Test error'));
      
      await costTracker.checkBudget();
      
      // Check that logger.error was called
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to check budget', expect.any(Error));
    });
  });
  
  describe('getUsageSummary', () => {
    it('should return usage summary for the specified period', async () => {
      // Mock Firestore.collection.where.get to return API calls
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockResolvedValue({
        empty: false,
        forEach: vi.fn().mockImplementation(callback => {
          callback({
            data: () => ({
              type: ApiCallType.TEXT_EMBEDDING,
              cost: 0.1,
              userId: 'user1',
              worldId: 'world1'
            })
          });
          callback({
            data: () => ({
              type: ApiCallType.VECTOR_SEARCH,
              cost: 0.2,
              userId: 'user1',
              worldId: 'world2'
            })
          });
          callback({
            data: () => ({
              type: ApiCallType.TEXT_EMBEDDING,
              cost: 0.3,
              userId: 'user2',
              worldId: 'world1'
            })
          });
        }),
        docs: []
      });
      admin.firestore().collection().where.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet
        })
      });
      
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      const result = await costTracker.getUsageSummary(startDate, endDate);
      
      // Check that Firestore.collection was called with 'apiCalls'
      expect(admin.firestore().collection).toHaveBeenCalledWith('apiCalls');
      
      // Check that collection.where was called with the correct date range
      expect(admin.firestore().collection().where).toHaveBeenCalledWith(
        'timestamp',
        '>=',
        expect.anything()
      );
      expect(admin.firestore().collection().where().where).toHaveBeenCalledWith(
        'timestamp',
        '<=',
        expect.anything()
      );
      
      // Check that the result contains the correct summary
      expect(result.totalCost).toBe(0.6);
      expect(result.costByType[ApiCallType.TEXT_EMBEDDING]).toBe(0.4);
      expect(result.costByType[ApiCallType.VECTOR_SEARCH]).toBe(0.2);
      expect(result.costByUser['user1']).toBe(0.3);
      expect(result.costByUser['user2']).toBe(0.3);
      expect(result.costByWorld['world1']).toBe(0.4);
      expect(result.costByWorld['world2']).toBe(0.2);
      expect(result.callCount).toBe(3);
      expect(result.callCountByType[ApiCallType.TEXT_EMBEDDING]).toBe(2);
      expect(result.callCountByType[ApiCallType.VECTOR_SEARCH]).toBe(1);
      expect(result.startDate).toBe(startDate);
      expect(result.endDate).toBe(endDate);
    });
    
    it('should handle errors', async () => {
      // Mock Firestore.collection.where.get to throw an error
      const admin = require('firebase-admin');
      const mockGet = vi.fn().mockRejectedValue(new Error('Firestore error'));
      admin.firestore().collection().where.mockReturnValue({
        where: vi.fn().mockReturnValue({
          get: mockGet
        })
      });
      
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-01-31');
      
      await expect(costTracker.getUsageSummary(startDate, endDate)).rejects.toThrow('Failed to get usage summary');
      
      // Check that logger.error was called
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to get usage summary', expect.any(Error));
    });
  });
});
