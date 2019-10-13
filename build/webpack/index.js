const base = require('./base');
const webpackMerge = require('webpack-merge');
const activeConfig = require(`./${base.env}.js`);

module.exports = webpackMerge(base.config, activeConfig);
