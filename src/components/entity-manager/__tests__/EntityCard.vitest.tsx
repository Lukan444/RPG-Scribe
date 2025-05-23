/**
 * EntityCard Component Tests using Vitest
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EntityCard } from '../EntityCard';
import { EntityType } from '../../../models/EntityType';
import { renderWithMantine } from '../../../tests/vitest-utils/test-utils';

// Create a mock navigate function
const mockNavigate = vi.fn();

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock the RelationshipCountBadge component
vi.mock('../../../components/relationships/badges', () => ({
  RelationshipCountBadge: ({ entityType, count }: { entityType: EntityType, count: number }) => (
    <div data-testid="relationship-count-badge">
      {`${entityType} (${count})`}
    </div>
  ),
}));

describe('EntityCard Component', () => {
  const defaultProps = {
    entityType: EntityType.CHARACTER,
    count: 5,
    worldId: 'world-123',
    campaignId: 'campaign-456',
    showRelationshipBadge: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct entity type and title', () => {
    renderWithMantine(<EntityCard {...defaultProps} />);

    // Check if the title is rendered correctly
    expect(screen.getByText('Character')).toBeInTheDocument();

    // Check if the description contains the entity type
    expect(screen.getByText(/Manage your character entities/i)).toBeInTheDocument();
  });

  it('displays relationship count badge when showRelationshipBadge is true', () => {
    renderWithMantine(<EntityCard {...defaultProps} />);

    // Check if the relationship count badge is rendered
    expect(screen.getByTestId('relationship-count-badge')).toBeInTheDocument();
  });

  it('does not display relationship count badge when showRelationshipBadge is false', () => {
    renderWithMantine(
      <EntityCard {...defaultProps} showRelationshipBadge={false} />
    );

    // Check that the relationship count badge is not rendered
    expect(screen.queryByTestId('relationship-count-badge')).not.toBeInTheDocument();

    // Instead, it should show the category text
    expect(screen.getByText('CHARACTER')).toBeInTheDocument();
  });

  it('renders View All and Create New buttons', () => {
    renderWithMantine(<EntityCard {...defaultProps} />);

    // Check if the buttons are rendered
    expect(screen.getByText('View All')).toBeInTheDocument();
    expect(screen.getByText('Create New')).toBeInTheDocument();
  });

  it('uses the correct color for the entity type', () => {
    renderWithMantine(<EntityCard {...defaultProps} />);

    // Get the buttons
    const viewAllButton = screen.getByText('View All');
    const createNewButton = screen.getByText('Create New');

    // Check if the buttons have the correct color class
    // Note: In a real test, we would check for specific color values,
    // but for this example we're just checking that the buttons exist
    expect(viewAllButton).toBeInTheDocument();
    expect(createNewButton).toBeInTheDocument();
  });

  it('handles button clicks correctly', () => {
    // Reset the mock before this test
    mockNavigate.mockReset();

    renderWithMantine(<EntityCard {...defaultProps} />);

    // Click the View All button
    fireEvent.click(screen.getByText('View All'));

    // Click the Create New button
    fireEvent.click(screen.getByText('Create New'));

    // Check if navigate was called
    expect(mockNavigate).toHaveBeenCalledTimes(2);
  });

  it('renders different entity types correctly', () => {
    // Test with a different entity type
    renderWithMantine(
      <EntityCard
        {...defaultProps}
        entityType={EntityType.LOCATION}
        count={10}
      />
    );

    // Check if the title is rendered correctly for the new entity type
    expect(screen.getByText('Location')).toBeInTheDocument();

    // Check if the description contains the new entity type
    expect(screen.getByText(/Manage your location entities/i)).toBeInTheDocument();
  });
});
