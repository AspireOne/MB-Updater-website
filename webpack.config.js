const path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/js/main.js',
    output: {
        path: path.resolve(__dirname, 'public'),
        filename: 'bundle.js',
    },
};