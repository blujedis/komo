const { resolve } = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const env = process.env.NODE_ENV || 'development';

const src = 'src';
const dist = 'dist/example';
const pub = 'public';
const entry = 'example';
const outfile = 'bundle.js';
const resolver = (key, ...args) => resolve(key, ...args);

const config = {

  entry: `./${src}/${entry}`,
  output: {
    path: resolve(`${dist}`),
    filename: `${outfile}`
  },

  // Don't show child stats.
  stats: 'minimal',

  plugins: [
    new CopyWebpackPlugin([
      { from: resolve(`${pub}`), to: resolve(`${dist}`) }
    ]),
    new HtmlWebpackPlugin({
      title: 'Komo',
      template: resolve(`${src}/index.html`),
      hash: true,
    }),
    new webpack.ProgressPlugin(),
  ],

  module: {
    rules: [
    {
      test: /\.(ts|tsx)$/,
      loader: 'babel-loader',
    }]
  },

  resolve: { extensions: ['.js', '.jsx', '.tsx', '.ts', '.json'] },

  // Comment out if you do not
  // wish to manually inject React CDNs.
  // externals: {
  //   'react': 'React',
  //   'react-dom': 'ReactDOM',
  // }

};

module.exports = {
  env,
  src,
  dist,
  entry,
  outfile,
  resolver,
  config
};
