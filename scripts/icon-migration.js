/**
 * RPG Scribe - Icon Migration Script
 *
 * This script finds and replaces Material UI icon imports with Tabler icon imports.
 * It handles both import statements and component usage.
 *
 * Usage:
 * node scripts/icon-migration.js [--dry-run] [--verbose] [--path=<path>]
 *
 * Options:
 * --dry-run: Show what would be changed without actually making changes
 * --verbose: Show detailed information about each change
 * --path: Specify a specific file or directory to process (default: src)
 *
 * Example:
 * node scripts/icon-migration.js --dry-run --path=src/components
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

// Icon mapping from Material UI to Tabler
const iconMapping = {
  // Navigation & UI
  'Dashboard': 'IconDashboard',
  'Menu': 'IconMenu2',
  'Search': 'IconSearch',
  'Settings': 'IconSettings',
  'Notifications': 'IconBell',
  'Help': 'IconHelp',
  'Info': 'IconInfoCircle',
  'Warning': 'IconAlertTriangle',
  'Error': 'IconAlertCircle',
  'Add': 'IconPlus',
  'Edit': 'IconEdit',
  'Delete': 'IconTrash',
  'Close': 'IconX',
  'Check': 'IconCheck',
  'MoreVert': 'IconDotsVertical',
  'MoreHoriz': 'IconDotsHorizontal',
  'ArrowBack': 'IconArrowLeft',
  'ArrowForward': 'IconArrowRight',
  'KeyboardArrowDown': 'IconChevronDown',
  'KeyboardArrowUp': 'IconChevronUp',
  'KeyboardArrowLeft': 'IconChevronLeft',
  'KeyboardArrowRight': 'IconChevronRight',
  'ExpandMore': 'IconChevronDown',
  'ExpandLess': 'IconChevronUp',
  'Refresh': 'IconRefresh',
  'FilterList': 'IconFilter',
  'Sort': 'IconArrowsSort',
  'Visibility': 'IconEye',
  'VisibilityOff': 'IconEyeOff',
  'Favorite': 'IconHeart',
  'FavoriteBorder': 'IconHeartFilled',
  'Star': 'IconStar',
  'StarBorder': 'IconStarFilled',
  'Bookmark': 'IconBookmark',
  'BookmarkBorder': 'IconBookmarkFilled',

  // RPG specific
  'Public': 'IconWorld',
  'Campaign': 'IconBook',
  'Event': 'IconCalendarEvent',
  'Person': 'IconUser',
  'LocationOn': 'IconMapPin',
  'Inventory': 'IconBackpack',
  'Timeline': 'IconTimeline',
  'Psychology': 'IconBrain',
  'AccountTree': 'IconNetwork',
  'RateReview': 'IconFileDescription',
  'Chat': 'IconMessageCircle',
  'Analytics': 'IconChartBar',
  'Keyboard': 'IconKeyboard',
  'Storage': 'IconDatabase',
  'AutoAwesome': 'IconSparkles',
  'Terrain': 'IconMountain',
  'School': 'IconSchool',
  'NewReleases': 'IconNews',
  'VideoLibrary': 'IconVideo',
  'Category': 'IconCategory',
  'Place': 'IconMapPin',
  'Star': 'IconStar',
  'Lightbulb': 'IconBulb',
  'Dice': 'IconDice',
  'Sword': 'IconSword',
  'Scroll': 'IconScroll',
  'Shield': 'IconShield',
  'Map': 'IconMap',
  'Book': 'IconBook',
  'Potion': 'IconFlask',
  'Wand': 'IconWand',
  'Crown': 'IconCrown',
  'Skull': 'IconSkull',
  'Dragon': 'IconDragon',
  'Castle': 'IconBuilding',
  'Dungeon': 'IconDoor',
  'Treasure': 'IconCoins',
  'Quest': 'IconFlag',
  'Spell': 'IconFlare',
  'Armor': 'IconArmchair',
  'Weapon': 'IconSword',
  'Tools': 'IconTools'
};

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

// Process a file to replace Material UI icons with Tabler icons
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

  // Find Material UI icon imports
  const muiIconImportRegex = /import\s+\{([^}]+)\}\s+from\s+['"]@mui\/icons-material['"]/g;
  let muiIconImportMatch;
  let tablerIconsToImport = new Set();

  while ((muiIconImportMatch = muiIconImportRegex.exec(content)) !== null) {
    const importedIcons = muiIconImportMatch[1].split(',').map(icon => {
      // Extract the icon name and alias if present
      const parts = icon.trim().split(/\s+as\s+/);
      return {
        original: icon.trim(),
        name: parts[0].trim(),
        alias: parts[1]?.trim() || parts[0].trim()
      };
    });

    // Map Material UI icons to Tabler icons
    const mappedIcons = importedIcons.map(icon => {
      const baseName = icon.name.replace(/^[^A-Za-z]+/, ''); // Remove any non-alphabetic prefix
      const tablerIcon = iconMapping[baseName];

      if (tablerIcon) {
        tablerIconsToImport.add(tablerIcon);
        return {
          original: icon.original,
          mapped: tablerIcon,
          alias: icon.alias
        };
      }

      return null;
    }).filter(Boolean);

    if (mappedIcons.length > 0) {
      // Replace the Material UI icon imports with Tabler icon imports
      const importStatement = muiIconImportMatch[0];
      modifiedContent = modifiedContent.replace(importStatement, '');
      changes++;
    }
  }

  // Add Tabler icon imports if needed
  if (tablerIconsToImport.size > 0) {
    const tablerImport = `import { ${Array.from(tablerIconsToImport).join(', ')} } from '@tabler/icons-react';`;

    // Check if there's already a Tabler import
    const existingTablerImport = /import\s+\{([^}]+)\}\s+from\s+['"]@tabler\/icons-react['"]/;
    const existingMatch = modifiedContent.match(existingTablerImport);

    if (existingMatch) {
      // Merge with existing import
      const existingIcons = existingMatch[1].split(',').map(i => i.trim());
      const allIcons = new Set([...existingIcons, ...tablerIconsToImport]);
      const newImport = `import { ${Array.from(allIcons).join(', ')} } from '@tabler/icons-react';`;
      modifiedContent = modifiedContent.replace(existingMatch[0], newImport);
    } else {
      // Add new import after the last import statement
      const lastImportIndex = modifiedContent.lastIndexOf('import');
      if (lastImportIndex !== -1) {
        const endOfImportIndex = modifiedContent.indexOf(';', lastImportIndex) + 1;
        modifiedContent = modifiedContent.slice(0, endOfImportIndex) +
                         '\n' + tablerImport +
                         modifiedContent.slice(endOfImportIndex);
      } else {
        // No imports found, add at the beginning of the file
        modifiedContent = tablerImport + '\n' + modifiedContent;
      }
    }
    changes++;
  }

  // Replace icon usage in the code
  for (const [muiIcon, tablerIcon] of Object.entries(iconMapping)) {
    // Replace <MuiIcon /> with <TablerIcon />
    const iconRegex = new RegExp(`<${muiIcon}(\\s|\\/>|>)`, 'g');
    const iconMatches = modifiedContent.match(iconRegex);
    if (iconMatches) {
      modifiedContent = modifiedContent.replace(iconRegex, `<${tablerIcon}$1`);
      changes += iconMatches.length;
    }

    // Replace </MuiIcon> with </TablerIcon>
    const closeTagRegex = new RegExp(`</${muiIcon}>`, 'g');
    const closeTagMatches = modifiedContent.match(closeTagRegex);
    if (closeTagMatches) {
      modifiedContent = modifiedContent.replace(closeTagRegex, `</${tablerIcon}>`);
      changes += closeTagMatches.length;
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
  console.log(`RPG Scribe - Icon Migration Script ${dryRun ? '(DRY RUN)' : ''}`);
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

  console.log('\nSummary:');
  console.log(`Total files processed: ${files.length}`);
  console.log(`Files with changes: ${successCount}`);
  console.log(`Files with errors: ${errorCount}`);
  console.log(`Total changes: ${totalChanges}`);

  if (dryRun) {
    console.log('\nThis was a dry run. No files were modified.');
    console.log('Run without --dry-run to apply changes.');
  }
}

// Run the script
main();