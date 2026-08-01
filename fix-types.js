const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/lib/types.ts');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split(/\r?\n/);

const newLines = [];
let inTable = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^ {6}[a-zA-Z0-9_]+: \{/.test(line)) {
        inTable = true;
    }

    if (inTable && /^ {6}\};$/.test(line)) {
        newLines.push('        Relationships: [];');
        inTable = false;
    }

    if (/^ {4}\};$/.test(line) && !inTable) {
        // This is the closing of Tables: {
        newLines.push('    Views: {};');
        newLines.push('    Functions: {};');
    }

    newLines.push(line);
}

fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
console.log('Types fixed successfully!');
