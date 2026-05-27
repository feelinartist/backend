const fs = require('fs');
const path = require('path');

const lcovPath = path.join(__dirname, '../coverage/lcov.info');

if (fs.existsSync(lcovPath)) {
    let content = fs.readFileSync(lcovPath, 'utf8');
    // Replace all occurrences of SF:src\... with SF:src/...
    content = content.replace(/^SF:(.*)$/gm, (match, filePath) => {
        return 'SF:' + filePath.replace(/\\/g, '/');
    });
    fs.writeFileSync(lcovPath, content, 'utf8');
    console.log('Successfully normalized backslashes in coverage/lcov.info to forward slashes.');
} else {
    console.warn('coverage/lcov.info not found. Please run tests with coverage first.');
}
