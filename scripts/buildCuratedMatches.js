// scripts/buildCuratedMatches.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockMatchesPath = path.resolve(__dirname, '../src/data/mockMatches.ts');
let code = fs.readFileSync(mockMatchesPath, 'utf8');

// Strip TypeScript type import
code = code.replace(/import\s*\{\s*Match\s*\}\s*from\s*['"][^'"]+['"];?/g, '');
code = code.replace(/export\s*const\s*MOCK_MATCHES\s*:\s*Match\[\]\s*=/g, 'export const CURATED_MATCHES =');

const targetPath = path.resolve(__dirname, '../server/curatedMatches.js');
fs.writeFileSync(targetPath, code, 'utf8');
console.log('✅ server/curatedMatches.js successfully generated!');

