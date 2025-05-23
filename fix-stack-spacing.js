const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript and TSX files in the src directory
const files = glob.sync('src/**/*.{ts,tsx}', { cwd: process.cwd() });

let totalReplacements = 0;
let filesModified = 0;

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if the file contains Stack components with spacing prop
  if (content.includes('<Stack') && content.includes('spacing=')) {
    // Replace spacing prop with gap prop using regex with lookahead and lookbehind
    const newContent = content.replace(/<Stack([^>]*?)spacing([\s]*?)=([\s]*?)(["{0-9])/g, '<Stack$1gap$2=$3$4');
    
    // Count replacements
    const replacements = (content.match(/<Stack([^>]*?)spacing([\s]*?)=([\s]*?)(["{0-9])/g) || []).length;
    
    if (replacements > 0) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`Modified ${file}: ${replacements} replacements`);
      totalReplacements += replacements;
      filesModified++;
    }
  }
});

console.log(`\nTotal: ${totalReplacements} replacements in ${filesModified} files`);