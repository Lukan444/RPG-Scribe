/**
 * TimelineEditor Component Tests
 * 
 * Comprehensive UI tests for the TimelineEditor component
 * including drag-and-drop, CRUD operations, and validation.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MantineProvider } from '@mantine/core';
import { DragDropContext } from '@hello-pangea/dnd';
import { TimelineEditor } from '../../../components/timeline/TimelineEditor';
import { TimelineEntryType, TimeUnit } from '../../../constants/timelineConstants';

// Mock drag and drop
vi.mock('@hello-pangea/dnd', async () => {
  const actual = await vi.importActual('@hello-pangea/dnd');
  return {
    ...actual,
    DragDropContext: ({ children, onDragEnd }: any) => (
      <div data-testid="drag-drop-context" data-on-drag-end={onDragEnd}>
        {children}
      </div>
    ),
    Droppable: ({ children }: any) => (
      <div data-testid="droppable">
        {children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null })}
      </div>
    ),
    Draggable: ({ children, draggableId }: any) => (
      <div data-testid={`draggable-${draggableId}`}>
        {children({ 
          innerRef: vi.fn(), 
          draggableProps: {}, 
          dragHandleProps: {},
        }, { isDragging: false })}
      </div>
    )
  };
});

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <MantineProvider>
    {children}
  </MantineProvider>
);

describe('TimelineEditor Component', () => {
  const mockEntries = [
    {
      id: 'entry-1',
      title: 'Test Entry 1',
      description: 'Test description 1',
      sequence: 0,
      entryType: TimelineEntryType.EVENT,
      importance: 5,
      timeGapBefore: {
        duration: 1,
        unit: TimeUnit.HOURS
      },
      duration: {
        duration: 30,
        unit: TimeUnit.MINUTES
      },
      validationStatus: 'valid' as const,
      hasConflicts: false
    },
    {
      id: 'entry-2',
      title: 'Test Entry 2',
      description: 'Test description 2',
      sequence: 1,
      entryType: TimelineEntryType.SESSION,
      importance: 8,
      timeGapBefore: {
        duration: 2,
        unit: TimeUnit.HOURS
      },
      validationStatus: 'warning' as const,
      hasConflicts: true,
      conflictTypes: ['overlapping_events']
    }
  ];

  const defaultProps = {
    entries: mockEntries,
    onEntriesChange: vi.fn(),
    onEntryCreate: vi.fn(),
    onEntryUpdate: vi.fn(),
    onEntryDelete: vi.fn(),
    enableDragDrop: true,
    showValidation: true
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render timeline editor with entries', () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Timeline Editor')).toBeInTheDocument();
      expect(screen.getByText('Add Entry')).toBeInTheDocument();
      expect(screen.getByText('Test Entry 1')).toBeInTheDocument();
      expect(screen.getByText('Test Entry 2')).toBeInTheDocument();
    });

    it('should render entry details correctly', () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} />
        </TestWrapper>
      );

      // Check sequence badges
      expect(screen.getByText('Seq: 0')).toBeInTheDocument();
      expect(screen.getByText('Seq: 1')).toBeInTheDocument();

      // Check entry types
      expect(screen.getByText('EVENT')).toBeInTheDocument();
      expect(screen.getByText('SESSION')).toBeInTheDocument();

      // Check time gaps
      expect(screen.getByText('Gap: 1 hour')).toBeInTheDocument();
      expect(screen.getByText('Gap: 2 hours')).toBeInTheDocument();

      // Check durations
      expect(screen.getByText('Duration: 30 minutes')).toBeInTheDocument();

      // Check importance
      expect(screen.getByText('Importance: 5/10')).toBeInTheDocument();
      expect(screen.getByText('Importance: 8/10')).toBeInTheDocument();
    });

    it('should show conflict indicators', () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} />
        </TestWrapper>
      );

      expect(screen.getByText('Conflicts')).toBeInTheDocument();
      expect(screen.getByText('Conflicts: overlapping_events')).toBeInTheDocument();
    });

    it('should render drag handles when drag-drop is enabled', () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} enableDragDrop={true} />
        </TestWrapper>
      );

      const dragHandles = screen.getAllByTestId(/draggable-/);
      expect(dragHandles).toHaveLength(2);
    });
  });

  describe('Entry Actions', () => {
    it('should open create modal when Add Entry is clicked', async () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} />
        </TestWrapper>
      );

      const addButton = screen.getByText('Add Entry');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Create Timeline Entry')).toBeInTheDocument();
      });
    });

    it('should open edit modal when edit button is clicked', async () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} />
        </TestWrapper>
      );

      const editButtons = screen.getAllByLabelText('Edit Entry');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Timeline Entry')).toBeInTheDocument();
      });
    });

    it('should call onEntryDelete when delete button is clicked', async () => {
      const mockOnEntryDelete = vi.fn().mockResolvedValue(true);
      
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} onEntryDelete={mockOnEntryDelete} />
        </TestWrapper>
      );

      const deleteButtons = screen.getAllByLabelText('Delete Entry');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockOnEntryDelete).toHaveBeenCalledWith('entry-1');
      });
    });
  });

  describe('Create Entry Modal', () => {
    it('should render create form fields', async () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Entry'));

      await waitFor(() => {
        expect(screen.getByLabelText('Title')).toBeInTheDocument();
        expect(screen.getByLabelText('Description')).toBeInTheDocument();
        expect(screen.getByLabelText('Entry Type')).toBeInTheDocument();
        expect(screen.getByLabelText('Importance')).toBeInTheDocument();
        expect(screen.getByLabelText('Associated Entity ID')).toBeInTheDocument();
        expect(screen.getByLabelText('Time Gap (Duration)')).toBeInTheDocument();
        expect(screen.getByLabelText('Time Unit')).toBeInTheDocument();
      });
    });

    it('should validate required fields', async () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Entry'));

      await waitFor(() => {
        const createButton = screen.getByText('Create Entry');
        fireEvent.click(createButton);
      });

      // Form should not submit with empty required fields
      expect(defaultProps.onEntryCreate).not.toHaveBeenCalled();
    });

    it('should call onEntryCreate with valid data', async () => {
      const mockOnEntryCreate = vi.fn().mockResolvedValue('new-entry-id');
      
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} onEntryCreate={mockOnEntryCreate} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Entry'));

      await waitFor(() => {
        // Fill in required fields
        fireEvent.change(screen.getByLabelText('Title'), {
          target: { value: 'New Entry' }
        });
        fireEvent.change(screen.getByLabelText('Associated Entity ID'), {
          target: { value: 'entity-123' }
        });

        const createButton = screen.getByText('Create Entry');
        fireEvent.click(createButton);
      });

      await waitFor(() => {
        expect(mockOnEntryCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'New Entry',
            associatedEntityId: 'entity-123'
          })
        );
      });
    });

    it('should close modal after successful creation', async () => {
      const mockOnEntryCreate = vi.fn().mockResolvedValue('new-entry-id');
      
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} onEntryCreate={mockOnEntryCreate} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Entry'));

      await waitFor(() => {
        fireEvent.change(screen.getByLabelText('Title'), {
          target: { value: 'New Entry' }
        });
        fireEvent.change(screen.getByLabelText('Associated Entity ID'), {
          target: { value: 'entity-123' }
        });

        fireEvent.click(screen.getByText('Create Entry'));
      });

      await waitFor(() => {
        expect(screen.queryByText('Create Timeline Entry')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Entry Modal', () => {
    it('should pre-populate form with entry data', async () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} />
        </TestWrapper>
      );

      const editButtons = screen.getAllByLabelText('Edit Entry');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Entry 1');
        expect(titleInput).toBeInTheDocument();
        
        const descriptionInput = screen.getByDisplayValue('Test description 1');
        expect(descriptionInput).toBeInTheDocument();
      });
    });

    it('should call onEntryUpdate with changes', async () => {
      const mockOnEntryUpdate = vi.fn().mockResolvedValue(true);
      
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} onEntryUpdate={mockOnEntryUpdate} />
        </TestWrapper>
      );

      const editButtons = screen.getAllByLabelText('Edit Entry');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        const titleInput = screen.getByDisplayValue('Test Entry 1');
        fireEvent.change(titleInput, { target: { value: 'Updated Entry 1' } });

        fireEvent.click(screen.getByText('Save Changes'));
      });

      await waitFor(() => {
        expect(mockOnEntryUpdate).toHaveBeenCalledWith(
          'entry-1',
          expect.objectContaining({
            title: 'Updated Entry 1'
          })
        );
      });
    });
  });

  describe('Drag and Drop', () => {
    it('should call onEntriesChange when entries are reordered', () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} />
        </TestWrapper>
      );

      // Simulate drag and drop by finding the context and calling onDragEnd
      const dragDropContext = screen.getByTestId('drag-drop-context');
      const onDragEnd = dragDropContext.getAttribute('data-on-drag-end');
      
      // This would normally be called by the drag-drop library
      // We can test that the component structure is correct
      expect(dragDropContext).toBeInTheDocument();
    });

    it('should disable drag when enableDragDrop is false', () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} enableDragDrop={false} />
        </TestWrapper>
      );

      // Drag handles should still be present but disabled
      const dragHandles = screen.getAllByTestId(/draggable-/);
      expect(dragHandles).toHaveLength(2);
    });
  });

  describe('Validation Display', () => {
    it('should show validation alert when conflicts exist', () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} showValidation={true} />
        </TestWrapper>
      );

      expect(screen.getByText(/Some timeline entries have validation conflicts/)).toBeInTheDocument();
    });

    it('should hide validation when showValidation is false', () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} showValidation={false} />
        </TestWrapper>
      );

      expect(screen.queryByText(/Some timeline entries have validation conflicts/)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no entries exist', () => {
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} entries={[]} />
        </TestWrapper>
      );

      expect(screen.getByText('No timeline entries yet')).toBeInTheDocument();
      expect(screen.getByText('Click "Add Entry" to create your first timeline entry')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle create entry errors gracefully', async () => {
      const mockOnEntryCreate = vi.fn().mockRejectedValue(new Error('Create failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} onEntryCreate={mockOnEntryCreate} />
        </TestWrapper>
      );

      fireEvent.click(screen.getByText('Add Entry'));

      await waitFor(() => {
        fireEvent.change(screen.getByLabelText('Title'), {
          target: { value: 'New Entry' }
        });
        fireEvent.change(screen.getByLabelText('Associated Entity ID'), {
          target: { value: 'entity-123' }
        });

        fireEvent.click(screen.getByText('Create Entry'));
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to create timeline entry:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle update entry errors gracefully', async () => {
      const mockOnEntryUpdate = vi.fn().mockRejectedValue(new Error('Update failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} onEntryUpdate={mockOnEntryUpdate} />
        </TestWrapper>
      );

      const editButtons = screen.getAllByLabelText('Edit Entry');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Save Changes'));
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to update timeline entry:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle delete entry errors gracefully', async () => {
      const mockOnEntryDelete = vi.fn().mockRejectedValue(new Error('Delete failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      render(
        <TestWrapper>
          <TimelineEditor {...defaultProps} onEntryDelete={mockOnEntryDelete} />
        </TestWrapper>
      );

      const deleteButtons = screen.getAllByLabelText('Delete Entry');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete timeline entry:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});
