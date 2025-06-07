import React from 'react';
import { render, screen, fireEvent, within, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TranscriptViewer, TranscriptViewerProps } from '../TranscriptViewer';
import { TranscriptionSegment, SpeakerInfo, SpeakerConfidence } from '../../../models/Transcription';
import { MantineProvider, Button } from '@mantine/core'; // Button for testing callbacks

// Mock notifications
jest.mock('@mantine/notifications', () => ({
  notifications: {
    show: jest.fn(),
  },
}));

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: jest.fn().mockResolvedValue(undefined),
  },
  writable: true,
});

// Mock TranscriptionService (if it were used directly for fetching, not needed if segments are passed as props)
// jest.mock('../../../services/transcription.service', () => ({
//   TranscriptionService: jest.fn().mockImplementation(() => ({
//     getTranscriptionById: jest.fn().mockResolvedValue(null), // or mock data
//     getTranscriptionSegments: jest.fn().mockResolvedValue([]), // or mock data
//   })),
// }));

const mockSegmentsBase: TranscriptionSegment[] = [
  { id: 'seg1', text: 'Hello world from speaker one', startTime: 0, endTime: 1.5, confidence: 0.9, speakerId: 's1', speakerName: 'Speaker One', isInterim: false, language: 'en', entities: [], speakerConfidence: SpeakerConfidence.HIGH },
  { id: 'seg2', text: 'Another segment from speaker two', startTime: 1.6, endTime: 3.0, confidence: 0.8, speakerId: 's2', speakerName: 'Speaker Two', isInterim: false, language: 'en', entities: [], speakerConfidence: SpeakerConfidence.MEDIUM },
  { id: 'seg3', text: 'This is a final message, hello again from speaker one', startTime: 3.1, endTime: 5.0, confidence: 0.95, speakerId: 's1', speakerName: 'Speaker One', isInterim: false, language: 'en', entities: [], speakerConfidence: SpeakerConfidence.HIGH },
  { id: 'seg4', text: 'An interim segment test', startTime: 5.1, endTime: 6.0, confidence: 0.7, speakerId: 's2', speakerName: 'Speaker Two', isInterim: true, language: 'en', entities: [], speakerConfidence: SpeakerConfidence.LOW },
];

const mockSpeakers: SpeakerInfo[] = [
  { id: 's1', name: 'Speaker One', color: 'blue' },
  { id: 's2', name: 'Speaker Two', color: 'green' },
];

const renderTranscriptViewer = (props?: Partial<TranscriptViewerProps>) => {
  const defaultProps: TranscriptViewerProps = {
    segments: mockSegmentsBase,
    speakers: mockSpeakers,
    // transcriptionId: 'test-tx-id', // Not needed if segments are passed directly
    loading: false,
    error: null,
    // Default feature toggles to true for broader testing initially
    enableSearch: true,
    enableFiltering: true,
    enableExport: true,
    enableEditing: true,
    enableBookmarks: true,
    showTimestamps: true,
    showSpeakerLabels: true,
    showConfidence: true,
    segmentsPerPage: 10, // Default, can be overridden
  };
  return render(
    <MantineProvider>
      <TranscriptViewer {...defaultProps} {...props} />
    </MantineProvider>
  );
};

describe('TranscriptViewer', () => {
  beforeEach(() => {
    // Reset mocks that might have been called
    (navigator.clipboard.writeText as jest.Mock).mockClear();
    // (notifications.show as jest.Mock).mockClear(); // if needed
  });

  it('renders the title', () => {
    renderTranscriptViewer({ segments: [] });
    expect(screen.getByText('Transcript Viewer')).toBeInTheDocument();
  });

  it('shows loader when loading is true', () => {
    renderTranscriptViewer({ loading: true, segments: [] });
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows error alert when error prop is provided', () => {
    const errorMessage = "Failed to load transcript.";
    renderTranscriptViewer({ error: new Error(errorMessage), segments: [] });
    expect(screen.getByRole('alert')).toHaveTextContent(errorMessage);
  });

  it('shows "No transcript segments found" when segments array is empty', () => {
    renderTranscriptViewer({ segments: [] });
    expect(screen.getByText('No transcript segments found.')).toBeInTheDocument();
  });

  it('renders segments with text, timestamps, speaker labels, and confidence by default', () => {
    renderTranscriptViewer();
    const firstSegment = mockSegmentsBase[0];
    expect(screen.getByText(firstSegment.text)).toBeInTheDocument();
    expect(screen.getByText(/00:00.000 - 00:01.500/)).toBeInTheDocument(); // Formatted timestamp
    expect(screen.getAllByText(firstSegment.speakerName!)[0]).toBeInTheDocument();
    expect(screen.getByText(`Conf: ${(firstSegment.confidence! * 100).toFixed(0)}%`)).toBeInTheDocument();
  });

  it('hides timestamps, speaker labels, confidence if props are false', () => {
    renderTranscriptViewer({ showTimestamps: false, showSpeakerLabels: false, showConfidence: false });
    expect(screen.queryByText(/00:00.000 - 00:01.500/)).not.toBeInTheDocument();
    expect(screen.queryAllByText(mockSegmentsBase[0].speakerName!).length).toBe(0); // Speaker name should not be rendered as a label
    expect(screen.queryByText(`Conf: ${(mockSegmentsBase[0].confidence! * 100).toFixed(0)}%`)).not.toBeInTheDocument();
  });

  it('highlights terms if highlightTerms prop is provided', () => {
    renderTranscriptViewer({ highlightTerms: ['world', 'speaker two'] });
    // Check highlights in "Hello world from speaker one"
    const seg1 = screen.getByText((content, element) => element?.tagName.toLowerCase() === 'div' && content.startsWith('Hello world'));
    expect(within(seg1).getByText('world').closest('mark')).toBeInTheDocument();
    // Check highlights in "Another segment from speaker two"
    const seg2 = screen.getByText((content, element) => element?.tagName.toLowerCase() === 'div' && content.startsWith('Another segment'));
    expect(within(seg2).getByText('speaker two').closest('mark')).toBeInTheDocument();
  });


  describe('Feature Toggles', () => {
    it('shows/hides search input based on enableSearch', () => {
      const { rerender } = renderTranscriptViewer({ enableSearch: true });
      expect(screen.getByPlaceholderText('Search transcript...')).toBeInTheDocument();
      rerender(
        <MantineProvider>
          <TranscriptViewer segments={mockSegmentsBase} speakers={mockSpeakers} enableSearch={false} />
        </MantineProvider>
      );
      expect(screen.queryByPlaceholderText('Search transcript...')).not.toBeInTheDocument();
    });

    it('shows/hides filter controls based on enableFiltering', () => {
        const { rerender } = renderTranscriptViewer({ enableFiltering: true });
        // Assuming filter button has a specific title or role
        expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();

        rerender(
          <MantineProvider>
            <TranscriptViewer segments={mockSegmentsBase} speakers={mockSpeakers} enableFiltering={false} />
          </MantineProvider>
        );
        expect(screen.queryByRole('button', { name: /filter/i })).not.toBeInTheDocument();
      });

    it('shows/hides export controls based on enableExport', () => {
      const { rerender } = renderTranscriptViewer({ enableExport: true });
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
      rerender(
        <MantineProvider>
          <TranscriptViewer segments={mockSegmentsBase} speakers={mockSpeakers} enableExport={false} />
        </MantineProvider>
      );
      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    });

    // Assuming edit/bookmark icons have aria-labels or titles
    it('shows/hides edit icons based on enableEditing', () => {
        const { rerender } = renderTranscriptViewer({ enableEditing: true });
        expect(screen.getAllByRole('button', { name: /edit segment/i })[0]).toBeInTheDocument();
        rerender(
          <MantineProvider>
            <TranscriptViewer segments={mockSegmentsBase} speakers={mockSpeakers} enableEditing={false} />
          </MantineProvider>
        );
        expect(screen.queryAllByRole('button', { name: /edit segment/i }).length).toBe(0);
      });

    it('shows/hides bookmark icons based on enableBookmarks', () => {
      const { rerender } = renderTranscriptViewer({ enableBookmarks: true });
      expect(screen.getAllByRole('button', { name: /bookmark segment/i })[0]).toBeInTheDocument();
      rerender(
        <MantineProvider>
          <TranscriptViewer segments={mockSegmentsBase} speakers={mockSpeakers} enableBookmarks={false} />
        </MantineProvider>
      );
      expect(screen.queryAllByRole('button', { name: /bookmark segment/i }).length).toBe(0);
    });
  });

  describe('Search Functionality', () => {
    it('filters segments by text search (case-insensitive)', () => {
      renderTranscriptViewer({ segments: mockSegmentsBase, enableSearch: true });
      const searchInput = screen.getByPlaceholderText('Search transcript...');
      fireEvent.change(searchInput, { target: { value: 'hello' } });
      expect(screen.getByText(mockSegmentsBase[0].text)).toBeInTheDocument();
      expect(screen.queryByText(mockSegmentsBase[1].text)).not.toBeInTheDocument();
      expect(screen.getByText(mockSegmentsBase[2].text)).toBeInTheDocument();
    });

    it('filters segments by speaker name search', () => {
        renderTranscriptViewer({ segments: mockSegmentsBase, enableSearch: true, showSpeakerLabels: true });
        const searchInput = screen.getByPlaceholderText('Search transcript...');
        fireEvent.change(searchInput, { target: { value: 'Speaker Two' } });
        expect(screen.queryByText(mockSegmentsBase[0].text)).not.toBeInTheDocument();
        expect(screen.getByText(mockSegmentsBase[1].text)).toBeInTheDocument();
        expect(screen.getByText(mockSegmentsBase[3].text)).toBeInTheDocument(); // Interim segment by Speaker Two
      });
  });

  describe('Filtering Functionality', () => {
    beforeEach(() => {
      // Open filter popover before each test in this block
      renderTranscriptViewer({ enableFiltering: true, segments: mockSegmentsBase, speakers: mockSpeakers });
      const filterButton = screen.getByRole('button', { name: /filter/i });
      fireEvent.click(filterButton);
    });

    it('filters by speaker', () => {
      // Assuming the speaker select is identifiable by its label or role
      // This part is highly dependent on Mantine's Select component structure
      const speakerSelect = screen.getByLabelText('Filter by Speaker');
      fireEvent.mouseDown(speakerSelect); // Open the dropdown
      // Find and click the option for "Speaker One"
      // This might need adjustment based on how options are rendered.
      fireEvent.click(screen.getByText('Speaker One', { selector: '.mantine-Select-option span' }));

      expect(screen.getByText(mockSegmentsBase[0].text)).toBeInTheDocument();
      expect(screen.queryByText(mockSegmentsBase[1].text)).not.toBeInTheDocument();
      expect(screen.getByText(mockSegmentsBase[2].text)).toBeInTheDocument();
    });

    it('filters by confidence', () => {
      const confidenceSlider = screen.getByLabelText(/Minimum Confidence/); // Mantine Slider might have aria-label
      fireEvent.change(confidenceSlider, { target: { value: 85 } }); // Simulate slider change

      expect(screen.getByText(mockSegmentsBase[0].text)).toBeInTheDocument(); // 0.9
      expect(screen.queryByText(mockSegmentsBase[1].text)).not.toBeInTheDocument(); // 0.8
      expect(screen.getByText(mockSegmentsBase[2].text)).toBeInTheDocument(); // 0.95
      expect(screen.queryByText(mockSegmentsBase[3].text)).not.toBeInTheDocument(); // 0.7
    });

    it('filters interim results', () => {
      // Initially, interim results are shown by default (if filter is not set to hide)
      expect(screen.getByText(mockSegmentsBase[3].text)).toBeInTheDocument(); // Interim segment

      const showInterimSwitch = screen.getByRole('checkbox', { name: /Show interim results/i });
      fireEvent.click(showInterimSwitch); // Toggle to hide interim

      expect(screen.queryByText(mockSegmentsBase[3].text)).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    const manySegments = Array.from({ length: 25 }, (_, i) => ({
      ...mockSegmentsBase[0],
      id: `seg${i}`,
      text: `Segment ${i + 1}`,
    }));

    it('shows pagination if segments exceed segmentsPerPage', () => {
      renderTranscriptViewer({ segments: manySegments, segmentsPerPage: 5 });
      expect(screen.getByRole('navigation', { name: /pagination/i })).toBeInTheDocument();
      expect(screen.getByText('Segment 1')).toBeInTheDocument();
      expect(screen.queryByText('Segment 6')).not.toBeInTheDocument();
    });

    it('navigates pages correctly', () => {
      renderTranscriptViewer({ segments: manySegments, segmentsPerPage: 5 });
      // Mantine pagination buttons might not have default text like "Next" / "Previous"
      // They might be identified by aria-label or direct page numbers
      const page2Button = screen.getByRole('button', { name: /page 2/i }); // Adjust selector as needed
      fireEvent.click(page2Button);
      expect(screen.queryByText('Segment 1')).not.toBeInTheDocument();
      expect(screen.getByText('Segment 6')).toBeInTheDocument();
    });
  });

  describe('Segment Interactions', () => {
    it('calls onSegmentClick when a segment is clicked', () => {
      const onSegmentClick = jest.fn();
      renderTranscriptViewer({ onSegmentClick });
      fireEvent.click(screen.getByText(mockSegmentsBase[0].text));
      expect(onSegmentClick).toHaveBeenCalledWith(mockSegmentsBase[0]);
    });

    it('calls onSegmentEdit when edit is clicked and saved', async () => {
      const onSegmentEdit = jest.fn();
      renderTranscriptViewer({ enableEditing: true, onSegmentEdit });

      const editButton = screen.getAllByRole('button', { name: /edit segment/i })[0];
      fireEvent.click(editButton);

      // Modal should appear
      const textarea = screen.getByRole('textbox'); // Assuming a single textarea in the modal
      const newText = "Edited hello world";
      fireEvent.change(textarea, { target: { value: newText } });

      const saveButton = screen.getByRole('button', { name: /save/i });
      fireEvent.click(saveButton);

      expect(onSegmentEdit).toHaveBeenCalledWith(mockSegmentsBase[0], newText);
    });

    it('calls onBookmarkAdd when bookmark icon is clicked', () => {
        const onBookmarkAdd = jest.fn();
        renderTranscriptViewer({ enableBookmarks: true, onBookmarkAdd });
        const bookmarkButton = screen.getAllByRole('button', { name: /bookmark segment/i })[0];
        fireEvent.click(bookmarkButton);
        expect(onBookmarkAdd).toHaveBeenCalledWith(mockSegmentsBase[0]);
      });

    it('copies segment text to clipboard', async () => {
      renderTranscriptViewer();
      const copyButton = screen.getAllByRole('button', { name: /copy segment/i })[0];
      fireEvent.click(copyButton);
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockSegmentsBase[0].text);
      // Check for notification (implementation specific)
      // expect(notifications.show).toHaveBeenCalledWith(expect.objectContaining({ message: 'Segment copied to clipboard!' }));
    });
  });

  describe('Export Functionality', () => {
    it('calls onExport with correct format', () => {
      const onExport = jest.fn();
      renderTranscriptViewer({ enableExport: true, onExport });

      const exportButton = screen.getByRole('button', { name: /export/i });
      fireEvent.click(exportButton); // Open menu

      // Assuming menu items are buttons with specific text
      const exportTXT = screen.getByRole('menuitem', { name: /as txt/i });
      fireEvent.click(exportTXT);
      expect(onExport).toHaveBeenCalledWith('txt');

      fireEvent.click(exportButton); // Re-open menu
      const exportJSON = screen.getByRole('menuitem', { name: /as json/i });
      fireEvent.click(exportJSON);
      expect(onExport).toHaveBeenCalledWith('json');
    });
  });

});
