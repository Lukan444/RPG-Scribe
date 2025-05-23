/**
 * RPG Scribe - Critical Issues Fixer
 *
 * This script runs multiple fixers to address critical issues in the codebase.
 * It handles icon migration and Stack component fixes.
 *
 * Usage:
 * node scripts/fix-critical-issues.js [--dry-run] [--verbose] [--path=<path>] [--skip=<fixer-name>]
 *
 * Options:
 * --dry-run: Show what would be changed without actually making changes
 * --verbose: Show detailed information about each change
 * --path: Specify a specific file or directory to process (default: src)
 * --skip: Skip specific fixers (comma-separated list)
 *   Available fixers: icons, stack
 *
 * Example:
 * node scripts/fix-critical-issues.js --dry-run --path=src/components --skip=stack
 */

const { execSync } = require('child_process');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const pathArg = args.find(arg => arg.startsWith('--path='));
const targetPath = pathArg ? pathArg.split('=')[1] : 'src';
const skipArg = args.find(arg => arg.startsWith('--skip='));
const skippedFixers = skipArg ? skipArg.split('=')[1].split(',') : [];

// Available fixers
const fixers = [
  {
    name: 'icons',
    script: 'icon-migration.js',
    description: 'Icon Migration - Replaces Material UI icons with Tabler icons'
  },
  {
    name: 'stack',
    script: 'stack-component-fixer.js',
    description: 'Stack Component Fixer - Fixes Stack component imports and props'
  }
];

// Main function
function main() {
  console.log(`RPG Scribe - Critical Issues Fixer ${dryRun ? '(DRY RUN)' : ''}`);
  console.log(`Target path: ${targetPath}`);

  if (skippedFixers.length > 0) {
    console.log(`Skipping fixers: ${skippedFixers.join(', ')}`);
  }

  // Run each fixer
  const results = [];

  for (const fixer of fixers) {
    if (skippedFixers.includes(fixer.name)) {
      console.log(`\nSkipping ${fixer.description}`);
      continue;
    }

    console.log(`\nRunning ${fixer.description}...`);

    try {
      const command = `node ${fixer.script} ${dryRun ? '--dry-run' : ''} ${verbose ? '--verbose' : ''} --path=${targetPath}`;
      const output = execSync(command, { encoding: 'utf8' });

      console.log(output);

      // Extract summary information
      const filesProcessed = output.match(/Total files processed: (\d+)/);
      const filesWithChanges = output.match(/Files with changes: (\d+)/);
      const filesWithErrors = output.match(/Files with errors: (\d+)/);
      const totalChanges = output.match(/Total changes: (\d+)/);

      results.push({
        name: fixer.name,
        description: fixer.description,
        success: true,
        filesProcessed: filesProcessed ? parseInt(filesProcessed[1]) : 0,
        filesWithChanges: filesWithChanges ? parseInt(filesWithChanges[1]) : 0,
        filesWithErrors: filesWithErrors ? parseInt(filesWithErrors[1]) : 0,
        totalChanges: totalChanges ? parseInt(totalChanges[1]) : 0
      });
    } catch (error) {
      console.error(`Error running ${fixer.script}: ${error.message}`);

      results.push({
        name: fixer.name,
        description: fixer.description,
        success: false,
        error: error.message
      });
    }
  }

  // Print summary
  console.log('\n=== Summary ===');

  let totalFilesWithChanges = 0;
  let totalChanges = 0;

  for (const result of results) {
    if (result.success) {
      console.log(`${result.description}:`);
      console.log(`  Files processed: ${result.filesProcessed}`);
      console.log(`  Files with changes: ${result.filesWithChanges}`);
      console.log(`  Files with errors: ${result.filesWithErrors}`);
      console.log(`  Total changes: ${result.totalChanges}`);

      totalFilesWithChanges += result.filesWithChanges;
      totalChanges += result.totalChanges;
    } else {
      console.log(`${result.description}: FAILED`);
      console.log(`  Error: ${result.error}`);
    }
  }

  console.log('\nOverall:');
  console.log(`  Total files with changes: ${totalFilesWithChanges}`);
  console.log(`  Total changes: ${totalChanges}`);

  if (dryRun) {
    console.log('\nThis was a dry run. No files were modified.');
    console.log('Run without --dry-run to apply changes.');
  }
}

// Run the script
main();