/**
 * Simple test to verify vitest setup
 */

import { describe, it, expect } from 'vitest';

describe('Simple Test', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should validate string operations', () => {
    expect('hello'.toUpperCase()).toBe('HELLO');
  });
});
