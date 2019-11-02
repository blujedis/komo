const { resolve } = require('path');

const src = 'src';
const dist = 'dist';
const entry = `./${src}`;

module.exports = {

  mode: 'production',
  devtool: 'source-map',
  entry: `${entry}`,

  output: {
    path: resolve(`${dist}`),
    filename: `bundle.js`,
    libraryTarget: 'commonjs2'
  },

  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM',
  }

};
