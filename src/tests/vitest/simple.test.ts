import { describe, it, expect } from 'vitest';

describe('Simple Vitest Test', () => {
  it('should pass', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle async operations', async () => {
    const result = await Promise.resolve(42);
    expect(result).toBe(42);
  });
});
