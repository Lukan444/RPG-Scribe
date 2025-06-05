/**
 * Timeline Export Service
 * Provides export capabilities for timeline data in various formats
 */

import { TimelineEventData } from './timelineDataIntegration.service';
import { TimelineMetrics } from './timelineAnalytics.service';
import { TimelineConflict } from './timelineConflictDetection.service';

export interface ExportOptions {
  format: 'pdf' | 'png' | 'svg' | 'json' | 'csv' | 'markdown';
  includeMetrics?: boolean;
  includeConflicts?: boolean;
  includeAnalytics?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  entityFilter?: {
    entityTypes?: string[];
    entityIds?: string[];
  };
  customization?: {
    title?: string;
    description?: string;
    theme?: 'light' | 'dark';
    showLegend?: boolean;
    showGrid?: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  data?: Blob | string;
  filename: string;
  mimeType: string;
  error?: string;
}

/**
 * Timeline Export Service
 * Handles exporting timeline data in various formats
 */
export class TimelineExportService {
  private static instance: TimelineExportService;

  private constructor() {}

  public static getInstance(): TimelineExportService {
    if (!TimelineExportService.instance) {
      TimelineExportService.instance = new TimelineExportService();
    }
    return TimelineExportService.instance;
  }

  /**
   * Export timeline data in specified format
   */
  public async exportTimeline(
    events: TimelineEventData[],
    options: ExportOptions,
    metrics?: TimelineMetrics,
    conflicts?: TimelineConflict[]
  ): Promise<ExportResult> {
    try {
      // Filter events based on options
      const filteredEvents = this.filterEvents(events, options);

      switch (options.format) {
        case 'json':
          return this.exportToJSON(filteredEvents, options, metrics, conflicts);
        case 'csv':
          return this.exportToCSV(filteredEvents, options);
        case 'markdown':
          return this.exportToMarkdown(filteredEvents, options, metrics, conflicts);
        case 'pdf':
          return this.exportToPDF(filteredEvents, options, metrics, conflicts);
        case 'png':
          return this.exportToPNG(filteredEvents, options);
        case 'svg':
          return this.exportToSVG(filteredEvents, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        filename: '',
        mimeType: '',
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  /**
   * Export to JSON format
   */
  private exportToJSON(
    events: TimelineEventData[],
    options: ExportOptions,
    metrics?: TimelineMetrics,
    conflicts?: TimelineConflict[]
  ): ExportResult {
    const exportData: any = {
      metadata: {
        exportDate: new Date().toISOString(),
        format: 'json',
        version: '1.0',
        title: options.customization?.title || 'Timeline Export',
        description: options.customization?.description || 'Exported timeline data'
      },
      events: events.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        realWorldTime: event.realWorldTime.toISOString(),
        inGameTime: event.inGameTime.toISOString(),
        timeline: event.timeline,
        entityId: event.entityId,
        entityType: event.entityType,
        entityName: event.entityName,
        tags: event.tags,
        participants: event.participants,
        locations: event.locations,
        metadata: event.metadata
      }))
    };

    if (options.includeMetrics && metrics) {
      exportData.metrics = metrics;
    }

    if (options.includeConflicts && conflicts) {
      exportData.conflicts = conflicts;
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    return {
      success: true,
      data: blob,
      filename: `timeline-export-${this.getTimestamp()}.json`,
      mimeType: 'application/json'
    };
  }

  /**
   * Export to CSV format
   */
  private exportToCSV(events: TimelineEventData[], options: ExportOptions): ExportResult {
    const headers = [
      'ID',
      'Title',
      'Description',
      'Real World Time',
      'In-Game Time',
      'Timeline',
      'Entity Type',
      'Entity Name',
      'Tags',
      'Participants',
      'Locations'
    ];

    const rows = events.map(event => [
      event.id,
      event.title,
      event.description || '',
      event.realWorldTime.toISOString(),
      event.inGameTime.toISOString(),
      event.timeline,
      event.entityType || '',
      event.entityName || '',
      (event.tags || []).join('; '),
      (event.participants || []).join('; '),
      (event.locations || []).join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });

    return {
      success: true,
      data: blob,
      filename: `timeline-export-${this.getTimestamp()}.csv`,
      mimeType: 'text/csv'
    };
  }

  /**
   * Export to Markdown format
   */
  private exportToMarkdown(
    events: TimelineEventData[],
    options: ExportOptions,
    metrics?: TimelineMetrics,
    conflicts?: TimelineConflict[]
  ): ExportResult {
    let markdown = '';

    // Header
    markdown += `# ${options.customization?.title || 'Timeline Export'}\n\n`;
    
    if (options.customization?.description) {
      markdown += `${options.customization.description}\n\n`;
    }

    markdown += `**Export Date:** ${new Date().toLocaleDateString()}\n`;
    markdown += `**Total Events:** ${events.length}\n\n`;

    // Metrics section
    if (options.includeMetrics && metrics) {
      markdown += '## Timeline Metrics\n\n';
      markdown += `- **Total Events:** ${metrics.totalEvents}\n`;
      markdown += `- **Real World Span:** ${metrics.timeSpan.realWorld.start.toLocaleDateString()} - ${metrics.timeSpan.realWorld.end.toLocaleDateString()}\n`;
      markdown += `- **In-Game Span:** ${metrics.timeSpan.inGame.start.toLocaleDateString()} - ${metrics.timeSpan.inGame.end.toLocaleDateString()}\n`;
      markdown += `- **Event Density (Real World):** ${metrics.eventDensity.realWorld.toFixed(2)} events/day\n`;
      markdown += `- **Event Density (In-Game):** ${metrics.eventDensity.inGame.toFixed(2)} events/day\n\n`;
    }

    // Conflicts section
    if (options.includeConflicts && conflicts && conflicts.length > 0) {
      markdown += '## Timeline Conflicts\n\n';
      conflicts.forEach(conflict => {
        markdown += `### ${conflict.title} (${conflict.severity})\n`;
        markdown += `${conflict.description}\n\n`;
        markdown += '**Suggestions:**\n';
        conflict.suggestions.forEach(suggestion => {
          markdown += `- ${suggestion}\n`;
        });
        markdown += '\n';
      });
    }

    // Events section
    markdown += '## Timeline Events\n\n';
    
    // Sort events by real world time
    const sortedEvents = [...events].sort((a, b) => 
      a.realWorldTime.getTime() - b.realWorldTime.getTime()
    );

    sortedEvents.forEach(event => {
      markdown += `### ${event.title}\n\n`;
      markdown += `**Real World:** ${event.realWorldTime.toLocaleString()}\n`;
      markdown += `**In-Game:** ${event.inGameTime.toLocaleString()}\n`;
      
      if (event.description) {
        markdown += `**Description:** ${event.description}\n`;
      }
      
      if (event.entityType && event.entityName) {
        markdown += `**Entity:** ${event.entityName} (${event.entityType})\n`;
      }
      
      if (event.participants && event.participants.length > 0) {
        markdown += `**Participants:** ${event.participants.join(', ')}\n`;
      }
      
      if (event.locations && event.locations.length > 0) {
        markdown += `**Locations:** ${event.locations.join(', ')}\n`;
      }
      
      if (event.tags && event.tags.length > 0) {
        markdown += `**Tags:** ${event.tags.join(', ')}\n`;
      }
      
      markdown += '\n---\n\n';
    });

    const blob = new Blob([markdown], { type: 'text/markdown' });

    return {
      success: true,
      data: blob,
      filename: `timeline-export-${this.getTimestamp()}.md`,
      mimeType: 'text/markdown'
    };
  }

  /**
   * Export to PDF format (placeholder - would need PDF library)
   */
  private exportToPDF(
    events: TimelineEventData[],
    options: ExportOptions,
    metrics?: TimelineMetrics,
    conflicts?: TimelineConflict[]
  ): ExportResult {
    // This would require a PDF generation library like jsPDF or Puppeteer
    // For now, return an error indicating this feature is not implemented
    return {
      success: false,
      filename: '',
      mimeType: '',
      error: 'PDF export is not yet implemented. Please use Markdown or JSON format.'
    };
  }

  /**
   * Export to PNG format (placeholder - would need canvas/image generation)
   */
  private exportToPNG(events: TimelineEventData[], options: ExportOptions): ExportResult {
    // This would require canvas manipulation or a chart library
    // For now, return an error indicating this feature is not implemented
    return {
      success: false,
      filename: '',
      mimeType: '',
      error: 'PNG export is not yet implemented. Please use JSON or CSV format.'
    };
  }

  /**
   * Export to SVG format (placeholder - would need SVG generation)
   */
  private exportToSVG(events: TimelineEventData[], options: ExportOptions): ExportResult {
    // This would require SVG generation
    // For now, return an error indicating this feature is not implemented
    return {
      success: false,
      filename: '',
      mimeType: '',
      error: 'SVG export is not yet implemented. Please use JSON or CSV format.'
    };
  }

  /**
   * Filter events based on export options
   */
  private filterEvents(events: TimelineEventData[], options: ExportOptions): TimelineEventData[] {
    let filteredEvents = [...events];

    // Filter by date range
    if (options.dateRange) {
      filteredEvents = filteredEvents.filter(event => 
        event.realWorldTime >= options.dateRange!.start &&
        event.realWorldTime <= options.dateRange!.end
      );
    }

    // Filter by entity types
    if (options.entityFilter?.entityTypes) {
      filteredEvents = filteredEvents.filter(event => 
        event.entityType && options.entityFilter!.entityTypes!.includes(event.entityType)
      );
    }

    // Filter by entity IDs
    if (options.entityFilter?.entityIds) {
      filteredEvents = filteredEvents.filter(event => 
        event.entityId && options.entityFilter!.entityIds!.includes(event.entityId)
      );
    }

    return filteredEvents;
  }

  /**
   * Generate timestamp for filenames
   */
  private getTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  }

  /**
   * Download exported data
   */
  public downloadExport(result: ExportResult): void {
    if (!result.success || !result.data) {
      console.error('Cannot download failed export:', result.error);
      return;
    }

    const url = URL.createObjectURL(result.data as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const timelineExport = TimelineExportService.getInstance();
