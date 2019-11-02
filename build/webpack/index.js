const base = require('./base');
const env = process.env.NODE_ENV || 'development';
const webpackMerge = require('webpack-merge');
const activeConfig = require(`./${env}.js`);

module.exports = webpackMerge(base, activeConfig);
