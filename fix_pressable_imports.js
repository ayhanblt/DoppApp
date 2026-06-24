const fs = require('fs');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('mobile/src').concat(walk('mobile/app'));

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('<Pressable') && !content.includes('Pressable')) {
        // This shouldn't happen, but let's check
    }
    
    // Check if Pressable is imported
    const importRegex = /import\s+{([^}]*)}\s+from\s+['"]react-native['"]/;
    const match = content.match(importRegex);
    if (match && content.includes('<Pressable')) {
        const importedItems = match[1].split(',').map(s => s.trim());
        if (!importedItems.includes('Pressable')) {
            const newImportedItems = [...importedItems, 'Pressable'].filter(Boolean).join(', ');
            const newImportString = `import { ${newImportedItems} } from 'react-native'`;
            content = content.replace(match[0], newImportString);
            fs.writeFileSync(file, content);
            console.log('Fixed imports in ' + file);
        }
    } else if (content.includes('<Pressable')) {
        // if no react-native import exists at all
        content = "import { Pressable } from 'react-native';\n" + content;
        fs.writeFileSync(file, content);
        console.log('Added import to ' + file);
    }
});
