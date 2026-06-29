import fs from 'fs';
import path from 'path';

const filePath = path.resolve('./src/pages/DashboardAdmin.tsx');
const content = fs.readFileSync(filePath, 'utf-8');

// Find the start of the tabs rendering
const renderStart = content.indexOf('{/* TAB A:');
if (renderStart === -1) {
    console.error("Could not find TAB A start");
    process.exit(1);
}

// Write the output to a temporary JSON file so we can see the parts.
const lines = content.split('\n');
const tabs = [];

let currentTab = null;
let braceCount = 0;
let insideTab = false;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Look for activeTab === "..."
    const match = line.match(/activeTab === "([^"]+)" && \(/);
    if (match) {
        if (currentTab) {
            tabs.push(currentTab);
        }
        currentTab = {
            id: match[1],
            startLine: i + 1, // 1-indexed
            lines: [line]
        };
        insideTab = true;
        braceCount = 0; // count braces for this tab block
    } else if (insideTab) {
        currentTab.lines.push(line);
        // Simple brace counting, not perfectly AST compliant but usually works for clean JSX.
        // Wait, JSX might have braces, but the root is `activeTab === "xyz" && (` ... `)`
        // Actually, it's better to just regex the start lines.
    }
}
if (currentTab) tabs.push(currentTab);

const tabInfo = tabs.map(t => ({
    id: t.id,
    startLine: t.startLine,
    length: t.lines.length
}));

fs.writeFileSync('tabs_debug.json', JSON.stringify(tabInfo, null, 2));
console.log("Written tabs_debug.json");
