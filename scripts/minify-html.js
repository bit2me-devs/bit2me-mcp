import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const landingPath = path.join(__dirname, '../landing/index.html');
const isProduction = process.env.NODE_ENV === 'production' || process.env.MINIFY === 'true';

function minifyHTML(html) {
    let minified = html;
    
    // Step 1: Protect script and style blocks
    const scriptBlocks = [];
    const styleBlocks = [];
    let blockIndex = 0;
    
    // Extract and replace script blocks
    minified = minified.replace(/<script[\s\S]*?<\/script>/gi, (match) => {
        scriptBlocks.push(match);
        return `__SCRIPT_BLOCK_${blockIndex++}__`;
    });
    
    // Extract and replace style blocks
    minified = minified.replace(/<style[\s\S]*?<\/style>/gi, (match) => {
        styleBlocks.push(match);
        return `__STYLE_BLOCK_${blockIndex++}__`;
    });
    
    // Step 2: Remove HTML comments (but preserve conditional comments)
    minified = minified.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
    
    // Step 3: Remove whitespace between tags
    minified = minified.replace(/>\s+</g, '><');
    
    // Step 4: Remove leading/trailing whitespace from lines
    minified = minified.replace(/^\s+|\s+$/gm, '');
    
    // Step 5: Collapse multiple spaces to single space (but be careful)
    minified = minified.replace(/[ \t]+/g, ' ');
    
    // Step 6: Remove whitespace around certain attributes (but preserve spaces in attribute values)
    minified = minified.replace(/\s*=\s*/g, '=');
    minified = minified.replace(/\s+>/g, '>');
    
    // Step 7: Remove newlines and carriage returns
    minified = minified.replace(/[\r\n]+/g, '');
    
    // Step 8: Remove spaces before closing tags
    minified = minified.replace(/\s+<\//g, '</');
    
    // Step 9: Restore script blocks
    blockIndex = 0;
    minified = minified.replace(/__SCRIPT_BLOCK_(\d+)__/g, () => scriptBlocks[blockIndex++]);
    
    // Step 10: Restore style blocks
    blockIndex = 0;
    minified = minified.replace(/__STYLE_BLOCK_(\d+)__/g, () => styleBlocks[blockIndex++]);
    
    return minified.trim();
}

if (isProduction) {
    console.log('🔨 Minificando HTML para producción...');
    const html = fs.readFileSync(landingPath, 'utf8');
    const originalSize = html.length;
    const minified = minifyHTML(html);
    const minifiedSize = minified.length;
    
    fs.writeFileSync(landingPath, minified);
    
    console.log(`✅ HTML minificado:`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(2)} KB (${originalSize.toLocaleString()} bytes)`);
    console.log(`   Minificado: ${(minifiedSize / 1024).toFixed(2)} KB (${minifiedSize.toLocaleString()} bytes)`);
    console.log(`   Reducción: ${((1 - minifiedSize / originalSize) * 100).toFixed(1)}%`);
} else {
    console.log('ℹ️  Modo desarrollo: HTML no se minifica');
    console.log('   Para minificar, ejecuta con: MINIFY=true node scripts/minify-html.js');
}

