/**
 * Test for SampleDataPopulator sampleDataExists() method fix
 *
 * This test validates that the sampleDataExists() method now properly checks
 * for all sample data types instead of just timeline entries
 */

/// <reference types="vitest" />

// Use vi.hoisted to create mocks that are available during hoisting
const mockGetDoc = vi.hoisted(() => vi.fn());
const mockDoc = vi.hoisted(() => vi.fn());
const mockTimelineService = vi.hoisted(() => ({
  getTimelineEntries: vi.fn()
}));

// Mock Firebase config
vi.mock('../../firebase/config', () => ({
  db: {}
}));

// Mock Firestore functions
vi.mock('firebase/firestore', () => ({
  doc: mockDoc,
  getDoc: mockGetDoc,
  collection: vi.fn(),
  setDoc: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    commit: vi.fn()
  }))
}));

// Mock TimelineService
vi.mock('../../services/timeline.service', () => ({
  TimelineService: vi.fn(() => mockTimelineService)
}));

import { SampleDataPopulator } from '../populateSampleData';
import { sampleWorldInfo, sampleCampaignInfo } from '../populateSampleData';

describe('SampleDataPopulator.sampleDataExists() Fix', () => {
  let sampleDataPopulator: SampleDataPopulator;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create new instance
    sampleDataPopulator = new SampleDataPopulator();
  });

  test('should return true when sample RPG World exists', async () => {
    // Mock: World exists, campaign doesn't, no timeline entries
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => true }) // World exists
      .mockResolvedValueOnce({ exists: () => false }); // Campaign doesn't exist

    mockTimelineService.getTimelineEntries.mockResolvedValue([]);

    const result = await sampleDataPopulator.sampleDataExists('test-user');

    expect(result).toBe(true);
    expect(mockGetDoc).toHaveBeenCalledTimes(1); // Should stop after finding world
  });

  test('should return true when sample Campaign exists', async () => {
    // Mock: World doesn't exist, campaign exists, no timeline entries
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false }) // World doesn't exist
      .mockResolvedValueOnce({ exists: () => true }); // Campaign exists

    mockTimelineService.getTimelineEntries.mockResolvedValue([]);

    const result = await sampleDataPopulator.sampleDataExists('test-user');

    expect(result).toBe(true);
    expect(mockGetDoc).toHaveBeenCalledTimes(2); // Should stop after finding campaign
  });

  test('should return true when timeline entries exist', async () => {
    // Mock: No world, no campaign, but timeline entries exist
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false }) // World doesn't exist
      .mockResolvedValueOnce({ exists: () => false }); // Campaign doesn't exist

    mockTimelineService.getTimelineEntries.mockResolvedValue([
      { id: '1', title: 'Test Entry' }
    ]);

    const result = await sampleDataPopulator.sampleDataExists('test-user');

    expect(result).toBe(true);
    expect(mockGetDoc).toHaveBeenCalledTimes(2);
    expect(mockTimelineService.getTimelineEntries).toHaveBeenCalledTimes(1);
  });

  test('should return false when no sample data exists', async () => {
    // Mock: No world, no campaign, no timeline entries
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false }) // World doesn't exist
      .mockResolvedValueOnce({ exists: () => false }); // Campaign doesn't exist

    mockTimelineService.getTimelineEntries.mockResolvedValue([]);

    const result = await sampleDataPopulator.sampleDataExists('test-user');

    expect(result).toBe(false);
    expect(mockGetDoc).toHaveBeenCalledTimes(2);
    expect(mockTimelineService.getTimelineEntries).toHaveBeenCalledTimes(1);
  });

  test('should return false on error and log error message', async () => {
    // Mock: Error during world check
    mockGetDoc.mockRejectedValueOnce(new Error('Firebase error'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await sampleDataPopulator.sampleDataExists('test-user');

    expect(result).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith('Error checking sample data existence:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  test('should check for correct document IDs', async () => {
    // Mock: No data exists
    mockGetDoc
      .mockResolvedValueOnce({ exists: () => false })
      .mockResolvedValueOnce({ exists: () => false });

    mockTimelineService.getTimelineEntries.mockResolvedValue([]);

    await sampleDataPopulator.sampleDataExists('test-user');

    // Verify correct document references are being checked
    expect(mockDoc).toHaveBeenCalledWith({}, 'rpgWorlds', sampleWorldInfo.id);
    expect(mockDoc).toHaveBeenCalledWith({}, 'campaigns', sampleCampaignInfo.id);
  });
});
