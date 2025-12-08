const fs = require('fs');
const path = require('path');

// Create upload directories
const directories = [
    'uploads',
    'uploads/drivers',
    'uploads/boats',
];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    } else {
        console.log(`ℹ️  Directory already exists: ${dir}`);
    }
});

console.log('✅ Upload directories ready!');

