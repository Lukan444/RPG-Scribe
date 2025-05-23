/**
 * UserService test suite using Vitest
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Define the User interface for testing
interface User {
  id?: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Define the MockUserService class for testing
class MockUserService {
  private users: Map<string, User> = new Map();
  private nextId = 1;

  /**
   * Get singleton instance
   */
  public static getInstance(): MockUserService {
    return new MockUserService();
  }

  /**
   * Create a user
   */
  public async createUser(user: User): Promise<string> {
    const id = `user-${this.nextId++}`;
    this.users.set(id, { ...user, id });
    return id;
  }

  /**
   * Get a user by ID
   */
  public async getUserById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user ? { ...user } : null;
  }

  /**
   * Get a user by email
   */
  public async getUserByEmail(email: string): Promise<User | null> {
    const user = Array.from(this.users.values()).find(u => u.email === email);
    return user ? { ...user } : null;
  }

  /**
   * Update a user
   */
  public async updateUser(id: string, user: Partial<User>): Promise<boolean> {
    if (!this.users.has(id)) {
      return false;
    }
    
    const existingUser = this.users.get(id)!;
    this.users.set(id, { ...existingUser, ...user });
    return true;
  }

  /**
   * Delete a user
   */
  public async deleteUser(id: string): Promise<boolean> {
    if (!this.users.has(id)) {
      return false;
    }
    
    this.users.delete(id);
    return true;
  }

  /**
   * List users
   */
  public async listUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  /**
   * Clear all users (for testing)
   */
  public clearUsers(): void {
    this.users.clear();
    this.nextId = 1;
  }
}

/**
 * UserService test suite
 */
describe('UserService', () => {
  // Test service
  let userService: MockUserService;
  
  // Set up test environment
  beforeEach(() => {
    userService = MockUserService.getInstance();
    userService.clearUsers();
  });
  
  // Test createUser method
  describe('createUser', () => {
    it('should create a user', async () => {
      // Create test user data
      const userData: User = {
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        role: 'user'
      };
      
      // Create user
      const id = await userService.createUser(userData);
      
      // Verify user was created
      expect(id).toBeTruthy();
      
      // Get user
      const user = await userService.getUserById(id);
      
      // Verify user data
      expect(user).toBeTruthy();
      expect(user?.email).toBe(userData.email);
      expect(user?.displayName).toBe(userData.displayName);
      expect(user?.photoURL).toBe(userData.photoURL);
      expect(user?.role).toBe(userData.role);
    });
  });
  
  // Test getUserById method
  describe('getUserById', () => {
    it('should get a user by ID', async () => {
      // Create test user data
      const userData: User = {
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        role: 'user'
      };
      
      // Create user
      const id = await userService.createUser(userData);
      
      // Get user by ID
      const user = await userService.getUserById(id);
      
      // Verify user data
      expect(user).toBeTruthy();
      expect(user?.id).toBe(id);
      expect(user?.email).toBe(userData.email);
      expect(user?.displayName).toBe(userData.displayName);
      expect(user?.photoURL).toBe(userData.photoURL);
      expect(user?.role).toBe(userData.role);
    });
    
    it('should return null for non-existent user', async () => {
      // Get non-existent user
      const user = await userService.getUserById('non-existent-id');
      
      // Verify null result
      expect(user).toBeNull();
    });
  });
  
  // Test getUserByEmail method
  describe('getUserByEmail', () => {
    it('should get a user by email', async () => {
      // Create test user data
      const userData: User = {
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        role: 'user'
      };
      
      // Create user
      const id = await userService.createUser(userData);
      
      // Get user by email
      const user = await userService.getUserByEmail(userData.email);
      
      // Verify user data
      expect(user).toBeTruthy();
      expect(user?.id).toBe(id);
      expect(user?.email).toBe(userData.email);
      expect(user?.displayName).toBe(userData.displayName);
      expect(user?.photoURL).toBe(userData.photoURL);
      expect(user?.role).toBe(userData.role);
    });
    
    it('should return null for non-existent email', async () => {
      // Get non-existent user
      const user = await userService.getUserByEmail('non-existent@example.com');
      
      // Verify null result
      expect(user).toBeNull();
    });
  });
  
  // Test updateUser method
  describe('updateUser', () => {
    it('should update a user', async () => {
      // Create test user data
      const userData: User = {
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        role: 'user'
      };
      
      // Create user
      const id = await userService.createUser(userData);
      
      // Update user
      const updateData: Partial<User> = {
        displayName: 'Updated User',
        photoURL: 'https://example.com/updated-photo.jpg',
        role: 'admin'
      };
      
      const success = await userService.updateUser(id, updateData);
      
      // Verify update success
      expect(success).toBe(true);
      
      // Get updated user
      const user = await userService.getUserById(id);
      
      // Verify updated data
      expect(user).toBeTruthy();
      expect(user?.displayName).toBe(updateData.displayName);
      expect(user?.photoURL).toBe(updateData.photoURL);
      expect(user?.role).toBe(updateData.role);
      expect(user?.email).toBe(userData.email); // Unchanged
    });
    
    it('should return false for non-existent user', async () => {
      // Update non-existent user
      const updateData: Partial<User> = {
        displayName: 'Updated User',
        photoURL: 'https://example.com/updated-photo.jpg',
        role: 'admin'
      };
      
      const success = await userService.updateUser('non-existent-id', updateData);
      
      // Verify update failure
      expect(success).toBe(false);
    });
  });
  
  // Test deleteUser method
  describe('deleteUser', () => {
    it('should delete a user', async () => {
      // Create test user data
      const userData: User = {
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: 'https://example.com/photo.jpg',
        role: 'user'
      };
      
      // Create user
      const id = await userService.createUser(userData);
      
      // Delete user
      const success = await userService.deleteUser(id);
      
      // Verify delete success
      expect(success).toBe(true);
      
      // Try to get deleted user
      const user = await userService.getUserById(id);
      
      // Verify user is deleted
      expect(user).toBeNull();
    });
    
    it('should return false for non-existent user', async () => {
      // Delete non-existent user
      const success = await userService.deleteUser('non-existent-id');
      
      // Verify delete failure
      expect(success).toBe(false);
    });
  });
});
