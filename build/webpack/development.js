const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const DefinePlugin = require('webpack')
  .DefinePlugin;

const src = 'src';
const dist = 'dist';
const pub = 'public';
const entry = `./${src}/example`;

const argv = process.argv.slice(2);
const idx = argv.indexOf('--watch');
const flagExp = /^--?/;

const defaults = {
  debug: []
};

// Doesn't support --flag value only --flag=value
// handles only boolean strings and number/floats.
const options = !~idx ? [] : argv.slice(idx + 1)
  .reduce((a, c, i, arr) => {
    c = c.trim();
    const isFlag = flagExp.test(c)
    if (isFlag) {
      let key = c.replace(flagExp, '');
      let val = true;
      if (~key.indexOf('=')) {
        const segments = key.split('=');
        key = segments[0];
        val = segments[1];
      }
      const isArray = /^\.{3}/.test(val);
      val = isArray ? val.replace(/^\.{3}/, '') : val;
      val = /(true|false)/.test(val) ? Boolean(val) : val;
      val = /\d/.test(val) ? parseFloat(val) : val;
      val = (val + '')
        .includes(',') ? val.split(',')
        .map(v => v.trim())
        .filter(v => v !== '') : val;
      if ((isArray || key === 'debug') && !Array.isArray(val))
        val = [val]
      a[key] = val;
    }
    else {
      a.commands = a.commands || [];
      a.commands.push(c);
    }
    return a;
  }, {});

const devVars = { ...defaults, ...options };

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

    new DefinePlugin({
      __BLU_DEV_VARS__: JSON.stringify(devVars)
    }),

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
