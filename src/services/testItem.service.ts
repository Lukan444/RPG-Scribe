/**
 * Test Item Service
 * 
 * This service extends the enhanced FirestoreService to provide CRUD operations
 * for TestItem entities. It's used for testing the FirestoreService features.
 */
import { 
  FirestoreService, 
  DataTransformer, 
  Validator,
  DateTransformer
} from './firestore.service';
import { TestItem, TestItemPriority, TestItemStatus, TestItemCreationParams, TestItemUpdateParams } from '../models/TestItem';
import { EntityType } from '../models/EntityType';
import { DocumentData, QueryConstraint, where } from 'firebase/firestore';

/**
 * TestItem data transformer
 * Handles conversion between TestItem and Firestore DocumentData
 */
class TestItemTransformer implements DataTransformer<TestItem> {
  private dateTransformer: DateTransformer<DocumentData>;
  
  constructor() {
    // Fields that contain Date objects
    this.dateTransformer = new DateTransformer<DocumentData>(['createdAt', 'updatedAt', 'dueDate']);
  }
  
  toFirestore(data: TestItem): DocumentData {
    // First transform the dates
    const withDates = this.dateTransformer.toFirestore(data as unknown as DocumentData);
    
    // Return the transformed data
    return withDates;
  }
  
  fromFirestore(data: DocumentData): TestItem {
    // First transform the dates
    const withDates = this.dateTransformer.fromFirestore(data);
    
    // Return the transformed data
    return withDates as unknown as TestItem;
  }
}

/**
 * TestItem validator
 * Validates TestItem data before writing to Firestore
 */
class TestItemValidator implements Validator<TestItem> {
  validate(data: TestItem): boolean | string {
    // Validate required fields
    if (!data.name) {
      return 'Name is required';
    }
    
    if (!data.title) {
      return 'Title is required';
    }
    
    if (!data.content) {
      return 'Content is required';
    }
    
    // Validate enum values
    if (data.priority && !Object.values(TestItemPriority).includes(data.priority)) {
      return `Invalid priority: ${data.priority}`;
    }
    
    if (data.status && !Object.values(TestItemStatus).includes(data.status)) {
      return `Invalid status: ${data.status}`;
    }
    
    // Validate counter is a number
    if (data.counter !== undefined && typeof data.counter !== 'number') {
      return 'Counter must be a number';
    }
    
    // Validate tags is an array
    if (data.tags && !Array.isArray(data.tags)) {
      return 'Tags must be an array';
    }
    
    return true;
  }
}

/**
 * TestItemService class
 * Extends FirestoreService to provide CRUD operations for TestItem entities
 */
export class TestItemService extends FirestoreService<TestItem> {
  private static instance: TestItemService;
  
  /**
   * Get the singleton instance of TestItemService
   * @returns TestItemService instance
   */
  public static getInstance(): TestItemService {
    if (!TestItemService.instance) {
      TestItemService.instance = new TestItemService();
    }
    return TestItemService.instance;
  }
  
  /**
   * Create a new TestItemService
   */
  private constructor() {
    super('testItems', {
      transformer: new TestItemTransformer(),
      validator: new TestItemValidator(),
      cachingEnabled: true,
      defaultCacheTTL: 5 * 60 * 1000 // 5 minutes
    });
  }
  
  /**
   * Create a new test item
   * @param params Test item creation parameters
   * @returns Test item ID
   */
  async createTestItem(params: TestItemCreationParams): Promise<string> {
    const { 
      name, 
      description, 
      title, 
      content, 
      priority = TestItemPriority.MEDIUM, 
      status = TestItemStatus.PENDING,
      dueDate,
      isActive = true,
      counter = 0,
      tags = []
    } = params;
    
    const testItem: TestItem = {
      name,
      description,
      title,
      content,
      priority,
      status,
      dueDate,
      isActive,
      counter,
      tags,
      entityType: EntityType.CHARACTER, // Using CHARACTER as a placeholder
      createdBy: 'test-user'
    };
    
    return this.create(testItem);
  }
  
  /**
   * Update a test item
   * @param id Test item ID
   * @param params Test item update parameters
   * @returns True if successful
   */
  async updateTestItem(id: string, params: TestItemUpdateParams): Promise<boolean> {
    return this.update(id, params);
  }
  
  /**
   * Get test items by status
   * @param status Test item status
   * @returns Test items with the specified status
   */
  async getByStatus(status: TestItemStatus): Promise<TestItem[]> {
    const constraints: QueryConstraint[] = [
      where('status', '==', status)
    ];
    
    const result = await this.query(constraints);
    return result.data;
  }
  
  /**
   * Get test items by priority
   * @param priority Test item priority
   * @returns Test items with the specified priority
   */
  async getByPriority(priority: TestItemPriority): Promise<TestItem[]> {
    const constraints: QueryConstraint[] = [
      where('priority', '==', priority)
    ];
    
    const result = await this.query(constraints);
    return result.data;
  }
  
  /**
   * Get active test items
   * @returns Active test items
   */
  async getActiveItems(): Promise<TestItem[]> {
    const constraints: QueryConstraint[] = [
      where('isActive', '==', true)
    ];
    
    const result = await this.query(constraints);
    return result.data;
  }
  
  /**
   * Increment the counter for a test item
   * @param id Test item ID
   * @returns Updated counter value
   */
  async incrementCounter(id: string): Promise<number> {
    // Use a transaction to ensure atomicity
    return this.executeTransaction(async (transaction) => {
      const testItem = await this.getInTransaction(transaction, id);
      
      if (!testItem) {
        throw new Error(`Test item ${id} not found`);
      }
      
      const newCounter = (testItem.counter || 0) + 1;
      
      this.updateInTransaction(transaction, id, { counter: newCounter });
      
      return newCounter;
    });
  }
}
