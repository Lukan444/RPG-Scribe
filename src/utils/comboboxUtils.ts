/**
 * Utility functions for working with Mantine Combobox components
 */

/**
 * Creates a safe ComboboxItem from an entity
 * Ensures that the label is always a string, even if the entity name is undefined
 * 
 * @param id The entity ID
 * @param name The entity name
 * @returns A ComboboxItem with a safe label
 */
export function createComboboxItem(id: string | undefined, name: string | undefined): { value: string; label: string } {
  return {
    value: id || '',
    label: name || 'Unnamed'
  };
}

/**
 * Maps an array of entities to ComboboxItems
 * Ensures that all labels are strings, even if entity names are undefined
 * 
 * @param entities An array of entities with id and name properties
 * @returns An array of ComboboxItems with safe labels
 */
export function mapEntitiesToComboboxItems<T extends { id?: string; name?: string }>(
  entities: T[]
): { value: string; label: string }[] {
  return entities.map(entity => createComboboxItem(entity.id, entity.name));
}
