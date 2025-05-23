/**
 * RPG Scribe - Group Component Fixer
 *
 * This script finds and fixes issues with Group components in the codebase.
 * It handles both import statements and component props.
 *
 * Usage:
 * node scripts/group-component-fixer.js [--dry-run] [--verbose] [--path=<path>]
 *
 * Options:
 * --dry-run: Show what would be changed without actually making changes
 * --verbose: Show detailed information about each change
 * --path: Specify a specific file or directory to process (default: src)
 *
 * Example:
 * node scripts/group-component-fixer.js --dry-run --path=src/components
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const pathArg = args.find(arg => arg.startsWith('--path='));
const targetPath = pathArg ? pathArg.split('=')[1] : 'src';

// File extensions to process
const extensions = ['.tsx', '.jsx', '.ts', '.js'];

// Component prop mappings
const propMappings = [
  { component: 'Group', from: /position=\{([^}]+)\}/g, to: 'justify={$1}' },
  { component: 'Group', from: /position="([^"]+)"/g, to: 'justify="$1"' },
  { component: 'Group', from: /spacing=\{([^}]+)\}/g, to: 'gap={$1}' },
  { component: 'Group', from: /spacing="([^"]+)"/g, to: 'gap="$1"' },
  { component: 'Group', from: /direction="([^"]+)"/g, to: 'direction="$1"' },
  { component: 'Group', from: /alignItems="([^"]+)"/g, to: 'align="$1"' },
  { component: 'Group', from: /justifyContent="([^"]+)"/g, to: 'justify="$1"' },
  { component: 'Group', from: /alignItems=\{([^}]+)\}/g, to: 'align={$1}' },
  { component: 'Group', from: /justifyContent=\{([^}]+)\}/g, to: 'justify={$1}' }
];

// Find all files to process
function findFiles(dir, extensions) {
  const files = [];
  for (const ext of extensions) {
    const pattern = path.join(dir, '**', `*${ext}`);
    const matches = glob.sync(pattern);
    files.push(...matches);
  }
  return files;
}

// Process a file to fix Group component issues
function processFile(filePath) {
  if (verbose) {
    console.log(`Processing ${filePath}...`);
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}: ${error.message}`);
    return { success: false, changes: 0 };
  }

  let modifiedContent = content;
  let changes = 0;

  // Check if the file contains Group components
  if (!/<Group[^>]*>/.test(content)) {
    if (verbose) {
      console.log(`No Group components found in ${filePath}`);
    }
    return { success: true, changes: 0 };
  }

  // Check for Material UI Group imports
  const muiGroupImportRegex = /import\s+\{([^}]*Group[^}]*)\}\s+from\s+['"]@mui\/material['"]/g;
  let muiGroupImportMatch;

  while ((muiGroupImportMatch = muiGroupImportRegex.exec(content)) !== null) {
    const importedComponents = muiGroupImportMatch[1].split(',').map(comp => comp.trim());

    // Check if Group is imported
    if (importedComponents.some(comp => comp === 'Group' || comp.endsWith(' as Group'))) {
      // Replace the Material UI Group import with Mantine Group import
      const importStatement = muiGroupImportMatch[0];

      // Remove Group from the Material UI import
      const remainingComponents = importedComponents.filter(comp => comp !== 'Group' && !comp.endsWith(' as Group'));

      if (remainingComponents.length > 0) {
        // Replace the original import with the remaining components
        const newImport = `import { ${remainingComponents.join(', ')} } from '@mui/material'`;
        modifiedContent = modifiedContent.replace(importStatement, newImport);
      } else {
        // Remove the entire import if there are no remaining components
        modifiedContent = modifiedContent.replace(importStatement, '');
      }

      // Check if Mantine Group is already imported
      const mantineGroupImportRegex = /import\s+\{([^}]*Group[^}]*)\}\s+from\s+['"]@mantine\/core['"]/;
      const mantineGroupImportMatch = modifiedContent.match(mantineGroupImportRegex);

      if (mantineGroupImportMatch) {
        // Group is already imported from Mantine, no need to add it
      } else {
        // Check if there's any import from @mantine/core
        const mantineCoreImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@mantine\/core['"]/;
        const mantineCoreImportMatch = modifiedContent.match(mantineCoreImportRegex);

        if (mantineCoreImportMatch) {
          // Add Group to existing Mantine import
          const newImport = `import { ${mantineCoreImportMatch[1]}, Group } from '@mantine/core'`;
          modifiedContent = modifiedContent.replace(mantineCoreImportMatch[0], newImport);
        } else {
          // Add new Mantine import
          const lastImportIndex = modifiedContent.lastIndexOf('import');
          if (lastImportIndex !== -1) {
            const endOfImportIndex = modifiedContent.indexOf(';', lastImportIndex) + 1;
            modifiedContent = modifiedContent.slice(0, endOfImportIndex) +
                             '\nimport { Group } from \'@mantine/core\';' +
                             modifiedContent.slice(endOfImportIndex);
          } else {
            // No imports found, add at the beginning of the file
            modifiedContent = 'import { Group } from \'@mantine/core\';\n' + modifiedContent;
          }
        }
      }

      changes++;
    }
  }

  // Fix Group component props
  for (const mapping of propMappings) {
    const matches = [...modifiedContent.matchAll(mapping.from)];
    if (matches.length > 0) {
      modifiedContent = modifiedContent.replace(mapping.from, mapping.to);
      changes += matches.length;
    }
  }

  if (changes > 0 && !dryRun) {
    try {
      fs.writeFileSync(filePath, modifiedContent, 'utf8');
      if (verbose) {
        console.log(`Made ${changes} changes to ${filePath}`);
      }
    } catch (error) {
      console.error(`Error writing file ${filePath}: ${error.message}`);
      return { success: false, changes };
    }
  }

  return { success: true, changes };
}

// Main function
function main() {
  console.log(`RPG Scribe - Group Component Fixer ${dryRun ? '(DRY RUN)' : ''}`);
  console.log(`Target path: ${targetPath}`);

  // Find all files to process
  console.log('Searching for files to process...');
  const files = findFiles(targetPath, extensions);
  console.log(`Found ${files.length} files to process`);

  // Process each file
  let totalChanges = 0;
  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const result = processFile(file);
    if (result.success) {
      if (result.changes > 0) {
        console.log(`${dryRun ? '[DRY RUN] Would make' : 'Made'} ${result.changes} changes to ${file}`);
        totalChanges += result.changes;
        successCount++;
      }
    } else {
      errorCount++;
    }
  }

  // Print summary
  console.log('\nSummary:');
  console.log(`Total files processed: ${files.length}`);
  console.log(`Files with changes: ${successCount}`);
  console.log(`Files with errors: ${errorCount}`);
  console.log(`Total changes: ${totalChanges}`);

  if (dryRun) {
    console.log('\nThis was a dry run. No changes were made.');
    console.log('Run without --dry-run to apply changes.');
  }
}

// Run the script
main();
