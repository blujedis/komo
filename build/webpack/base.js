const webpack = require('webpack');

module.exports = {

  stats: 'minimal',

  plugins: [
    new webpack.ProgressPlugin(),
  ],

  module: {
    rules: [
    {
      test: /\.(ts|tsx)$/,
      loader: 'babel-loader'
    }]
  },

  resolve: { extensions: ['.js', '.jsx', '.tsx', '.ts', '.json'] }

};
