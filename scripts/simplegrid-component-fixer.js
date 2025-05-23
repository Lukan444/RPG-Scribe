/**
 * RPG Scribe - SimpleGrid Component Fixer
 *
 * This script finds and fixes issues with SimpleGrid components in the codebase.
 * It handles both import statements and component props.
 *
 * Usage:
 * node scripts/simplegrid-component-fixer.js [--dry-run] [--verbose] [--path=<path>]
 *
 * Options:
 * --dry-run: Show what would be changed without actually making changes
 * --verbose: Show detailed information about each change
 * --path: Specify a specific file or directory to process (default: src)
 *
 * Example:
 * node scripts/simplegrid-component-fixer.js --dry-run --path=src/components
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
  { component: 'SimpleGrid', from: /spacing=\{([^}]+)\}/g, to: 'gap={$1}' },
  { component: 'SimpleGrid', from: /spacing="([^"]+)"/g, to: 'gap="$1"' }
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

// Process a file to fix SimpleGrid component issues
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

  // Check if the file contains SimpleGrid components
  if (!/<SimpleGrid[^>]*>/.test(content)) {
    if (verbose) {
      console.log(`No SimpleGrid components found in ${filePath}`);
    }
    return { success: true, changes: 0 };
  }

  // Fix SimpleGrid component props
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
  console.log(`RPG Scribe - SimpleGrid Component Fixer ${dryRun ? '(DRY RUN)' : ''}`);
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
