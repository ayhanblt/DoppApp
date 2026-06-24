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
    if (content.includes('TouchableOpacity')) {
        // Replace <TouchableOpacity with <Pressable
        content = content.replace(/<TouchableOpacity/g, '<Pressable');
        content = content.replace(/<\/TouchableOpacity>/g, '</Pressable>');
        
        // Update imports
        if (content.includes('TouchableOpacity') && !content.includes('Pressable')) {
            content = content.replace(/TouchableOpacity/g, 'Pressable');
        } else if (content.includes('TouchableOpacity') && content.includes('Pressable')) {
            content = content.replace(/,\s*TouchableOpacity|TouchableOpacity,\s*/g, '');
            content = content.replace(/TouchableOpacity/g, 'Pressable');
        }
        
        fs.writeFileSync(file, content);
        console.log('Updated ' + file);
    }
});
