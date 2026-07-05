const fs = require('fs');
const path = require('path');

let totalFixed = 0;
const fixedFiles = [];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) {
      if (f !== 'node_modules' && f !== 'dist' && f !== '.git') walk(fp);
    } else if (fp.match(/\.(vue|js|ts)$/) && !fp.includes('fix-urls')) {
      let content = fs.readFileSync(fp, 'utf8');
      
      // Count hardcoded occurrences
      const matches = content.match(/["'`]http:\/\/localhost:3000/g);
      if (!matches) continue;
      
      const count = matches.length;
      const relPath = path.relative(process.cwd(), fp);
      
      // Check if file already imports api.js or has baseURL set
      const hasApiImport = content.includes("from '@/services/api") || 
                           content.includes("from '../services/api") ||
                           content.includes("from '../../services/api");
      const hasAxiosImport = content.includes("import axios from") || content.includes("import api from");
      
      // Strategy: Replace full hardcoded URLs with relative paths (axios baseURL handles the rest)
      // For files using axios with api.js baseURL, just remove the domain
      // For files using fetch or manual URLs, use import.meta.env.VITE_API_URL
      
      let newContent = content;
      
      // Pattern 1: axios.get("http://localhost:3000/path") -> axios.get("/path")
      // Pattern 2: axios.post("http://localhost:3000/path") -> axios.post("/path")
      // Pattern 3: `http://localhost:3000/path` -> `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/path`
      // Pattern 4: "http://localhost:3000/path" in fetch/io/non-axios -> use env var
      
      // For .vue and .js files that use axios (most of them), 
      // the safest fix is to replace the full URL with just the path
      // since axios.defaults.baseURL is already set from VITE_API_URL in api.js
      
      if (hasAxiosImport || hasApiImport) {
        // These files use axios which has baseURL configured
        // Replace: axios.get("http://localhost:3000/grades") -> axios.get("/grades")
        newContent = newContent.replace(/["']http:\/\/localhost:3000(\/[^"'`]*?)["']/g, (match, urlPath) => {
          const quote = match[0];
          return quote + urlPath + quote;
        });
        // Template literals: `http://localhost:3000/path/${id}` -> `/path/${id}`
        newContent = newContent.replace(/`http:\/\/localhost:3000(\/[^`]*?)`/g, '`$1`');
      }
      
      // For socket.io connections, use VITE_API_URL
      newContent = newContent.replace(
        /io\(['"]http:\/\/localhost:3000(\/[^'"]*)['"]/g,
        "io(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}$1`"
      );
      
      // For any remaining hardcoded full URLs (fetch, etc), use env var
      newContent = newContent.replace(
        /["']http:\/\/localhost:3000(\/[^"']*?)["']/g,
        (match, urlPath) => {
          const quote = match[0];
          return '`${import.meta.env.VITE_API_URL || "http://localhost:3000"}' + urlPath + '`';
        }
      );
      
      // For template literals with hardcoded URL  
      newContent = newContent.replace(
        /`http:\/\/localhost:3000(\/[^`]*?)`/g,
        '`${import.meta.env.VITE_API_URL || "http://localhost:3000"}$1`'
      );
      
      if (newContent !== content) {
        fs.writeFileSync(fp, newContent, 'utf8');
        const remaining = (newContent.match(/http:\/\/localhost:3000/g) || []).length;
        console.log(`✅ Fixed ${count} URLs in ${relPath}${remaining ? ` (${remaining} remaining in fallbacks)` : ''}`);
        totalFixed += count;
        fixedFiles.push(relPath);
      }
    }
  }
}

walk('src');
console.log(`\n🎉 Done! Fixed ${totalFixed} hardcoded URLs across ${fixedFiles.length} files`);
