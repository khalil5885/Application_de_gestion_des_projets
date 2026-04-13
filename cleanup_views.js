const fs = require('fs');
const path = require('path');

const viewsDir = path.join(__dirname, 'coreui', 'src', 'views');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

const docsSelfClosingRegex = /<(?:DocsComponents|DocsCallout|DocsLink|DocsExample|DocsIcons)[^>]*\/>/g;
const docsOpenRegex = /<(?:DocsComponents|DocsCallout|DocsLink|DocsExample|DocsIcons)[^>]*>/g;
const docsCloseRegex = /<\/(?:DocsComponents|DocsCallout|DocsLink|DocsExample|DocsIcons)>/g;

const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]src\/components['"]/g;
const emptyImportRegex = /import\s*\{\s*\}\s*from\s*['"]src\/components['"][\r\n]*/g;

walkDir(viewsDir, (filePath) => {
    if (!filePath.endsWith('.js')) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    content = content.replace(docsSelfClosingRegex, '');
    content = content.replace(docsOpenRegex, '');
    content = content.replace(docsCloseRegex, '');

    content = content.replace(importRegex, (match, group) => {
        let newGroup = group.split(',').map(s => s.trim()).filter(s => {
            return !['DocsComponents', 'DocsExample', 'DocsLink', 'DocsCallout', 'DocsIcons'].includes(s) && s !== '';
        });
        if (newGroup.length === 0) return '';
        return `import { ${newGroup.join(', ')} } from 'src/components'`;
    });

    content = content.replace(emptyImportRegex, '');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Cleaned ${filePath}`);
    }
});
