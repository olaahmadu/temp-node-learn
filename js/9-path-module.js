const path = require('path');

console.log(path.sep);

//Join method

const filePath = path.join('/content/', 'subfolder', 'text.txt');
console.log(filePath);

const base = path.basename(filePath);
console.log(base);

// Absolute Path

const absolute = path.resolve(__dirname, 'content', 'subfolder', 'text.txt');
console.log(absolute);