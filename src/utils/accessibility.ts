import { EntityType } from '../models/EntityType';

/**
 * Get aria label for relationship count
 * @param count Relationship count
 * @param entityType Entity type
 * @returns Aria label string
 */
export function getRelationshipCountAriaLabel(count: number, entityType: any): string {
  // Convert entityType to string for formatting
  const entityTypeStr = entityType.toString();

  // Format entity type name
  let entityTypeName = '';

  // Handle special cases
  if (entityTypeStr.toUpperCase().includes('RPGWORLD') || entityTypeStr.toUpperCase().includes('RPG_WORLD')) {
    entityTypeName = 'RPG World';
  } else {
    // Format normal cases
    entityTypeName = entityTypeStr.charAt(0).toUpperCase() + entityTypeStr.slice(1).toLowerCase();
  }

  return `${count} relationship${count !== 1 ? 's' : ''} for this ${entityTypeName.toLowerCase()}`;
}

/**
 * Get aria label for zero relationship indicator
 * @param entityType Entity type
 * @returns Aria label string
 */
export function getZeroRelationshipAriaLabel(entityType: any): string {
  // Convert entityType to string for formatting
  const entityTypeStr = entityType.toString();

  // Format entity type name
  let entityTypeName = '';

  // Handle special cases
  if (entityTypeStr.toUpperCase().includes('RPGWORLD') || entityTypeStr.toUpperCase().includes('RPG_WORLD')) {
    entityTypeName = 'RPG World';
  } else {
    // Format normal cases
    entityTypeName = entityTypeStr.charAt(0).toUpperCase() + entityTypeStr.slice(1).toLowerCase();
  }

  return `No relationships found. Click to add relationships for this ${entityTypeName.toLowerCase()}.`;
}

/**
 * Get keyboard shortcut help text
 * @returns Keyboard shortcut help text
 */
export function getKeyboardShortcutsHelp(): Record<string, string> {
  return {
    'r': 'View relationships',
    'e': 'Edit entity',
    'd': 'Delete entity',
    'n': 'Create new relationship',
    'f': 'Filter relationships',
    'Escape': 'Close dialogs or menus'
  };
}

/**
 * Register keyboard shortcuts for relationship management
 * @param handlers Object with handler functions
 * @returns Cleanup function
 */
export function registerKeyboardShortcuts(handlers: {
  viewRelationships?: () => void;
  editEntity?: () => void;
  deleteEntity?: () => void;
  createRelationship?: () => void;
  filterRelationships?: () => void;
}): () => void {
  const handleKeyDown = (event: KeyboardEvent) => {
    // Skip if user is typing in an input field
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    switch (event.key.toLowerCase()) {
      case 'r':
        if (handlers.viewRelationships) handlers.viewRelationships();
        break;
      case 'e':
        if (handlers.editEntity) handlers.editEntity();
        break;
      case 'd':
        if (handlers.deleteEntity) handlers.deleteEntity();
        break;
      case 'n':
        if (handlers.createRelationship) handlers.createRelationship();
        break;
      case 'f':
        if (handlers.filterRelationships) handlers.filterRelationships();
        break;
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}
