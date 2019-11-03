const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const src = 'src';
const dist = 'dist';
const pub = 'public';
const entry = `./${src}/example`;

module.exports = {

  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  entry: `${entry}`,

  devServer: {
    historyApiFallback: true,
  },

  output: {
    path: resolve(`${dist}`),
    filename: `bundle.[hash].js`,
    publicPath: '/'
  },

  plugins: [

    new CopyWebpackPlugin([
      { from: resolve(`${pub}`), to: resolve(`${dist}`) }
    ]),

    new HtmlWebpackPlugin({
      title: 'Komo',
      template: resolve(`${src}/index.html`),
      hash: true,
    })

  ]

};
