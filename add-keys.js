const fs = require('fs');
const path = require('path');

const dir = 'modules/data/defs';
const files = fs.readdirSync(dir);

const keyMap = {
    "AUDIT SUITE": "audit",
    "SECURITY": "security",
    "DNS": "dns",
    "EMAIL": "email",
    "WEB CORE": "web",
    "PERF & UI": "perf",
    "NETWORK": "network",
    "EXTERNAL": "external",
    "SESSION & TABS": "tabs",
    "SYSTEM & UTILS": "system",
    "EMULATION & DEBUGGING": "emu",
    "FUN & EGGS": "fun"
};

for (const file of files) {
    if (!file.endsWith('.js')) continue;
    const p = path.join(dir, file);
    let content = fs.readFileSync(p, 'utf8');
    
    // Find category: "..." and insert key: "..."
    content = content.replace(/category:\s*"([^"]+)"/g, (match, cat) => {
        const key = keyMap[cat] || cat.split(" ")[0].toLowerCase();
        return `category: "${cat}",\n        key: "${key}"`;
    });
    
    fs.writeFileSync(p, content);
}
console.log("Done");
